"use client";

import {
  startTransition,
  useDeferredValue,
  useEffect,
  useRef,
  useState
} from "react";

import {
  CompareMode,
  createBaseCompareSettings,
  EditSettings,
  EMPTY_HISTOGRAM,
  HistogramData,
  SourceImage
} from "@/lib/editor-defaults";
import { loadImageFromUrl } from "@/lib/file-helpers";
import { renderImageToCanvas } from "@/lib/image-pipeline";

import { ToolbarButton } from "@/components/editor/ui";

interface PreviewStageProps {
  sourceImage: SourceImage | null;
  settings: EditSettings;
  compareMode: CompareMode;
  beforeAfterVisible: boolean;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onFitToScreen: () => void;
  onHistogramChange: (histogram: HistogramData) => void;
}

function paintCanvas(target: HTMLCanvasElement | null, source: HTMLCanvasElement) {
  if (!target) {
    return;
  }

  const context = target.getContext("2d");
  if (!context) {
    return;
  }

  target.width = source.width;
  target.height = source.height;
  context.clearRect(0, 0, source.width, source.height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(source, 0, 0);
}

function PreviewCanvasPane({
  label,
  canvasRef,
  zoom
}: {
  label: string;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  zoom: number;
}) {
  return (
    <div className="flex min-h-[360px] flex-col rounded-[1.7rem] border border-white/8 bg-[#07101a]/80 p-3">
      <div className="mb-3 flex items-center justify-between px-2">
        <span className="text-xs uppercase tracking-[0.32em] text-slate-500">{label}</span>
        <span className="text-xs text-slate-500">{zoom}%</span>
      </div>
      <div className="flex-1 overflow-auto rounded-[1.3rem] border border-white/6 bg-[radial-gradient(circle_at_top,rgba(88,166,255,0.08),transparent_45%),linear-gradient(180deg,rgba(4,10,16,0.96),rgba(7,12,19,0.96))]">
        <div className="flex min-h-[320px] items-center justify-center p-6">
          <canvas
            ref={canvasRef}
            className="max-h-full max-w-full rounded-[1rem] shadow-[0_18px_48px_rgba(0,0,0,0.35)]"
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: "center center"
            }}
          />
        </div>
      </div>
    </div>
  );
}

