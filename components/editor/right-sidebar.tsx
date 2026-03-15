"use client";

import { useState } from "react";

import {
  BASIC_SLIDERS,
  COLOR_SLIDERS,
  CROP_SLIDERS,
  DEFAULT_CROP,
  DETAIL_SLIDERS,
  EditPatch,
  EditSettings,
  formatAdjustmentValue,
  formatCropValue,
  GEOMETRY_SLIDERS,
  HistogramData
} from "@/lib/editor-defaults";
import { SKYROOM_PRESETS } from "@/lib/editor-presets";

import {
  CollapsibleSection,
  PanelCard,
  SliderControl,
  ToolbarButton,
  cx
} from "@/components/editor/ui";

interface RightSidebarProps {
  settings: EditSettings;
  activePreset: string | null;
  histogram: HistogramData;
  onApplyPreset: (presetId: string) => void;
  onUpdateSettings: (patch: EditPatch) => void;
  onApplyPatchWithHistory: (patch: EditPatch, label: string) => void;
  onBeginInteraction: () => void;
  onCommitInteraction: (label: string) => void;
  onRotateBy: (degrees: number) => void;
}

function buildHistogramPath(values: number[], width: number, height: number) {
  const maxValue = Math.max(...values, 1);
  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - (value / maxValue) * height;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function HistogramPanel({ histogram }: { histogram: HistogramData }) {
  const width = 280;
  const height = 120;

  return (
    <PanelCard title="Histogram" subtitle="Rendered preview distribution for the edited image.">
      <div className="overflow-hidden rounded-[1.35rem] border border-white/8 bg-[#060b12] p-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-32 w-full">
          <path d={buildHistogramPath(histogram.luminance, width, height)} fill="none" stroke="rgba(239, 245, 255, 0.6)" strokeWidth="2.2" />
          <path d={buildHistogramPath(histogram.red, width, height)} fill="none" stroke="rgba(248, 113, 113, 0.78)" strokeWidth="1.8" />
          <path d={buildHistogramPath(histogram.green, width, height)} fill="none" stroke="rgba(74, 222, 128, 0.78)" strokeWidth="1.8" />
          <path d={buildHistogramPath(histogram.blue, width, height)} fill="none" stroke="rgba(96, 165, 250, 0.82)" strokeWidth="1.8" />
        </svg>
        <div className="mt-3 flex items-center justify-between text-[11px] uppercase tracking-[0.26em] text-slate-500">
          <span>Shadows</span>
          <span>Midtones</span>
          <span>Highlights</span>
        </div>
      </div>
    </PanelCard>
  );
}

export function RightSidebar({
  settings,
  activePreset,
  histogram,
  onApplyPreset,
  onUpdateSettings,
  onApplyPatchWithHistory,
  onBeginInteraction,
  onCommitInteraction,
  onRotateBy
}: RightSidebarProps) {
  const [sections, setSections] = useState({
    presets: true,
    basic: true,
    color: true,
    detail: true,
    geometry: true,
    crop: false,
    future: true
  });

  const toggleSection = (key: keyof typeof sections) => {
    setSections((current) => ({
      ...current,
      [key]: !current[key]
    }));
  };

  return (
    <aside className="flex flex-col gap-4">
      <HistogramPanel histogram={histogram} />

      <PanelCard title="Controls" subtitle="Presets, tonal grading, geometry, and future selective edit hooks.">
        <div className="space-y-4">
          <CollapsibleSection
            title="Presets"
            subtitle="Built-in looks tuned for aircraft and rotorcraft photography."
            open={sections.presets}
            onToggle={() => toggleSection("presets")}
          >
            <div className="grid gap-3">
              {SKYROOM_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onApplyPreset(preset.id)}
                  title={preset.description}
                  className={cx(
                    "rounded-[1.35rem] border px-4 py-4 text-left transition",
                    activePreset === preset.id
                      ? "border-sky-300/50 bg-sky-300/12"
                      : "border-white/8 bg-white/[0.03] hover:border-white/18 hover:bg-white/[0.05]"
                  )}
                >
                  <p className="text-sm font-semibold text-slate-100">{preset.name}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{preset.description}</p>
                </button>
              ))}
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            title="Basic"
            subtitle="Global exposure and tonal shape."
            open={sections.basic}
            onToggle={() => toggleSection("basic")}
          >
            <div className="space-y-4">
              {BASIC_SLIDERS.map((slider) => (
                <SliderControl
                  key={slider.key}
                  label={slider.label}
                  description={slider.description}
                  min={slider.min}
                  max={slider.max}
                  step={slider.step}
                  value={settings[slider.key]}
                  displayValue={formatAdjustmentValue(slider.key, settings[slider.key])}
                  onInteractionStart={onBeginInteraction}
                  onCommit={() => onCommitInteraction(slider.label)}
                  onChange={(value) => onUpdateSettings({ [slider.key]: value })}
                />
              ))}
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            title="Color"
            subtitle="White balance, color intensity, and atmospheric mood."
            open={sections.color}
            onToggle={() => toggleSection("color")}
          >
            <div className="space-y-4">
              {COLOR_SLIDERS.map((slider) => (
                <SliderControl
                  key={slider.key}
                  label={slider.label}
                  description={slider.description}
                  min={slider.min}
                  max={slider.max}
                  step={slider.step}
                  value={settings[slider.key]}
                  displayValue={formatAdjustmentValue(slider.key, settings[slider.key])}
                  onInteractionStart={onBeginInteraction}
                  onCommit={() => onCommitInteraction(slider.label)}
                  onChange={(value) => onUpdateSettings({ [slider.key]: value })}
                />
              ))}
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            title="Detail"
            subtitle="Texture, haze control, sharpness, and cleanup."
            open={sections.detail}
            onToggle={() => toggleSection("detail")}
          >
            <div className="space-y-4">
              {DETAIL_SLIDERS.map((slider) => (
                <SliderControl
                  key={slider.key}
                  label={slider.label}
                  description={slider.description}
                  min={slider.min}
                  max={slider.max}
                  step={slider.step}
                  value={settings[slider.key]}
                  displayValue={formatAdjustmentValue(slider.key, settings[slider.key])}
                  onInteractionStart={onBeginInteraction}
                  onCommit={() => onCommitInteraction(slider.label)}
                  onChange={(value) => onUpdateSettings({ [slider.key]: value })}
                />
              ))}
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            title="Geometry"
            subtitle="Crop, straighten, and rotation controls."
            open={sections.geometry}
            onToggle={() => toggleSection("geometry")}
            actions={
              <div className="flex items-center gap-2">
                <ToolbarButton onClick={() => onRotateBy(-90)} title="Rotate left">
                  -90
                </ToolbarButton>
                <ToolbarButton onClick={() => onRotateBy(90)} title="Rotate right">
                  +90
                </ToolbarButton>
              </div>
            }
          >
            <div className="space-y-4">
              <div className="rounded-[1.35rem] border border-white/8 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-100">Rotation</p>
                    <p className="mt-1 text-xs text-slate-400">Quarter-turn controls for portrait, banking, or rescue-scene framing.</p>
                  </div>
                  <span className="rounded-full border border-white/8 bg-black/20 px-2 py-1 text-xs text-slate-300">
                    {settings.rotation.toFixed(0)} deg
                  </span>
                </div>
              </div>

              {GEOMETRY_SLIDERS.map((slider) => (
                <SliderControl
                  key={slider.key}
                  label={slider.label}
                  description={slider.description}
                  min={slider.min}
                  max={slider.max}
                  step={slider.step}
                  value={settings[slider.key]}
                  displayValue={formatAdjustmentValue(slider.key, settings[slider.key])}
                  onInteractionStart={onBeginInteraction}
                  onCommit={() => onCommitInteraction(slider.label)}
                  onChange={(value) => onUpdateSettings({ [slider.key]: value })}
                />
              ))}
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            title="Crop"
            subtitle="Percentage-based trim controls for a maintainable starter workflow."
            open={sections.crop}
            onToggle={() => toggleSection("crop")}
            actions={
              <ToolbarButton onClick={() => onApplyPatchWithHistory({ crop: DEFAULT_CROP }, "Reset Crop")}>
                Reset Crop
              </ToolbarButton>
            }
          >
            <div className="space-y-4">
              {CROP_SLIDERS.map((slider) => (
                <SliderControl
                  key={slider.key}
                  label={slider.label}
                  description={slider.description}
                  min={0}
                  max={45}
                  step={0.5}
                  value={settings.crop[slider.key]}
                  displayValue={formatCropValue(settings.crop[slider.key])}
                  onInteractionStart={onBeginInteraction}
                  onCommit={() => onCommitInteraction(slider.label)}
                  onChange={(value) => onUpdateSettings({ crop: { [slider.key]: value } })}
                />
              ))}
              <div className="rounded-[1.35rem] border border-white/8 bg-white/[0.03] p-4 text-sm leading-6 text-slate-400">
                Crop is stored as percentages on the edit state, so preview and export both re-render from the untouched original file.
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            title="Future Tools"
            subtitle="Placeholders for selective edits and masking."
            open={sections.future}
            onToggle={() => toggleSection("future")}
          >
            <div className="space-y-3">
              <div className="rounded-[1.35rem] border border-dashed border-sky-300/25 bg-sky-300/8 p-4">
                <p className="text-sm font-semibold text-slate-100">Mask / Brush Tool</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Placeholder only. The current starter product is global-edit first, but this panel is where selective masks or AI-assisted local adjustments would slot in later.
                </p>
              </div>
            </div>
          </CollapsibleSection>
        </div>
      </PanelCard>
    </aside>
  );
}
