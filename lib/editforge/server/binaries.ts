import { access } from "node:fs/promises";
import { constants } from "node:fs";

export function getFfmpegPath() {
  return process.env.FFMPEG_PATH?.trim() || "ffmpeg";
}

export function getFfprobePath() {
  return process.env.FFPROBE_PATH?.trim() || "ffprobe";
}

export async function assertBinaryReadable(binaryPath: string) {
  if (binaryPath === "ffmpeg" || binaryPath === "ffprobe") {
    return;
  }

  await access(binaryPath, constants.R_OK);
}
