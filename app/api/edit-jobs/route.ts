import { writeFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { DEFAULT_POLL_INTERVAL_MS } from "@/lib/editforge/constants";
import { runEditJob } from "@/lib/editforge/server/pipeline";
import { cleanupExpiredJobs, ensureJobDirectories, writeManifest } from "@/lib/editforge/server/storage";
import { writeJobStatus } from "@/lib/editforge/server/status";
import {
  buildStoredFileName,
  getDisplayFileName,
  parseEditOptions,
  validateAudioFile,
  validateClipFiles
} from "@/lib/editforge/server/validation";
import type { EditJobStatus, StoredJobManifest, StoredUploadFile } from "@/lib/editforge/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function persistUpload(file: File, absolutePath: string) {
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(absolutePath, buffer);
}

async function storeFile(
  file: File,
  prefix: string,
  index: number,
  directory: string,
  fallbackExtension: string
): Promise<StoredUploadFile> {
  const storedName = buildStoredFileName(prefix, index, file, fallbackExtension);
  const absolutePath = path.join(directory, storedName);

  await persistUpload(file, absolutePath);

  return {
    originalName: getDisplayFileName(file.name),
    storedName,
    absolutePath,
    sizeBytes: file.size,
    mimeType: file.type
  };
}

export async function POST(request: Request) {
  try {
    await cleanupExpiredJobs();

    const formData = await request.formData();
    const options = parseEditOptions(formData);
    const clips = formData
      .getAll("clips")
      .filter((value): value is File => value instanceof File && value.size > 0);
    const audioValue = formData.get("audio");
    const audio = audioValue instanceof File && audioValue.size > 0 ? audioValue : null;

    validateClipFiles(clips);
    validateAudioFile(audio);

    const jobId = crypto.randomUUID();
    const paths = await ensureJobDirectories(jobId);

    const storedClips = await Promise.all(
      clips.map((clip, index) => storeFile(clip, "clip", index + 1, paths.uploadsDir, ".mp4"))
    );
    const storedAudio = await storeFile(audio as File, "audio", 1, paths.uploadsDir, ".mp3");

    const manifest: StoredJobManifest = {
      jobId,
      createdAt: new Date().toISOString(),
      options,
      clips: storedClips,
      audio: storedAudio
    };

    const initialStatus: EditJobStatus = {
      jobId,
      state: "queued",
      progress: 4,
      stage: "Queued",
      message: "Uploads received. Preparing the render job.",
      createdAt: manifest.createdAt,
      updatedAt: manifest.createdAt,
      options,
      input: {
        clipCount: storedClips.length,
        totalClipBytes: storedClips.reduce((sum, clip) => sum + clip.sizeBytes, 0),
        audioBytes: storedAudio.sizeBytes,
        audioFileName: storedAudio.originalName
      }
    };

    await writeManifest(jobId, manifest);
    await writeJobStatus(jobId, initialStatus);

    void runEditJob(jobId);

    return NextResponse.json({
      jobId,
      statusUrl: `/api/edit-jobs/${jobId}`,
      downloadUrl: `/api/edit-jobs/${jobId}/download`,
      pollIntervalMs: DEFAULT_POLL_INTERVAL_MS
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to create the render job."
      },
      { status: 400 }
    );
  }
}
