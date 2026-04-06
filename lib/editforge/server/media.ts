import { spawn } from "node:child_process";

import { getFfmpegPath, getFfprobePath, assertBinaryReadable } from "@/lib/editforge/server/binaries";

interface ProcessResult {
  stdout: string;
  stderr: string;
}

export async function runProcess(binaryPath: string, args: string[]) {
  return new Promise<ProcessResult>((resolve, reject) => {
    const child = spawn(binaryPath, args, {
      stdio: ["ignore", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      if ("code" in error && error.code === "ENOENT") {
        reject(new Error(`Unable to find ${binaryPath}. Install FFmpeg and FFprobe, or set FFMPEG_PATH / FFPROBE_PATH.`));
        return;
      }

      reject(error);
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      reject(new Error(stderr.trim() || `${binaryPath} exited with code ${code}.`));
    });
  });
}

export async function assertMediaBinariesAvailable() {
  const ffmpegPath = getFfmpegPath();
  const ffprobePath = getFfprobePath();

  await Promise.all([assertBinaryReadable(ffmpegPath), assertBinaryReadable(ffprobePath)]);
  await runProcess(ffmpegPath, ["-version"]);
  await runProcess(ffprobePath, ["-version"]);
}

export async function probeDurationSeconds(filePath: string) {
  const ffprobePath = getFfprobePath();
  const result = await runProcess(ffprobePath, [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "json",
    filePath
  ]);

  const parsed = JSON.parse(result.stdout) as { format?: { duration?: string } };
  const duration = Number(parsed.format?.duration ?? 0);

  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error(`Unable to read media duration for ${filePath}.`);
  }

  return duration;
}
