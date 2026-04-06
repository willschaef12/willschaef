"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  AudioLines,
  CheckCircle2,
  CircleAlert,
  Clapperboard,
  Clock3,
  Download,
  LoaderCircle,
  Sparkles,
  Trash2,
  Video
} from "lucide-react";

import { FileDropzone } from "@/components/editor/file-dropzone";
import { Button, buttonStyles } from "@/components/ui/button";
import {
  CLIP_ORDERINGS,
  AUDIO_EXTENSIONS,
  DEFAULT_POLL_INTERVAL_MS,
  EDIT_STYLES,
  MAX_AUDIO_FILE_BYTES,
  MAX_VIDEO_FILE_BYTES,
  MAX_VIDEO_FILES,
  OUTPUT_FORMATS,
  SUPPORTED_AUDIO_MIME_TYPES,
  SUPPORTED_VIDEO_MIME_TYPES,
  VIDEO_EXTENSIONS
} from "@/lib/editforge/constants";
import type { EditJobStatus, EditRequestOptions } from "@/lib/editforge/types";
import { cn, estimateRenderSeconds, formatBytes, formatDuration, getExtension } from "@/lib/editforge/utils";

interface LocalClip {
  id: string;
  file: File;
  previewUrl: string;
  durationSeconds: number | null;
}

interface LocalAudioTrack {
  file: File;
  previewUrl: string;
  durationSeconds: number | null;
}

const defaultOptions: EditRequestOptions = {
  outputFormat: "vertical",
  editStyle: "smooth",
  clipOrdering: "upload"
};

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function canAcceptVideo(file: File) {
  const extension = getExtension(file.name);
  return SUPPORTED_VIDEO_MIME_TYPES.includes(file.type as (typeof SUPPORTED_VIDEO_MIME_TYPES)[number]) ||
    VIDEO_EXTENSIONS.includes(extension as (typeof VIDEO_EXTENSIONS)[number]);
}

function canAcceptAudio(file: File) {
  const extension = getExtension(file.name);
  return SUPPORTED_AUDIO_MIME_TYPES.includes(file.type as (typeof SUPPORTED_AUDIO_MIME_TYPES)[number]) ||
    AUDIO_EXTENSIONS.includes(extension as (typeof AUDIO_EXTENSIONS)[number]);
}

function readDuration(url: string, kind: "audio" | "video") {
  return new Promise<number | null>((resolve) => {
    const element = document.createElement(kind);
    element.preload = "metadata";
    element.src = url;

    const finalize = (value: number | null) => {
      element.removeAttribute("src");
      element.load();
      resolve(value);
    };

    element.onloadedmetadata = () => finalize(Number.isFinite(element.duration) ? element.duration : null);
    element.onerror = () => finalize(null);
  });
}

