import { MAX_FILE_SIZE_BYTES, SourceImage, SUPPORTED_FILE_TYPES } from "@/lib/editor-defaults";

export function formatBytes(value: number): string {
  if (value < 1024) {
    return `${value} B`;
  }

  const units = ["KB", "MB", "GB"];
  let size = value / 1024;
  let index = 0;

  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }

  return `${size.toFixed(size >= 100 ? 0 : 1)} ${units[index]}`;
}

export function validateImageFile(file: File): string | null {
  if (!SUPPORTED_FILE_TYPES.includes(file.type)) {
    return "Unsupported file type. Use JPG, PNG, or WEBP.";
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `File is too large. Skyroom currently accepts files up to ${formatBytes(MAX_FILE_SIZE_BYTES)}.`;
  }

  return null;
}

export function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Skyroom could not decode this image."));
    image.src = url;
  });
}

export async function readImageMetadata(file: File): Promise<SourceImage> {
  const url = URL.createObjectURL(file);

  try {
    const image = await loadImageFromUrl(url);

    return {
      url,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      width: image.naturalWidth,
      height: image.naturalHeight
    };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = fileName;
  anchor.click();

  URL.revokeObjectURL(url);
}
