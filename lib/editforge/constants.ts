import type { ClipOrderingSpec, EditStyleSpec, OutputFormatSpec } from "@/lib/editforge/types";

const maxVideoMb = Number(process.env.EDITFORGE_MAX_VIDEO_MB ?? 300);
const maxAudioMb = Number(process.env.EDITFORGE_MAX_AUDIO_MB ?? 80);

export const APP_NAME = "EditForge";
export const MAX_VIDEO_FILES = 16;
export const MAX_VIDEO_FILE_BYTES = maxVideoMb * 1024 * 1024;
export const MAX_AUDIO_FILE_BYTES = maxAudioMb * 1024 * 1024;
export const DEFAULT_POLL_INTERVAL_MS = 1500;
export const JOB_TTL_MINUTES = Number(process.env.EDITFORGE_JOB_TTL_MINUTES ?? 120);
export const TARGET_FPS = 30;
export const OUTPUT_FILE_NAME = "editforge-export.mp4";

export const SUPPORTED_VIDEO_MIME_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-matroska",
  "video/ogg"
] as const;

export const SUPPORTED_AUDIO_MIME_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/aac",
  "audio/mp4",
  "audio/x-m4a",
  "audio/webm",
  "audio/ogg"
] as const;

export const VIDEO_EXTENSIONS = [".mp4", ".mov", ".webm", ".mkv", ".ogv"] as const;
export const AUDIO_EXTENSIONS = [".mp3", ".wav", ".aac", ".m4a", ".webm", ".ogg"] as const;

export const OUTPUT_FORMATS: OutputFormatSpec[] = [
  {
    id: "vertical",
    label: "Vertical",
    aspectRatioLabel: "9:16",
    width: 1080,
    height: 1920,
    description: "Built for Shorts, Reels, and TikTok delivery."
  },
  {
    id: "horizontal",
    label: "Horizontal",
    aspectRatioLabel: "16:9",
    width: 1920,
    height: 1080,
    description: "YouTube-ready framing with cinematic full-width composition."
  },
  {
    id: "square",
    label: "Square",
    aspectRatioLabel: "1:1",
    width: 1080,
    height: 1080,
    description: "Balanced social crop for feed-first content."
  }
];

export const EDIT_STYLES: EditStyleSpec[] = [
  {
    id: "fast",
    label: "Fast",
    description: "Punchy short cuts with tighter pacing.",
    cadenceLabel: "1.2s average cuts",
    baseSegmentSeconds: 1.2,
    variationSeconds: 0.35,
    minSegmentSeconds: 0.8,
    maxSegmentSeconds: 1.8
  },
  {
    id: "cinematic",
    label: "Cinematic",
    description: "Longer shots and steadier movement for dramatic builds.",
    cadenceLabel: "3.4s average cuts",
    baseSegmentSeconds: 3.4,
    variationSeconds: 0.65,
    minSegmentSeconds: 1.8,
    maxSegmentSeconds: 4.8
  },
  {
    id: "smooth",
    label: "Smooth",
    description: "Balanced pacing that lands between social and narrative.",
    cadenceLabel: "2.4s average cuts",
    baseSegmentSeconds: 2.4,
    variationSeconds: 0.45,
    minSegmentSeconds: 1.4,
    maxSegmentSeconds: 3.2
  },
  {
    id: "hype",
    label: "Hype",
    description: "Aggressive energy and faster swaps for promo edits.",
    cadenceLabel: "1.6s average cuts",
    baseSegmentSeconds: 1.6,
    variationSeconds: 0.5,
    minSegmentSeconds: 0.9,
    maxSegmentSeconds: 2.2
  }
];

export const CLIP_ORDERINGS: ClipOrderingSpec[] = [
  {
    id: "upload",
    label: "Upload order",
    description: "Preserve the sequence exactly as the clips were added."
  },
  {
    id: "random",
    label: "Randomized",
    description: "Shuffle the source clips before building the timeline."
  }
];