export function EditorWorkbench() {
  const objectUrlsRef = useRef(new Set<string>());
  const [clips, setClips] = useState<LocalClip[]>([]);
  const [audioTrack, setAudioTrack] = useState<LocalAudioTrack | null>(null);
  const [options, setOptions] = useState<EditRequestOptions>(defaultOptions);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<EditJobStatus | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedFormat = OUTPUT_FORMATS.find((item) => item.id === options.outputFormat) ?? OUTPUT_FORMATS[0];
  const selectedStyle = EDIT_STYLES.find((item) => item.id === options.editStyle) ?? EDIT_STYLES[0];
  const totalClipBytes = useMemo(() => clips.reduce((sum, clip) => sum + clip.file.size, 0), [clips]);
  const estimatedRenderTime = useMemo(
    () => estimateRenderSeconds(clips.length, audioTrack?.durationSeconds),
    [audioTrack?.durationSeconds, clips.length]
  );
  const isProcessing = isSubmitting || jobStatus?.state === "queued" || jobStatus?.state === "processing";
  const canSubmit = clips.length > 0 && Boolean(audioTrack) && !isProcessing;

  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlsRef.current.clear();
    };
  }, []);

  useEffect(() => {
    if (!jobId) {
      return;
    }

    let isDisposed = false;
    const interval = window.setInterval(pollStatus, DEFAULT_POLL_INTERVAL_MS);

    void pollStatus();

    async function pollStatus() {
      const response = await fetch(`/api/edit-jobs/${jobId}`, { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as EditJobStatus | { error?: string } | null;

      if (!response.ok) {
        if (!isDisposed) {
          setRequestError(payload && "error" in payload ? payload.error ?? "Unable to fetch job status." : "Unable to fetch job status.");
        }
        return;
      }

      if (!isDisposed && payload && "jobId" in payload) {
        setJobStatus(payload);
        if (payload.state === "completed" || payload.state === "failed") {
          window.clearInterval(interval);
          setIsSubmitting(false);
        }
      }
    }

    return () => {
      isDisposed = true;
      window.clearInterval(interval);
    };
  }, [jobId]);

  async function handleVideoSelection(files: File[]) {
    if (isProcessing) {
      return;
    }

    const nextCount = clips.length + files.length;
    if (nextCount > MAX_VIDEO_FILES) {
      setValidationError(`You can upload up to ${MAX_VIDEO_FILES} clips per edit.`);
      return;
    }

    const unsupported = files.find((file) => !canAcceptVideo(file));
    if (unsupported) {
      setValidationError(`${unsupported.name} is not a supported video file.`);
      return;
    }

    const oversized = files.find((file) => file.size > MAX_VIDEO_FILE_BYTES);
    if (oversized) {
      setValidationError(`${oversized.name} exceeds the ${Math.round(MAX_VIDEO_FILE_BYTES / 1024 / 1024)} MB clip limit.`);
      return;
    }

    setValidationError(null);
    setRequestError(null);
    setJobId(null);
    setJobStatus(null);

    const prepared = await Promise.all(
      files.map(async (file) => {
        const previewUrl = URL.createObjectURL(file);
        objectUrlsRef.current.add(previewUrl);
        const durationSeconds = await readDuration(previewUrl, "video");

        return {
          id: createId(),
          file,
          previewUrl,
          durationSeconds
        } satisfies LocalClip;
      })
    );

    setClips((current) => [...current, ...prepared]);
  }

  async function handleAudioSelection(files: File[]) {
    if (isProcessing || files.length === 0) {
      return;
    }

    const [file] = files;

    if (!canAcceptAudio(file)) {
      setValidationError(`${file.name} is not a supported audio file.`);
      return;
    }

    if (file.size > MAX_AUDIO_FILE_BYTES) {
      setValidationError(`${file.name} exceeds the ${Math.round(MAX_AUDIO_FILE_BYTES / 1024 / 1024)} MB audio limit.`);
      return;
    }

    setValidationError(null);
    setRequestError(null);
    setJobId(null);
    setJobStatus(null);

    const previewUrl = URL.createObjectURL(file);
    objectUrlsRef.current.add(previewUrl);
    const durationSeconds = await readDuration(previewUrl, "audio");

    setAudioTrack((current) => {
      if (current) {
        URL.revokeObjectURL(current.previewUrl);
        objectUrlsRef.current.delete(current.previewUrl);
      }

      return {
        file,
        previewUrl,
        durationSeconds
      };
    });
  }

  function removeClip(clipId: string) {
    setClips((current) => {
      const next = current.filter((clip) => clip.id !== clipId);
      const removed = current.find((clip) => clip.id === clipId);
      if (removed) {
        URL.revokeObjectURL(removed.previewUrl);
        objectUrlsRef.current.delete(removed.previewUrl);
      }
      return next;
    });
    setJobId(null);
    setJobStatus(null);
  }

  function clearAudioTrack() {
    setAudioTrack((current) => {
      if (current) {
        URL.revokeObjectURL(current.previewUrl);
        objectUrlsRef.current.delete(current.previewUrl);
      }
      return null;
    });
    setJobId(null);
    setJobStatus(null);
  }

  async function generateEdit() {
    if (!canSubmit || !audioTrack) {
      setValidationError("Add at least one clip and one soundtrack before generating.");
      return;
    }

    setValidationError(null);
    setRequestError(null);
    setJobStatus(null);
    setIsSubmitting(true);

    const formData = new FormData();
    clips.forEach((clip) => formData.append("clips", clip.file, clip.file.name));
    formData.append("audio", audioTrack.file, audioTrack.file.name);
    formData.append("outputFormat", options.outputFormat);
    formData.append("editStyle", options.editStyle);
    formData.append("clipOrdering", options.clipOrdering);

    try {
      const response = await fetch("/api/edit-jobs", {
        method: "POST",
        body: formData
      });

      const payload = (await response.json().catch(() => null)) as
        | { jobId?: string; error?: string }
        | null;

      if (!response.ok || !payload?.jobId) {
        throw new Error(payload?.error ?? "Unable to start the render job.");
      }

      setJobId(payload.jobId);
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "Unable to start the render job.");
      setIsSubmitting(false);
    }
  }

  const statusTone =
    jobStatus?.state === "failed" ? "text-rose-300" : jobStatus?.state === "completed" ? "text-emerald-300" : "text-slate-200";

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back to landing page
          </Link>
          <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">Build an edit in one pass.</h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-300">
            Upload your footage, set the delivery profile, and let EditForge assemble a soundtrack-led MP4 you can download as soon as rendering completes.
          </p>
        </div>

        <div className="panel-surface-soft rounded-[1.35rem] px-5 py-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Current profile</p>
          <p className="mt-2 font-display text-2xl font-semibold text-white">{selectedStyle.label}</p>
          <p className="mt-1 text-sm text-slate-400">
            {selectedFormat.label} {selectedFormat.aspectRatioLabel} • {selectedStyle.cadenceLabel}
          </p>
        </div>
      </div>

      <div className="mt-10 grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
        <section className="space-y-6">
          <div className="panel-surface rounded-[2rem] p-6 sm:p-8">
            <div className="grid gap-5 lg:grid-cols-2">
              <FileDropzone
                title="Upload video clips"
                description="Drag in multiple source clips. EditForge will normalize and sequence them automatically."
                accept="video/mp4,video/quicktime,video/webm,video/x-matroska,video/ogg,.mp4,.mov,.webm,.mkv,.ogv"
                helper={`Up to ${MAX_VIDEO_FILES} clips, ${Math.round(MAX_VIDEO_FILE_BYTES / 1024 / 1024)} MB each`}
                multiple
                disabled={isProcessing}
                onFiles={(files) => void handleVideoSelection(files)}
              />
              <FileDropzone
                title="Upload soundtrack"
                description="Add one audio track to drive total edit length and final export audio."
                accept="audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/aac,audio/mp4,audio/x-m4a,audio/webm,audio/ogg,.mp3,.wav,.aac,.m4a,.webm,.ogg"
                helper={`${Math.round(MAX_AUDIO_FILE_BYTES / 1024 / 1024)} MB max`}
                disabled={isProcessing}
                onFiles={(files) => void handleAudioSelection(files)}
              />
            </div>

            {(validationError || requestError) && (
              <div className="mt-5 flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{validationError ?? requestError}</p>
              </div>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="panel-surface rounded-[2rem] p-6 sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Clips</p>
                  <h2 className="mt-2 font-display text-3xl font-semibold text-white">Source footage</h2>
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
                  {clips.length} / {MAX_VIDEO_FILES}
                </div>
              </div>

              {clips.length === 0 ? (
                <div className="mt-6 rounded-[1.5rem] border border-dashed border-white/10 bg-white/[0.03] px-5 py-10 text-center text-slate-500">
                  Add clips to see live preview cards here.
                </div>
              ) : (
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {clips.map((clip, index) => (
                    <article key={clip.id} className="overflow-hidden rounded-[1.4rem] border border-white/10 bg-white/[0.03]">
                      <div className="aspect-video bg-black">
                        <video src={clip.previewUrl} className="h-full w-full object-cover" muted playsInline preload="metadata" />
                      </div>
                      <div className="space-y-3 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-white">{clip.file.name}</p>
                            <p className="mt-1 text-xs text-slate-500">
                              Clip {index + 1} • {formatDuration(clip.durationSeconds)} • {formatBytes(clip.file.size)}
                            </p>
                          </div>
                          <button
                            type="button"
                            className="rounded-full border border-white/10 p-2 text-slate-400 transition hover:border-white/20 hover:text-white disabled:opacity-60"
                            onClick={() => removeClip(clip.id)}
                            disabled={isProcessing}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            <div className="panel-surface rounded-[2rem] p-6 sm:p-8">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Soundtrack</p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-white">Audio file</h2>

              {audioTrack ? (
                <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-[var(--forge-electric)]">
                        <AudioLines className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{audioTrack.file.name}</p>
                        <p className="mt-1 text-sm text-slate-400">
                          {formatDuration(audioTrack.durationSeconds)} • {formatBytes(audioTrack.file.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="rounded-full border border-white/10 p-2 text-slate-400 transition hover:border-white/20 hover:text-white disabled:opacity-60"
                      onClick={clearAudioTrack}
                      disabled={isProcessing}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <audio src={audioTrack.previewUrl} controls className="mt-5 w-full" />
                </div>
              ) : (
                <div className="mt-6 rounded-[1.5rem] border border-dashed border-white/10 bg-white/[0.03] px-5 py-10 text-center text-slate-500">
                  Add one soundtrack file to set the final edit duration.
                </div>
              )}
            </div>
          </div>

          <div className="panel-surface rounded-[2rem] p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Controls</p>
                <h2 className="mt-2 font-display text-3xl font-semibold text-white">Export configuration</h2>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
                Real MP4 export via FFmpeg
              </div>
            </div>

            <div className="mt-8 grid gap-8">
              <div>
                <p className="text-sm font-medium text-slate-200">Output format</p>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  {OUTPUT_FORMATS.map((format) => (
                    <button
                      key={format.id}
                      type="button"
                      onClick={() => setOptions((current) => ({ ...current, outputFormat: format.id }))}
                      className={cn(
                        "rounded-[1.4rem] border p-5 text-left transition",
                        options.outputFormat === format.id
                          ? "border-[rgba(255,107,44,0.45)] bg-[rgba(255,107,44,0.1)]"
                          : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
                      )}
                    >
                      <p className="font-display text-xl font-semibold text-white">{format.label}</p>
                      <p className="mt-1 text-sm text-[var(--forge-accent-soft)]">{format.aspectRatioLabel}</p>
                      <p className="mt-3 text-sm leading-6 text-slate-400">{format.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-200">Edit style</p>
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {EDIT_STYLES.map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setOptions((current) => ({ ...current, editStyle: style.id }))}
                      className={cn(
                        "rounded-[1.4rem] border p-5 text-left transition",
                        options.editStyle === style.id
                          ? "border-[rgba(54,210,255,0.4)] bg-[rgba(54,210,255,0.09)]"
                          : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
                      )}
                    >
                      <p className="font-display text-xl font-semibold text-white">{style.label}</p>
                      <p className="mt-1 text-sm text-[var(--forge-electric)]">{style.cadenceLabel}</p>
                      <p className="mt-3 text-sm leading-6 text-slate-400">{style.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-200">Clip ordering</p>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {CLIP_ORDERINGS.map((ordering) => (
                    <button
                      key={ordering.id}
                      type="button"
                      onClick={() => setOptions((current) => ({ ...current, clipOrdering: ordering.id }))}
                      className={cn(
                        "rounded-[1.4rem] border p-5 text-left transition",
                        options.clipOrdering === ordering.id
                          ? "border-white/20 bg-white/[0.08]"
                          : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
                      )}
                    >
                      <p className="font-display text-xl font-semibold text-white">{ordering.label}</p>
                      <p className="mt-3 text-sm leading-6 text-slate-400">{ordering.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-400">
                {clips.length > 0 && audioTrack ? (
                  <span>
                    EditForge will export a {selectedFormat.width}×{selectedFormat.height} MP4 paced in {selectedStyle.label.toLowerCase()} mode.
                  </span>
                ) : (
                  <span>Add clips and a soundtrack to unlock rendering.</span>
                )}
              </div>
              <Button type="button" size="lg" onClick={() => void generateEdit()} disabled={!canSubmit}>
                {isProcessing ? (
                  <>
                    <LoaderCircle className="h-5 w-5 animate-spin" />
                    Rendering edit...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    Generate Edit
                  </>
                )}
              </Button>
            </div>
          </div>
        </section>

        <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
          <div className="panel-surface rounded-[2rem] p-6 sm:p-8">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Output summary</p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-white">Render brief</h2>

            <div className="mt-6 grid gap-4">
              {[
                {
                  label: "Resolution",
                  value: `${selectedFormat.width} × ${selectedFormat.height}`,
                  icon: Clapperboard
                },
                {
                  label: "Estimated runtime",
                  value: `~ ${formatDuration(estimatedRenderTime)}`,
                  icon: Clock3
                },
                {
                  label: "Clip payload",
                  value: formatBytes(totalClipBytes),
                  icon: Video
                }
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-[var(--forge-accent-soft)]">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
                      <p className="mt-1 text-base font-medium text-white">{value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-5">
              <p className="text-sm font-medium text-white">Current selections</p>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <div className="flex items-center justify-between gap-3">
                  <span>Format</span>
                  <span>{selectedFormat.label}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Pacing</span>
                  <span>{selectedStyle.label}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Ordering</span>
                  <span>{options.clipOrdering === "upload" ? "Upload order" : "Randomized"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="panel-surface rounded-[2rem] p-6 sm:p-8">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Render status</p>
            <div className="mt-3 flex items-center justify-between gap-4">
              <h2 className="font-display text-3xl font-semibold text-white">Job monitor</h2>
              {jobStatus?.state === "completed" ? (
                <CheckCircle2 className="h-7 w-7 text-emerald-300" />
              ) : jobStatus?.state === "failed" ? (
                <CircleAlert className="h-7 w-7 text-rose-300" />
              ) : jobId ? (
                <LoaderCircle className="h-7 w-7 animate-spin text-[var(--forge-accent-soft)]" />
              ) : null}
            </div>

            {!jobId && !jobStatus ? (
              <div className="mt-6 rounded-[1.5rem] border border-dashed border-white/10 bg-white/[0.03] px-5 py-10 text-center text-slate-500">
                Render progress, job details, and the finished video player appear here.
              </div>
            ) : (
              <div className="mt-6 space-y-5">
                <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className={cn("font-medium", statusTone)}>{jobStatus?.stage ?? "Queued"}</p>
                      <p className="mt-1 text-sm text-slate-400">{jobStatus?.message ?? "Starting render job."}</p>
                    </div>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-sm text-slate-300">
                      {jobStatus?.progress ?? 0}%
                    </span>
                  </div>

                  <div className="mt-4 rounded-full bg-white/5 p-1">
                    <div
                      className="h-2 rounded-full bg-[linear-gradient(90deg,#ff6b2c,#36d2ff)] transition-all"
                      style={{ width: `${jobStatus?.progress ?? 6}%` }}
                    />
                  </div>
                </div>

                {jobStatus?.state === "failed" ? (
                  <div className="rounded-[1.4rem] border border-rose-500/20 bg-rose-500/10 px-4 py-4 text-sm text-rose-100">
                    {jobStatus.error ?? "The render job failed. Check your FFmpeg installation and media compatibility, then try again."}
                  </div>
                ) : null}

                {jobStatus?.state === "completed" && jobStatus.output ? (
                  <div className="space-y-5 rounded-[1.4rem] border border-emerald-500/15 bg-emerald-500/[0.06] p-5">
                    <div>
                      <p className="font-medium text-white">Render complete</p>
                      <p className="mt-1 text-sm text-slate-300">
                        {formatDuration(jobStatus.output.durationSeconds)} • {jobStatus.output.width}×{jobStatus.output.height} •{" "}
                        {formatBytes(jobStatus.output.sizeBytes)}
                      </p>
                    </div>

                    <div
                      className="overflow-hidden rounded-[1.3rem] border border-white/10 bg-black"
                      style={{ aspectRatio: `${jobStatus.output.width} / ${jobStatus.output.height}` }}
                    >
                      <video src={jobStatus.output.downloadUrl} controls className="h-full w-full object-contain" />
                    </div>

                    <a
                      href={jobStatus.output.downloadUrl}
                      download={jobStatus.output.fileName}
                      className={buttonStyles({ size: "lg", className: "w-full" })}
                    >
                      <Download className="h-5 w-5" />
                      Download MP4
                    </a>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
