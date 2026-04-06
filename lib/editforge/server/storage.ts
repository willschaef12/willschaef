import { mkdir, readdir, readFile, rm, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { JOB_TTL_MINUTES } from "@/lib/editforge/constants";
import type { StoredJobManifest } from "@/lib/editforge/types";

export interface JobPaths {
  root: string;
  uploadsDir: string;
  intermediateDir: string;
  outputDir: string;
  manifestPath: string;
  statusPath: string;
}

export function getStorageRoot() {
  const configured = process.env.EDITFORGE_STORAGE_DIR?.trim();
  return configured ? path.resolve(process.cwd(), configured) : path.join(process.cwd(), ".editforge");
}

export function getJobPaths(jobId: string): JobPaths {
  const root = path.join(getStorageRoot(), jobId);
  return {
    root,
    uploadsDir: path.join(root, "uploads"),
    intermediateDir: path.join(root, "intermediate"),
    outputDir: path.join(root, "output"),
    manifestPath: path.join(root, "manifest.json"),
    statusPath: path.join(root, "status.json")
  };
}

export async function ensureJobDirectories(jobId: string) {
  const paths = getJobPaths(jobId);

  await Promise.all([
    mkdir(paths.uploadsDir, { recursive: true }),
    mkdir(paths.intermediateDir, { recursive: true }),
    mkdir(paths.outputDir, { recursive: true })
  ]);

  return paths;
}

export async function writeManifest(jobId: string, manifest: StoredJobManifest) {
  const { manifestPath } = getJobPaths(jobId);
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
}

export async function readManifest(jobId: string) {
  const { manifestPath } = getJobPaths(jobId);
  const raw = await readFile(manifestPath, "utf8");
  return JSON.parse(raw) as StoredJobManifest;
}

export async function cleanupExpiredJobs() {
  const root = getStorageRoot();
  const ttlMs = JOB_TTL_MINUTES * 60 * 1000;
  const now = Date.now();

  await mkdir(root, { recursive: true });

  const entries = await readdir(root, { withFileTypes: true });

  await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => {
        const jobRoot = path.join(root, entry.name);

        try {
          const info = await stat(jobRoot);
          if (now - info.mtimeMs > ttlMs) {
            await rm(jobRoot, { recursive: true, force: true });
          }
        } catch {
          return;
        }
      })
  );
}

export async function removeWorkingFiles(jobId: string) {
  const paths = getJobPaths(jobId);
  await Promise.all([
    rm(paths.uploadsDir, { recursive: true, force: true }),
    rm(paths.intermediateDir, { recursive: true, force: true })
  ]);
}

export async function removeOutputFile(jobId: string, fileName: string) {
  const target = path.join(getJobPaths(jobId).outputDir, fileName);

  try {
    await unlink(target);
  } catch {
    return;
  }
}
