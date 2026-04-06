"use client";

import { useEffect, useState } from "react";

import { useEditor } from "@/components/editor/editor-provider";
import { Filmstrip } from "@/components/editor/filmstrip";
import { LeftSidebar } from "@/components/editor/left-sidebar";
import { PreviewStage } from "@/components/editor/preview-stage";
import { RightSidebar } from "@/components/editor/right-sidebar";
import { TopBar } from "@/components/editor/top-bar";
import { Modal, ToolbarButton } from "@/components/editor/ui";
import { useEditorShortcuts } from "@/hooks/use-editor-shortcuts";
import {
  AI_ENHANCE_KEYS,
  AiEnhanceResult,
  DEFAULT_AI_ENHANCE_MODEL,
  requestAiEnhance
} from "@/lib/ai-enhance-client";
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

interface EditorAppProps {
  injectedOpenAiKey?: string | null;
}

const AI_KEY_STORAGE_KEY = "skyroom.ai-enhance.openai-key";

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

export function EditorApp({ injectedOpenAiKey = null }: EditorAppProps) {
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
  const [localAiApiKey, setLocalAiApiKey] = useState("");
  const [aiWorking, setAiWorking] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<AiEnhanceResult | null>(null);

  const beforeAfterVisible = beforeAfterPinned || beforeAfterHold;
  const usingInjectedAiKey = Boolean(injectedOpenAiKey?.trim());
  const effectiveAiApiKey = usingInjectedAiKey ? injectedOpenAiKey!.trim() : localAiApiKey.trim();

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

  useEffect(() => {
    if (usingInjectedAiKey || typeof window === "undefined") {
      return;
    }

    const savedKey = window.localStorage.getItem(AI_KEY_STORAGE_KEY);

    if (savedKey) {
      setLocalAiApiKey(savedKey);
    }
  }, [usingInjectedAiKey]);

  useEffect(() => {
    setAiError(null);
    setAiResult(null);
  }, [state.sourceImage?.url]);

  const handleAiKeyChange = (value: string) => {
    setLocalAiApiKey(value);

    if (typeof window === "undefined") {
      return;
    }

    const trimmedValue = value.trim();

    if (trimmedValue) {
      window.localStorage.setItem(AI_KEY_STORAGE_KEY, trimmedValue);
      return;
    }

    window.localStorage.removeItem(AI_KEY_STORAGE_KEY);
  };

  const handleClearStoredAiKey = () => {
    setLocalAiApiKey("");

    if (typeof window !== "undefined") {
      window.localStorage.removeItem(AI_KEY_STORAGE_KEY);
    }
  };

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

  const handleAiEnhance = async () => {
    if (!state.sourceImage) {
      return;
    }

    if (!effectiveAiApiKey) {
      const message = "No OpenAI API key is available for browser-side AI Enhance.";
      setAiError(message);
      setNotice({ tone: "error", text: message });
      return;
    }

    setAiWorking(true);
    setAiError(null);
    setBusyLabel("AI is analyzing the current edit...");

    try {
      const image = await loadImageFromUrl(state.sourceImage.url);
      const render = renderImageToCanvas({
        image,
        settings: state.settings,
        maxDimension: 1280
      });
      const imageDataUrl = render.canvas.toDataURL("image/jpeg", 0.9);
      const result = await requestAiEnhance({
        apiKey: effectiveAiApiKey,
        imageDataUrl,
        currentSettings: state.settings
      });
      const hasSuggestedChanges = AI_ENHANCE_KEYS.some((key) => {
        const nextValue = result.settings[key];
        return typeof nextValue === "number" && nextValue !== state.settings[key];
      });

      setAiResult(result);

      if (hasSuggestedChanges) {
        applyPatchWithHistory(result.settings, "AI Enhance");
        setNotice({
          tone: "success",
          text: `${DEFAULT_AI_ENHANCE_MODEL} analyzed the current edit and updated the sliders.`
        });
      } else {
        setNotice({
          tone: "info",
          text: `${DEFAULT_AI_ENHANCE_MODEL} reviewed the current edit and did not recommend new slider values.`
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "AI Enhance failed.";
      setAiError(message);
      setNotice({ tone: "error", text: message });
    } finally {
      setAiWorking(false);
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
        description="Analyze the current edited preview with a vision model and pre-fill the sliders it thinks will improve the image most."
        onClose={() => setAiOpen(false)}
        footer={
          <>
            {!usingInjectedAiKey && localAiApiKey ? (
              <ToolbarButton onClick={handleClearStoredAiKey}>Clear Saved Key</ToolbarButton>
            ) : null}
            <ToolbarButton onClick={() => setAiOpen(false)}>Close</ToolbarButton>
            <ToolbarButton
              active={Boolean(state.sourceImage)}
              disabled={!state.sourceImage || !effectiveAiApiKey || aiWorking || Boolean(busyLabel)}
              onClick={handleAiEnhance}
            >
              {aiWorking ? "Analyzing..." : "Analyze + Apply"}
            </ToolbarButton>
          </>
        }
      >
        <div className="space-y-5">
          <div className="rounded-[1.5rem] border border-sky-300/20 bg-sky-300/10 p-4 text-sm leading-6 text-sky-100">
            AI Enhance renders the current edited preview, sends that image directly from the browser to OpenAI, and only changes tonal, color, and detail sliders. Crop and geometry are preserved.
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-100">Model</p>
                <p className="mt-1 text-sm text-slate-400">{DEFAULT_AI_ENHANCE_MODEL}</p>
              </div>
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs uppercase tracking-[0.22em] text-slate-300">
                Browser Direct
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              {usingInjectedAiKey
                ? "Using OPENAI_API_KEY injected by the web app at render time."
                : "No injected browser key was found. Add an OpenAI API key below to run AI Enhance locally in this browser session."}
            </p>
          </div>

          {!usingInjectedAiKey ? (
            <label className="block">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-sm text-slate-200">OpenAI API Key</span>
                <span className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-xs text-slate-300">
                  Saved locally
                </span>
              </div>
              <input
                data-ignore-shortcuts="true"
                type="password"
                value={localAiApiKey}
                onChange={(event) => handleAiKeyChange(event.target.value)}
                placeholder="sk-..."
                className="w-full rounded-[1.1rem] border border-white/10 bg-[#07101a] px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-sky-300/45"
              />
            </label>
          ) : null}

          {aiError ? (
            <div className="rounded-[1.4rem] border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm leading-6 text-rose-100">
              {aiError}
            </div>
          ) : null}

          {aiResult ? (
            <div className="rounded-[1.5rem] border border-emerald-300/20 bg-emerald-300/10 p-4">
              <p className="text-sm font-semibold text-emerald-100">Latest Recommendation</p>
              <p className="mt-3 text-sm leading-6 text-slate-200">{aiResult.summary}</p>
              <div className="mt-4 space-y-2">
                {aiResult.observations.map((observation) => (
                  <div
                    key={observation}
                    className="rounded-[1rem] border border-white/10 bg-black/15 px-3 py-2 text-sm leading-6 text-slate-300"
                  >
                    {observation}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-slate-400">
              AI Enhance uses the current edited preview rather than the untouched original, so it can react to the image exactly as it looks in the editor when you click the button.
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
