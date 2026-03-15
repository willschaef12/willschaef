"use client";

import { useState } from "react";

import { useEditor } from "@/components/editor/editor-provider";
import { Filmstrip } from "@/components/editor/filmstrip";
import { LeftSidebar } from "@/components/editor/left-sidebar";
import { PreviewStage } from "@/components/editor/preview-stage";
import { RightSidebar } from "@/components/editor/right-sidebar";
import { TopBar } from "@/components/editor/top-bar";
import { Modal, ToolbarButton } from "@/components/editor/ui";
import { useEditorShortcuts } from "@/hooks/use-editor-shortcuts";
import {
  CompareMode,
  ExportFormat,
  HistogramData
} from "@/lib/editor-defaults";
import { downloadBlob, loadImageFromUrl, readImageMetadata, validateImageFile } from "@/lib/file-helpers";
import { renderImageToCanvas } from "@/lib/image-pipeline";

interface Notice {
  tone: "info" | "success" | "error";
  text: string;
}

function buildExportFileName(originalFileName: string, format: ExportFormat) {
  const extension = format === "image/png" ? "png" : "jpg";
  const baseName = originalFileName.replace(/\.[^.]+$/, "");
  return `${baseName}-skyroom.${extension}`;
}

function canvasToBlob(canvas: HTMLCanvasElement, format: ExportFormat, quality: number) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, format, format === "image/png" ? undefined : quality);
  });
}

