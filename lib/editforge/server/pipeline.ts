import { stat, writeFile } from "node:fs/promises";
import path from "node:path";

import { EDIT_STYLES, OUTPUT_FILE_NAME, OUTPUT_FORMATS, TARGET_FPS } from "@/lib/editforge/constants";
import type { ProbedClip, StoredJobManifest, TimelineSegment } from "@/lib/editforge/types";
import { getFfmpegPath } from "@/lib/editforge/server/binaries";
import { assertMediaBinariesAvailable, probeDurationSeconds, runProcess } from "@/lib/editforge/server/media";
import { getJobPaths, readManifest, removeWorkingFiles } from "@/lib/editforge/server/storage";
import { updateJobStatus } from "@/lib/editforge/server/status";
import { clamp, seededRandom, shuffleWithSeed } from "@/lib/editforge/utils";

function formatSeconds(value: number) {
  return value.toFixed(3);
}

function normalizeForConcat(filePath: string) {
  return filePath.replace(/\\/g, "/").replace(/'/g, "'\\''");
}

function getVideoFilter(manifest: StoredJobManifest) {
  const format = OUTPUT_FORMATS.find((item) => item.id === manifest.options.outputFormat);

  if (!format) {
    throw new Error("Unsupported output format.");
  }

  return {
    format,
    filter: `scale=${format.width}:${format.height}:force_original_aspect_ratio=increase,crop=${format.width}:${format.height},fps=${TARGET_FPS},format=yuv420p,setsar=1`
  };
}

function buildTimelineSegments(jobId: string, manifest: StoredJobManifest, clips: ProbedClip[]) {
  const style = EDIT_STYLES.find((item) => item.id === manifest.options.editStyle);
  const paths = getJobPaths(jobId);

  if (!style) {
    throw new Error("Unsupported edit style.");
  }

  const usableClips = clips.filter((clip) => clip.durationSeconds > 0.25);

  if (usableClips.length === 0) {
    throw new Error("Uploaded clips are too short to render.");
  }

  return async (audioDurationSeconds: number) => {
    const orderedClips =
      manifest.options.clipOrdering === "random" ? shuffleWithSeed(usableClips, `${jobId}:clips`) : usableClips;

    const segments: TimelineSegment[] = [];
    let accumulatedSeconds = 0;
    let cursor = 0;

    while (accumulatedSeconds < audioDurationSeconds - 0.05 && segments.length < 180) {
      const clip = orderedClips[cursor % orderedClips.length];
      const remainingSeconds = Math.max(audioDurationSeconds - accumulatedSeconds, 0.2);
      const jitter = (seededRandom(jobId, cursor) * 2 - 1) * style.variationSeconds;
      const plannedSeconds = clamp(
        style.baseSegmentSeconds + jitter,
        style.minSegmentSeconds,
        style.maxSegmentSeconds
      );
      const durationSeconds = Math.max(0.2, Math.min(plannedSeconds, clip.durationSeconds, remainingSeconds + 0.15));
      const maxStart = Math.max(clip.durationSeconds - durationSeconds, 0);
      const startSeconds = maxStart > 0 ? seededRandom(`${jobId}:${clip.originalName}`, cursor) * maxStart : 0;

      segments.push({
        segmentIndex: cursor,
        sourcePath: clip.absolutePath,
        sourceName: clip.originalName,
        startSeconds: Number(startSeconds.toFixed(3)),
        durationSeconds: Number(durationSeconds.toFixed(3)),
        outputPath: path.join(paths.intermediateDir, `segment-${String(cursor).padStart(3, "0")}.mp4`)
      });

      accumulatedSeconds += durationSeconds;
      cursor += 1;
    }

    if (segments.length === 0) {
      throw new Error("Unable to build a timeline from the uploaded clips.");
    }

    return segments;
  };
}

async function analyzeClips(manifest: StoredJobManifest) {
  const clips = await Promise.all(
    manifest.clips.map(async (clip) => ({
      ...clip,
      durationSeconds: await probeDurationSeconds(clip.absolutePath)
    }))
  );

  return clips;
}

async function renderSegment(jobId: string, manifest: StoredJobManifest, segment: TimelineSegment) {
  const ffmpegPath = getFfmpegPath();
  const { filter } = getVideoFilter(manifest);

  await runProcess(ffmpegPath, [
    "-y",
    "-ss",
    formatSeconds(segment.startSeconds),
    "-t",
    formatSeconds(segment.durationSeconds),
    "-i",
    segment.sourcePath,
    "-vf",
    filter,
    "-an",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    segment.outputPath
  ]);

  await updateJobStatus(jobId, {
    state: "processing"
  });
}

async function concatenateSegments(jobId: string, segments: TimelineSegment[]) {
  const ffmpegPath = getFfmpegPath();
  const paths = getJobPaths(jobId);
  const concatListPath = path.join(paths.intermediateDir, "concat.txt");
  const assembledPath = path.join(paths.intermediateDir, "assembled.mp4");

  const concatContents = segments.map((segment) => `file '${normalizeForConcat(segment.outputPath)}'`).join("\n");
  await writeFile(concatListPath, concatContents, "utf8");

  await runProcess(ffmpegPath, [
    "-y",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    concatListPath,
    "-an",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-pix_fmt",
    "yuv420p",
    assembledPath
  ]);

  return assembledPath;
}

async function overlayAudio(jobId: string, manifest: StoredJobManifest, assembledPath: string, audioDurationSeconds: number) {
  const ffmpegPath = getFfmpegPath();
  const outputPath = path.join(getJobPaths(jobId).outputDir, OUTPUT_FILE_NAME);

  await runProcess(ffmpegPath, [
    "-y",
    "-i",
    assembledPath,
    "-i",
    manifest.audio.absolutePath,
    "-map",
    "0:v:0",
    "-map",
    "1:a:0",
    "-c:v",
    "copy",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-t",
    formatSeconds(audioDurationSeconds),
    "-shortest",
    "-movflags",
    "+faststart",
    outputPath
  ]);

  return outputPath;
}

export async function runEditJob(jobId: string) {
  try {
    await assertMediaBinariesAvailable();

    const manifest = await readManifest(jobId);
    const { format } = getVideoFilter(manifest);

    await updateJobStatus(jobId, {
      state: "processing",
      progress: 8,
      stage: "Analyzing media",
      message: "Reading audio length and source clip durations."
    });

    const audioDurationSeconds = await probeDurationSeconds(manifest.audio.absolutePath);
    const clips = await analyzeClips(manifest);
    const buildSegments = buildTimelineSegments(jobId, manifest, clips);
    const segments = await buildSegments(audioDurationSeconds);

    for (const [index, segment] of segments.entries()) {
      const progress = Math.round(12 + (index / segments.length) * 58);

      await updateJobStatus(jobId, {
        state: "processing",
        progress,
        stage: "Normalizing clips",
        message: `Rendering segment ${index + 1} of ${segments.length} from ${segment.sourceName}.`
      });

      await renderSegment(jobId, manifest, segment);
    }

    await updateJobStatus(jobId, {
      state: "processing",
      progress: 74,
      stage: "Concatenating timeline",
      message: "Combining normalized segments into one video timeline."
    });

    const assembledPath = await concatenateSegments(jobId, segments);

    await updateJobStatus(jobId, {
      state: "processing",
      progress: 88,
      stage: "Overlaying soundtrack",
      message: "Muxing the soundtrack and finalizing the MP4 export."
    });

    const outputPath = await overlayAudio(jobId, manifest, assembledPath, audioDurationSeconds);
    const outputStats = await stat(outputPath);

    await removeWorkingFiles(jobId);

    await updateJobStatus(jobId, {
      state: "completed",
      progress: 100,
      stage: "Export ready",
      message: "Your edit is ready to preview and download.",
      output: {
        fileName: OUTPUT_FILE_NAME,
        downloadUrl: `/api/edit-jobs/${jobId}/download`,
        sizeBytes: outputStats.size,
        durationSeconds: Number(audioDurationSeconds.toFixed(2)),
        width: format.width,
        height: format.height
      },
      error: undefined
    });
  } catch (error) {
    await updateJobStatus(jobId, {
      state: "failed",
      stage: "Render failed",
      message: "EditForge could not finish the render job.",
      error: error instanceof Error ? error.message : "Unknown render error."
    });
  }
}
