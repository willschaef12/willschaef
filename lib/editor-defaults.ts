export type CompareMode = "single" | "split";
export type ExportFormat = "image/jpeg" | "image/png";

export interface CropValues {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface EditSettings {
  exposure: number;
  contrast: number;
  highlights: number;
  shadows: number;
  whites: number;
  blacks: number;
  temperature: number;
  tint: number;
  vibrance: number;
  saturation: number;
  clarity: number;
  dehaze: number;
  sharpness: number;
  noiseReduction: number;
  rotation: number;
  straighten: number;
  crop: CropValues;
}

export interface SourceImage {
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  width: number;
  height: number;
}

export interface HistogramData {
  red: number[];
  green: number[];
  blue: number[];
  luminance: number[];
}

export interface SliderDefinition {
  key: Exclude<keyof EditSettings, "crop">;
  label: string;
  min: number;
  max: number;
  step: number;
  description: string;
}

export type EditPatch = Partial<Omit<EditSettings, "crop">> & {
  crop?: Partial<CropValues>;
};

export const FILE_ACCEPT = ".jpg,.jpeg,.png,.webp";
export const SUPPORTED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_FILE_SIZE_BYTES = 30 * 1024 * 1024;
export const PREVIEW_MAX_DIMENSION = 1600;
export const HISTORY_LIMIT = 80;
export const HISTOGRAM_BINS = 64;

export const DEFAULT_CROP: CropValues = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0
};

export const DEFAULT_SETTINGS: EditSettings = {
  exposure: 0,
  contrast: 0,
  highlights: 0,
  shadows: 0,
  whites: 0,
  blacks: 0,
  temperature: 0,
  tint: 0,
  vibrance: 0,
  saturation: 0,
  clarity: 0,
  dehaze: 0,
  sharpness: 0,
  noiseReduction: 0,
  rotation: 0,
  straighten: 0,
  crop: DEFAULT_CROP
};

export const EMPTY_HISTOGRAM: HistogramData = {
  red: Array.from({ length: HISTOGRAM_BINS }, () => 0),
  green: Array.from({ length: HISTOGRAM_BINS }, () => 0),
  blue: Array.from({ length: HISTOGRAM_BINS }, () => 0),
  luminance: Array.from({ length: HISTOGRAM_BINS }, () => 0)
};

export const BASIC_SLIDERS: SliderDefinition[] = [
  {
    key: "exposure",
    label: "Exposure",
    min: -100,
    max: 100,
    step: 1,
    description: "Overall scene brightness in a Lightroom-style range."
  },
  {
    key: "contrast",
    label: "Contrast",
    min: -100,
    max: 100,
    step: 1,
    description: "Expands or compresses the distance between darks and lights."
  },
  {
    key: "highlights",
    label: "Highlights",
    min: -100,
    max: 100,
    step: 1,
    description: "Targets the brightest parts of clouds, fuselage reflections, and windows."
  },
  {
    key: "shadows",
    label: "Shadows",
    min: -100,
    max: 100,
    step: 1,
    description: "Lifts or deepens detail in cockpit glass, wheel wells, and undersides."
  },
  {
    key: "whites",
    label: "Whites",
    min: -100,
    max: 100,
    step: 1,
    description: "Pushes the extreme bright point of the image."
  },
  {
    key: "blacks",
    label: "Blacks",
    min: -100,
    max: 100,
    step: 1,
    description: "Sets the image floor for deeper silhouettes and richer shadows."
  }
];

export const COLOR_SLIDERS: SliderDefinition[] = [
  {
    key: "temperature",
    label: "Temperature",
    min: -100,
    max: 100,
    step: 1,
    description: "Shifts the image cooler or warmer for sky and sunset balance."
  },
  {
    key: "tint",
    label: "Tint",
    min: -100,
    max: 100,
    step: 1,
    description: "Adds green or magenta correction to neutralize difficult lighting."
  },
  {
    key: "vibrance",
    label: "Vibrance",
    min: -100,
    max: 100,
    step: 1,
    description: "Boosts muted colors first, useful for skies without oversaturating liveries."
  },
  {
    key: "saturation",
    label: "Saturation",
    min: -100,
    max: 100,
    step: 1,
    description: "Raises or lowers overall color intensity."
  }
];

export const DETAIL_SLIDERS: SliderDefinition[] = [
  {
    key: "clarity",
    label: "Clarity",
    min: -100,
    max: 100,
    step: 1,
    description: "Adds local midtone contrast to rivets, rotor hubs, and fuselage seams."
  },
  {
    key: "dehaze",
    label: "Dehaze",
    min: -100,
    max: 100,
    step: 1,
    description: "Cuts through atmospheric softness and low-contrast haze."
  },
  {
    key: "sharpness",
    label: "Sharpness",
    min: 0,
    max: 100,
    step: 1,
    description: "Applies a lightweight unsharp mask to preview and export renders."
  },
  {
    key: "noiseReduction",
    label: "Noise Reduction",
    min: 0,
    max: 100,
    step: 1,
    description: "Blends fine grain toward a smoother image for noisy dusk or telephoto shots."
  }
];

export const GEOMETRY_SLIDERS: SliderDefinition[] = [
  {
    key: "straighten",
    label: "Straighten",
    min: -25,
    max: 25,
    step: 0.1,
    description: "Fine-rotation trim for horizons, ramp lines, and hangar edges."
  }
];

export const CROP_SLIDERS = [
  {
    key: "top",
    label: "Top Crop",
    description: "Trims the frame from the top edge."
  },
  {
    key: "right",
    label: "Right Crop",
    description: "Trims the frame from the right edge."
  },
  {
    key: "bottom",
    label: "Bottom Crop",
    description: "Trims the frame from the bottom edge."
  },
  {
    key: "left",
    label: "Left Crop",
    description: "Trims the frame from the left edge."
  }
] as const;

export function cloneSettings(settings: EditSettings): EditSettings {
  return {
    ...settings,
    crop: { ...settings.crop }
  };
}

export function mergeSettings(settings: EditSettings, patch: EditPatch): EditSettings {
  return {
    ...settings,
    ...patch,
    crop: {
      ...settings.crop,
      ...patch.crop
    }
  };
}

export function createBaseCompareSettings(settings: EditSettings): EditSettings {
  return {
    ...DEFAULT_SETTINGS,
    rotation: settings.rotation,
    straighten: settings.straighten,
    crop: { ...settings.crop }
  };
}

export function normalizeRotation(value: number): number {
  const normalized = value % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

export function settingsEqual(left: EditSettings, right: EditSettings): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function formatAdjustmentValue(key: SliderDefinition["key"], value: number): string {
  if (key === "exposure") {
    return `${(value / 50).toFixed(2)} EV`;
  }

  if (key === "straighten") {
    return `${value.toFixed(1)} deg`;
  }

  return `${value > 0 ? "+" : ""}${value.toFixed(Number.isInteger(value) ? 0 : 1)}`;
}

export function formatCropValue(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function hasEditedGeometry(settings: EditSettings): boolean {
  return (
    settings.rotation !== 0 ||
    settings.straighten !== 0 ||
    Object.values(settings.crop).some((value) => value !== 0)
  );
}
