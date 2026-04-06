export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  let remainder = bytes;
  let unitIndex = 0;

  while (remainder >= 1024 && unitIndex < units.length - 1) {
    remainder /= 1024;
    unitIndex += 1;
  }

  const formatted = remainder >= 10 || unitIndex === 0 ? remainder.toFixed(0) : remainder.toFixed(1);
  return `${formatted} ${units[unitIndex]}`;
}

export function formatDuration(seconds: number | null | undefined) {
  if (!seconds || !Number.isFinite(seconds)) {
    return "Unknown";
  }

  const rounded = Math.max(0, Math.round(seconds));
  const mins = Math.floor(rounded / 60);
  const secs = rounded % 60;
  return mins > 0 ? `${mins}:${secs.toString().padStart(2, "0")}` : `${secs}s`;
}

export function estimateRenderSeconds(clipCount: number, audioDurationSeconds: number | null | undefined) {
  const audioDuration = audioDurationSeconds ?? clipCount * 3;
  return Math.max(20, Math.round(audioDuration * 0.6 + clipCount * 5));
}

export function getExtension(fileName: string) {
  const match = /\.[^./\\]+$/.exec(fileName);
  return match ? match[0].toLowerCase() : "";
}

export function slugifyFileStem(name: string) {
  return name
    .toLowerCase()
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "media";
}

export function hashSeed(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function seededRandom(seed: string, offset: number) {
  let state = (hashSeed(`${seed}:${offset}`) || 1) >>> 0;

  state ^= state << 13;
  state ^= state >>> 17;
  state ^= state << 5;

  return ((state >>> 0) % 10_000) / 10_000;
}

export function shuffleWithSeed<T>(items: T[], seed: string) {
  const output = [...items];

  for (let index = output.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(seededRandom(seed, index) * (index + 1));
    const current = output[index];
    output[index] = output[swapIndex];
    output[swapIndex] = current;
  }

  return output;
}
