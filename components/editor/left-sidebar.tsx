"use client";

import { useRef, useState } from "react";

import { FILE_ACCEPT, MAX_FILE_SIZE_BYTES, SourceImage } from "@/lib/editor-defaults";
import { formatBytes } from "@/lib/file-helpers";

import { PanelCard, ToolbarButton, cx } from "@/components/editor/ui";

interface Notice {
  tone: "info" | "success" | "error";
  text: string;
}

interface LeftSidebarProps {
  sourceImage: SourceImage | null;
  busyLabel: string | null;
  notice: Notice | null;
  onSelectFile: (file: File) => void;
  onClearImage: () => void;
}

export function LeftSidebar({
  sourceImage,
  busyLabel,
  notice,
  onSelectFile,
  onClearImage
}: LeftSidebarProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const openPicker = () => inputRef.current?.click();

  return (
    <aside className="flex flex-col gap-4">
      <PanelCard
        title="Import"
        subtitle="Drag a frame in or choose a file to open a single-photo Skyroom session."
        actions={<ToolbarButton onClick={openPicker}>{sourceImage ? "Replace" : "Browse"}</ToolbarButton>}
      >
        <input
          ref={inputRef}
          type="file"
          accept={FILE_ACCEPT}
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              onSelectFile(file);
            }

            event.target.value = "";
          }}
        />

        <button
          type="button"
          onClick={openPicker}
          onDragEnter={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setDragActive(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setDragActive(false);

            const file = event.dataTransfer.files?.[0];
            if (file) {
              onSelectFile(file);
            }
          }}
          className={cx(
            "group flex w-full flex-col items-center justify-center rounded-[1.5rem] border border-dashed px-5 py-10 text-center transition",
            dragActive
              ? "border-sky-300/60 bg-sky-300/12"
              : "border-white/14 bg-white/[0.03] hover:border-sky-300/35 hover:bg-white/[0.05]"
          )}
        >
          <span className="rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1 text-xs uppercase tracking-[0.28em] text-sky-100">
            Drag & drop
          </span>
          <h3 className="mt-4 text-lg font-semibold text-slate-50">
            {sourceImage ? "Replace the current photo" : "Drop an aviation image here"}
          </h3>
          <p className="mt-3 max-w-sm text-sm leading-6 text-slate-400">
            Supports JPG, PNG, and WEBP up to {formatBytes(MAX_FILE_SIZE_BYTES)}. Large previews are downscaled for smooth editing, but exports render from the full source.
          </p>
          <span className="mt-6 text-sm font-medium text-sky-200">Tap to browse files</span>
        </button>

        {notice ? (
          <div
            className={cx(
              "mt-4 rounded-2xl border px-4 py-3 text-sm leading-6",
              notice.tone === "error" && "border-rose-400/20 bg-rose-400/10 text-rose-100",
              notice.tone === "success" && "border-emerald-400/20 bg-emerald-400/10 text-emerald-100",
              notice.tone === "info" && "border-sky-400/20 bg-sky-400/10 text-sky-100"
            )}
          >
            {notice.text}
          </div>
        ) : null}

        {busyLabel ? <p className="mt-4 text-xs uppercase tracking-[0.25em] text-slate-500">{busyLabel}</p> : null}
      </PanelCard>

      <PanelCard
        title="Photo"
        subtitle={sourceImage ? "The original source stays untouched in memory while edits stack on top." : "No photo loaded yet."}
        actions={
          sourceImage ? (
            <ToolbarButton onClick={onClearImage} title="Remove the current photo">
              Clear
            </ToolbarButton>
          ) : null
        }
      >
        {sourceImage ? (
          <div className="space-y-4">
            <div className="overflow-hidden rounded-[1.4rem] border border-white/10 bg-black/20">
              <img
                src={sourceImage.url}
                alt={sourceImage.fileName}
                className="h-52 w-full object-cover"
              />
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                <dt className="text-slate-500">Filename</dt>
                <dd className="mt-1 break-all text-slate-200">{sourceImage.fileName}</dd>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                <dt className="text-slate-500">Size</dt>
                <dd className="mt-1 text-slate-200">{formatBytes(sourceImage.fileSize)}</dd>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                <dt className="text-slate-500">Resolution</dt>
                <dd className="mt-1 text-slate-200">
                  {sourceImage.width} x {sourceImage.height}
                </dd>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                <dt className="text-slate-500">Format</dt>
                <dd className="mt-1 text-slate-200">{sourceImage.mimeType.replace("image/", "").toUpperCase()}</dd>
              </div>
            </dl>
          </div>
        ) : (
          <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-5 text-sm leading-6 text-slate-400">
            Import a frame to unlock non-destructive sliders, before/after compare, presets, histogram, and export.
          </div>
        )}
      </PanelCard>

      <PanelCard title="Shortcuts" subtitle="Fast review controls for editing on a keyboard.">
        <div className="space-y-3 text-sm text-slate-300">
          <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
            <span>Undo / Redo</span>
            <span className="text-slate-500">Ctrl/Cmd+Z, Shift+Z</span>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
            <span>Before / After</span>
            <span className="text-slate-500">B or hold Space</span>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
            <span>Zoom</span>
            <span className="text-slate-500">+, -, 0</span>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
            <span>Reset</span>
            <span className="text-slate-500">R</span>
          </div>
        </div>
      </PanelCard>
    </aside>
  );
}