export function PreviewStage({
  sourceImage,
  settings,
  compareMode,
  beforeAfterVisible,
  zoom,
  onZoomChange,
  onFitToScreen,
  onHistogramChange
}: PreviewStageProps) {
  const editedCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [renderStats, setRenderStats] = useState<{
    width: number;
    height: number;
    durationMs: number;
    scale: number;
  } | null>(null);
  const deferredSettings = useDeferredValue(settings);

  useEffect(() => {
    if (!sourceImage) {
      setImageElement(null);
      setRenderError(null);
      setRenderStats(null);
      onHistogramChange(EMPTY_HISTOGRAM);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setRenderError(null);

    loadImageFromUrl(sourceImage.url)
      .then((image) => {
        if (!cancelled) {
          setImageElement(image);
          setIsLoading(false);
        }
      })
      .catch((error: Error) => {
        if (!cancelled) {
          setRenderError(error.message);
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [onHistogramChange, sourceImage]);

  useEffect(() => {
    if (!imageElement || !sourceImage) {
      return;
    }

    let cancelled = false;
    const frame = window.requestAnimationFrame(() => {
      const startedAt = performance.now();

      try {
        setIsRendering(true);

        const editedRender = renderImageToCanvas({
          image: imageElement,
          settings: deferredSettings
        });
        paintCanvas(editedCanvasRef.current, editedRender.canvas);

        if (compareMode === "split" || beforeAfterVisible) {
          const originalRender = renderImageToCanvas({
            image: imageElement,
            settings: createBaseCompareSettings(deferredSettings)
          });

          paintCanvas(originalCanvasRef.current, originalRender.canvas);
        }

        if (!cancelled) {
          startTransition(() => {
            onHistogramChange(editedRender.histogram);
            setRenderStats({
              width: editedRender.width,
              height: editedRender.height,
              durationMs: performance.now() - startedAt,
              scale: editedRender.scale
            });
            setRenderError(null);
            setIsRendering(false);
          });
        }
      } catch (error) {
        if (!cancelled) {
          setRenderError(error instanceof Error ? error.message : "Preview render failed.");
          setIsRendering(false);
        }
      }
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };
  }, [beforeAfterVisible, compareMode, deferredSettings, imageElement, onHistogramChange, sourceImage]);

  if (!sourceImage) {
    return (
      <section className="rounded-chrome border border-white/10 bg-[linear-gradient(180deg,rgba(18,26,37,0.96),rgba(8,13,20,0.92))] shadow-panel">
        <div className="flex min-h-[620px] flex-col items-center justify-center px-8 text-center">
          <span className="rounded-full border border-sky-300/20 bg-sky-300/10 px-4 py-2 text-xs uppercase tracking-[0.36em] text-sky-100">
            Preview Deck
          </span>
          <h2 className="mt-6 text-3xl font-semibold tracking-tight text-slate-50">Build a cinematic aviation grade</h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
            Upload a helicopter or aircraft image to unlock the non-destructive canvas preview, side-by-side compare, presets, histogram, and export panel.
          </p>
        </div>
      </section>
    );
  }

  const showSplit = compareMode === "split";
  const showOriginalOnly = compareMode === "single" && beforeAfterVisible;

  return (
    <section className="rounded-chrome border border-white/10 bg-[linear-gradient(180deg,rgba(18,26,37,0.98),rgba(9,14,22,0.94))] shadow-panel">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 px-5 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Preview</p>
          <p className="mt-2 text-sm text-slate-300">
            {renderStats
              ? `Rendered ${renderStats.width}x${renderStats.height}px in ${renderStats.durationMs.toFixed(0)}ms`
              : "Waiting for render"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ToolbarButton disabled={zoom <= 50} onClick={() => onZoomChange(Math.max(50, zoom - 10))}>
            Zoom -
          </ToolbarButton>
          <ToolbarButton onClick={onFitToScreen} title="0">
            Fit
          </ToolbarButton>
          <ToolbarButton disabled={zoom >= 300} onClick={() => onZoomChange(Math.min(300, zoom + 10))}>
            Zoom +
          </ToolbarButton>
        </div>
      </div>

      <div className="relative p-5">
        {isLoading || isRendering ? (
          <div className="pointer-events-none absolute inset-x-5 top-5 z-10 flex justify-end">
            <div className="rounded-full border border-white/10 bg-[#02060b]/80 px-4 py-2 text-xs uppercase tracking-[0.28em] text-slate-300 backdrop-blur">
              {isLoading ? "Loading source..." : "Rendering preview..."}
            </div>
          </div>
        ) : null}

        {renderError ? (
          <div className="mb-4 rounded-[1.4rem] border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            {renderError}
          </div>
        ) : null}

        <div className={showSplit ? "grid gap-4 2xl:grid-cols-2" : "grid gap-4"}>
          {showSplit ? (
            <>
              <PreviewCanvasPane label="Original" canvasRef={originalCanvasRef} zoom={zoom} />
              <PreviewCanvasPane label="Edited" canvasRef={editedCanvasRef} zoom={zoom} />
            </>
          ) : (
            <PreviewCanvasPane
              label={showOriginalOnly ? "Before" : "After"}
              canvasRef={showOriginalOnly ? originalCanvasRef : editedCanvasRef}
              zoom={zoom}
            />
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/8 px-5 py-4 text-xs uppercase tracking-[0.24em] text-slate-500">
        <span>Preview scale: {renderStats ? `${Math.round(renderStats.scale * 100)}% of source` : "n/a"}</span>
        <span>Use Space for a temporary before view</span>
      </div>
    </section>
  );
}
