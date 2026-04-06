import path from "node:path";

import {
  AUDIO_EXTENSIONS,
  CLIP_ORDERINGS,
  EDIT_STYLES,
  MAX_AUDIO_FILE_BYTES,
  MAX_VIDEO_FILE_BYTES,
  MAX_VIDEO_FILES,
  OUTPUT_FORMATS,
  SUPPORTED_AUDIO_MIME_TYPES,
  SUPPORTED_VIDEO_MIME_TYPES,
  VIDEO_EXTENSIONS
} from "@/lib/editforge/constants";
import type { ClipOrdering, EditRequestOptions, EditStyle, OutputFormat } from "@/lib/editforge/types";
import { getExtension } from "@/lib/editforge/utils";

function isValidOptionValue<T extends string>(value: FormDataEntryValue | null, allowed: readonly T[]): value is T {
  return typeof value === "string" && allowed.includes(value as T);
}

export function parseEditOptions(formData: FormData) {
  const outputFormat = formData.get("outputFormat");
  const editStyle = formData.get("editStyle");
  const clipOrdering = formData.get("clipOrdering");

  if (!isValidOptionValue(outputFormat, OUTPUT_FORMATS.map((item) => item.id))) {
    throw new Error("Choose a valid output format before rendering.");
  }

  if (!isValidOptionValue(editStyle, EDIT_STYLES.map((item) => item.id))) {
    throw new Error("Choose a valid edit style before rendering.");
  }

  if (!isValidOptionValue(clipOrdering, CLIP_ORDERINGS.map((item) => item.id))) {
    throw new Error("Choose a valid clip ordering before rendering.");
  }

  return {
    outputFormat: outputFormat as OutputFormat,
    editStyle: editStyle as EditStyle,
    clipOrdering: clipOrdering as ClipOrdering
  } satisfies EditRequestOptions;
}

export function validateClipFiles(files: File[]) {
  if (files.length === 0) {
    throw new Error("Upload at least one video clip.");
  }

  if (files.length > MAX_VIDEO_FILES) {
    throw new Error(`Upload up to ${MAX_VIDEO_FILES} clips per edit.`);
  }

  files.forEach((file) => validateVideoFile(file));
}

export function validateVideoFile(file: File) {
  const extension = getExtension(file.name);
  const validMime = SUPPORTED_VIDEO_MIME_TYPES.includes(file.type as (typeof SUPPORTED_VIDEO_MIME_TYPES)[number]);
  const validExtension = VIDEO_EXTENSIONS.includes(extension as (typeof VIDEO_EXTENSIONS)[number]);

  if (!validMime && !validExtension) {
    throw new Error(`Unsupported video file: ${file.name}`);
  }

  if (file.size > MAX_VIDEO_FILE_BYTES) {
    throw new Error(`${file.name} exceeds the ${Math.round(MAX_VIDEO_FILE_BYTES / 1024 / 1024)} MB clip limit.`);
  }
}

export function validateAudioFile(file: File | null) {
  if (!file) {
    throw new Error("Upload one audio track before rendering.");
  }

  const extension = getExtension(file.name);
  const validMime = SUPPORTED_AUDIO_MIME_TYPES.includes(file.type as (typeof SUPPORTED_AUDIO_MIME_TYPES)[number]);
  const validExtension = AUDIO_EXTENSIONS.includes(extension as (typeof AUDIO_EXTENSIONS)[number]);

  if (!validMime && !validExtension) {
    throw new Error(`Unsupported audio file: ${file.name}`);
  }

  if (file.size > MAX_AUDIO_FILE_BYTES) {
    throw new Error(`${file.name} exceeds the ${Math.round(MAX_AUDIO_FILE_BYTES / 1024 / 1024)} MB audio limit.`);
  }
}

export function resolveExtension(file: File, fallback: string) {
  const extension = getExtension(file.name);
  return extension ? extension : fallback;
}

export function buildStoredFileName(prefix: string, index: number, file: File, fallback: string) {
  const safeExtension = resolveExtension(file, fallback);
  return `${prefix}-${String(index).padStart(2, "0")}${safeExtension}`;
}

export function getDisplayFileName(fileName: string) {
  return path.basename(fileName);
}
