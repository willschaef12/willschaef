import { readFile, writeFile } from "node:fs/promises";

import type { EditJobStatus } from "@/lib/editforge/types";
import { getJobPaths } from "@/lib/editforge/server/storage";

export async function writeJobStatus(jobId: string, status: EditJobStatus) {
  const { statusPath } = getJobPaths(jobId);
  await writeFile(statusPath, JSON.stringify(status, null, 2), "utf8");
}

export async function readJobStatus(jobId: string) {
  const { statusPath } = getJobPaths(jobId);
  const raw = await readFile(statusPath, "utf8");
  return JSON.parse(raw) as EditJobStatus;
}

export async function updateJobStatus(jobId: string, patch: Partial<EditJobStatus>) {
  const current = await readJobStatus(jobId);
  const next: EditJobStatus = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString()
  };

  await writeJobStatus(jobId, next);
  return next;
}