export function EditorApp() {
  const {
    state,
    setSourceImage,
    clearImage,
    updateSettings,
    beginInteraction,
    commitInteraction,
    undo,
    redo,
    resetAll,
    rotateBy,
    applyPreset
  } = useEditor();

  const [notice, setNotice] = useState<Notice | null>({
    tone: "info",
    text: "Upload an image to begin a non-destructive Skyroom editing session."
  });
  const [busyLabel, setBusyLabel] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState<CompareMode>("single");
  const [beforeAfterPinned, setBeforeAfterPinned] = useState(false);
  const [beforeAfterHold, setBeforeAfterHold] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [histogram, setHistogram] = useState<HistogramData>({
    red: Array.from({ length: 64 }, () => 0),
    green: Array.from({ length: 64 }, () => 0),
    blue: Array.from({ length: 64 }, () => 0),
    luminance: Array.from({ length: 64 }, () => 0)
  });
  const [exportOpen, setExportOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("image/jpeg");
  const [exportQuality, setExportQuality] = useState(0.92);
  const [aiOpen, setAiOpen] = useState(false);

  const beforeAfterVisible = beforeAfterPinned || beforeAfterHold;

  const applyPatchWithHistory = (patch: Parameters<typeof updateSettings>[0], label: string) => {
    beginInteraction();
    updateSettings(patch);
    commitInteraction(label);
  };

  const handleToggleBeforeAfter = (next?: boolean) => {
    if (typeof next === "boolean") {
      setBeforeAfterHold(next);
      return;
    }

    setBeforeAfterPinned((current) => !current);
  };

  useEditorShortcuts({
    enabled: Boolean(state.sourceImage),
    undo,
    redo,
    resetAll,
    zoomIn: () => setZoom((current) => Math.min(300, current + 10)),
    zoomOut: () => setZoom((current) => Math.max(50, current - 10)),
    fitToScreen: () => setZoom(100),
    toggleBeforeAfter: handleToggleBeforeAfter
  });

  const handleFileSelect = async (file: File) => {
    const validationError = validateImageFile(file);
    if (validationError) {
      setNotice({ tone: "error", text: validationError });
      return;
    }

    setBusyLabel("Importing photo...");

    try {
      const nextImage = await readImageMetadata(file);
      setSourceImage(nextImage);
      setZoom(100);
      setCompareMode("single");
      setBeforeAfterPinned(false);
      setBeforeAfterHold(false);
      setNotice({
        tone: "success",
        text: `Loaded ${nextImage.fileName}. Preview is ready for non-destructive edits.`
      });
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "Skyroom could not import that image."
      });
    } finally {
      setBusyLabel(null);
    }
  };

  const handleClearImage = () => {
    clearImage();
    setCompareMode("single");
    setBeforeAfterPinned(false);
    setBeforeAfterHold(false);
    setZoom(100);
    setNotice({
      tone: "info",
      text: "Current image removed. Import another photo to continue."
    });
  };

  const handleExport = async () => {
    if (!state.sourceImage) {
      return;
    }

    setBusyLabel("Rendering full-resolution export...");

    try {
      const image = await loadImageFromUrl(state.sourceImage.url);
      const render = renderImageToCanvas({
        image,
        settings: state.settings,
        maxDimension: undefined
      });
      const blob = await canvasToBlob(render.canvas, exportFormat, exportQuality);

      if (!blob) {
        throw new Error("Browser export failed.");
      }

      downloadBlob(blob, buildExportFileName(state.sourceImage.fileName, exportFormat));
      setNotice({
        tone: "success",
        text: "Export complete. The file was rendered from the original source image."
      });
      setExportOpen(false);
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "Export failed."
      });
    } finally {
      setBusyLabel(null);
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-slate-100">
      <TopBar
        sourceImage={state.sourceImage}
        busyLabel={busyLabel}
        compareMode={compareMode}
        beforeAfterVisible={beforeAfterVisible}
        canUndo={state.past.length > 0}
        canRedo={state.future.length > 0}
        onUndo={undo}
        onRedo={redo}
        onReset={resetAll}
        onToggleBeforeAfter={() => handleToggleBeforeAfter()}
        onCompareModeChange={setCompareMode}
        onOpenExport={() => setExportOpen(true)}
        onOpenAi={() => setAiOpen(true)}
      />

      <main className="mx-auto flex max-w-[1800px] flex-col gap-4 px-4 py-4 xl:px-6">
        <div className="grid gap-4 xl:grid-cols-[20rem_minmax(0,1fr)_24rem]">
          <LeftSidebar
            sourceImage={state.sourceImage}
            busyLabel={busyLabel}
            notice={notice}
            onSelectFile={handleFileSelect}
            onClearImage={handleClearImage}
          />

          <PreviewStage
            sourceImage={state.sourceImage}
            settings={state.settings}
            compareMode={compareMode}
            beforeAfterVisible={beforeAfterVisible}
            zoom={zoom}
            onZoomChange={setZoom}
            onFitToScreen={() => setZoom(100)}
            onHistogramChange={setHistogram}
          />

          <RightSidebar
            settings={state.settings}
            activePreset={state.activePreset}
            histogram={histogram}
            onApplyPreset={applyPreset}
            onUpdateSettings={updateSettings}
            onApplyPatchWithHistory={applyPatchWithHistory}
            onBeginInteraction={beginInteraction}
            onCommitInteraction={commitInteraction}
            onRotateBy={rotateBy}
          />
        </div>

        <Filmstrip sourceImage={state.sourceImage} activePreset={state.activePreset} />
      </main>

      <Modal
        open={exportOpen}
        title="Export Image"
        description="Choose the output format and quality. JPG quality is configurable; PNG ignores quality and stays lossless."
        onClose={() => setExportOpen(false)}
        footer={
          <>
            <ToolbarButton onClick={() => setExportOpen(false)}>Cancel</ToolbarButton>
            <ToolbarButton active={Boolean(state.sourceImage)} disabled={!state.sourceImage || Boolean(busyLabel)} onClick={handleExport}>
              Download
            </ToolbarButton>
          </>
        }
      >
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setExportFormat("image/jpeg")}
              className={`rounded-[1.35rem] border px-4 py-4 text-left transition ${
                exportFormat === "image/jpeg"
                  ? "border-sky-300/50 bg-sky-300/12"
                  : "border-white/10 bg-white/[0.03] hover:border-white/20"
              }`}
            >
              <p className="text-sm font-semibold text-slate-100">JPG</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">Smaller files, ideal for delivery and web sharing.</p>
            </button>
            <button
              type="button"
              onClick={() => setExportFormat("image/png")}
              className={`rounded-[1.35rem] border px-4 py-4 text-left transition ${
                exportFormat === "image/png"
                  ? "border-sky-300/50 bg-sky-300/12"
                  : "border-white/10 bg-white/[0.03] hover:border-white/20"
              }`}
            >
              <p className="text-sm font-semibold text-slate-100">PNG</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">Lossless output for archive masters or overlays.</p>
            </button>
          </div>

          <label className="block">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-slate-200">JPG Quality</span>
              <span className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-xs text-slate-300">
                {Math.round(exportQuality * 100)}%
              </span>
            </div>
            <input
              data-ignore-shortcuts="true"
              type="range"
              min={0.4}
              max={1}
              step={0.01}
              disabled={exportFormat === "image/png"}
              value={exportQuality}
              onChange={(event) => setExportQuality(Number(event.target.value))}
              className="skyroom-slider h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </label>
        </div>
      </Modal>

      <Modal
        open={aiOpen}
        title="AI Enhance"
        description="AI enhancement endpoint not connected yet."
        onClose={() => setAiOpen(false)}
        footer={<ToolbarButton onClick={() => setAiOpen(false)}>Close</ToolbarButton>}
      >
        <div className="rounded-[1.5rem] border border-sky-300/20 bg-sky-300/10 p-4 text-sm leading-6 text-sky-100">
          The placeholder backend route is ready at <code className="rounded bg-black/20 px-1 py-0.5">/api/ai-enhance</code>. Connect your future image-enhancement API there and replace this modal with an actual request flow.
        </div>
      </Modal>
    </div>
  );
}
