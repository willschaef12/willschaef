import { DEFAULT_SETTINGS, EditPatch, EditSettings } from "@/lib/editor-defaults";

export interface EditorPreset {
  id: string;
  name: string;
  description: string;
  patch: EditPatch;
}

export const SKYROOM_PRESETS: EditorPreset[] = [
  {
    id: "clear-sky",
    name: "Clear Sky",
    description: "Cleans haze and opens the blue channel for bright daytime spotter work.",
    patch: {
      exposure: 10,
      contrast: 14,
      highlights: -18,
      shadows: 10,
      temperature: -8,
      vibrance: 18,
      saturation: 6,
      clarity: 12,
      dehaze: 22,
      sharpness: 18
    }
  },
  {
    id: "golden-hour",
    name: "Golden Hour",
    description: "Warmer sunset balance with gentle contrast and lifted shadows.",
    patch: {
      exposure: 8,
      contrast: 10,
      highlights: -24,
      shadows: 18,
      whites: 10,
      blacks: -8,
      temperature: 24,
      tint: 6,
      vibrance: 22,
      saturation: 7,
      clarity: 8
    }
  },
  {
    id: "aircraft-pop",
    name: "Aircraft Pop",
    description: "Adds crisp edges, punchy contrast, and extra depth for jet bodies.",
    patch: {
      exposure: 5,
      contrast: 20,
      highlights: -10,
      shadows: 8,
      whites: 16,
      blacks: -16,
      vibrance: 12,
      clarity: 18,
      dehaze: 10,
      sharpness: 28
    }
  },
  {
    id: "helicopter-detail",
    name: "Helicopter Detail",
    description: "Emphasizes mechanical texture around rotor assemblies and cabin interiors.",
    patch: {
      exposure: 4,
      contrast: 18,
      highlights: -16,
      shadows: 14,
      blacks: -10,
      temperature: -4,
      clarity: 24,
      dehaze: 8,
      sharpness: 32,
      noiseReduction: 10
    }
  },
  {
    id: "cool-overcast",
    name: "Cool Overcast",
    description: "Restores shape and cool neutrality when skies are flat or gray.",
    patch: {
      exposure: 6,
      contrast: 12,
      highlights: -20,
      shadows: 16,
      temperature: -14,
      tint: -3,
      vibrance: 10,
      saturation: -4,
      clarity: 10,
      dehaze: 16
    }
  },
  {
    id: "spotter-sharp",
    name: "Spotter Sharp",
    description: "A crisp telephoto profile tuned for registrations and fine edge detail.",
    patch: {
      exposure: 2,
      contrast: 16,
      highlights: -12,
      shadows: 6,
      whites: 10,
      blacks: -12,
      clarity: 22,
      dehaze: 12,
      sharpness: 38,
      noiseReduction: 6
    }
  },
  {
    id: "soft-neutral",
    name: "Soft Neutral",
    description: "Low-drama, balanced grading for clean editorial delivery.",
    patch: {
      exposure: 4,
      contrast: -8,
      highlights: -10,
      shadows: 10,
      whites: 4,
      blacks: -4,
      temperature: 2,
      tint: 1,
      vibrance: 6,
      saturation: -3,
      clarity: -6,
      sharpness: 8
    }
  }
];

export function buildPresetSettings(
  patch: EditPatch,
  preserve: Pick<EditSettings, "rotation" | "straighten" | "crop">
) {
  return {
    ...DEFAULT_SETTINGS,
    ...patch,
    crop: { ...preserve.crop },
    rotation: preserve.rotation,
    straighten: preserve.straighten
  };
}
