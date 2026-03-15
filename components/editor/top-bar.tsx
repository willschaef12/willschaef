"use client";

import { CompareMode, SourceImage } from "@/lib/editor-defaults";

import { ToolbarButton } from "@/components/editor/ui";

interface TopBarProps {
  sourceImage: SourceImage | null;
  busyLabel: string | null;
  compareMode: CompareMode;
  beforeAfterVisible: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  onToggleBeforeAfter: () => void;
  onCompareModeChange: (mode: CompareMode) => void;
  onOpenExport: () => void;
  onOpenAi: () => void;
}

export function TopBar({
  sourceImage,
  busyLabel,
  compareMode,
  beforeAfterVisible,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onReset,
  onToggleBeforeAfter,
  onCompareModeChange,
  onOpenExport,
  onOpenAi
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/8 bg-[#07111b]/78 px-4 py-4 backdrop-blur xl:px-6">
      <div className="mx-auto flex max-w-[1800px] flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-sky-300/75">Skyroom</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-50">Aviation Edit Deck</h1>
            <span className="rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1 text-xs font-medium text-sky-100">
              Non-destructive canvas workflow
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-400">
            {sourceImage
              ? `${sourceImage.fileName} • ${sourceImage.width}x${sourceImage.height}px`
              : "Import a helicopter or aviation frame to start grading."}
          </p>
        </div>

        <div className="flex flex-col gap-3 xl:items-end">
          <div className="flex flex-wrap items-center gap-2">
            <ToolbarButton disabled={!canUndo} onClick={onUndo} title="Ctrl/Cmd+Z">
              Undo
            </ToolbarButton>
            <ToolbarButton disabled={!canRedo} onClick={onRedo} title="Ctrl/Cmd+Shift+Z">
              Redo
            </ToolbarButton>
            <ToolbarButton active={beforeAfterVisible} disabled={!sourceImage} onClick={onToggleBeforeAfter} title="B or hold Space">
              Before/After
            </ToolbarButton>
            <ToolbarButton
              active={compareMode === "single"}
              disabled={!sourceImage}
              onClick={() => onCompareModeChange("single")}
            >
              Single
            </ToolbarButton>
            <ToolbarButton
              active={compareMode === "split"}
              disabled={!sourceImage}
              onClick={() => onCompareModeChange("split")}
            >
              Compare
            </ToolbarButton>
            <ToolbarButton disabled={!sourceImage} onClick={onReset} title="R">
              Reset All
            </ToolbarButton>
            <ToolbarButton onClick={onOpenAi}>AI Enhance</ToolbarButton>
            <ToolbarButton active={Boolean(sourceImage)} disabled={!sourceImage} onClick={onOpenExport}>
              Export
            </ToolbarButton>
          </div>

          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
            {busyLabel ?? "Autosave stores your latest slider state locally"}
          </p>
        </div>
      </div>
    </header>
  );
}
