import { readFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { getJobPaths } from "@/lib/editforge/server/storage";
import { readJobStatus } from "@/lib/editforge/server/status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ jobId: string }> }) {
  try {
    const { jobId } = await context.params;
    const status = await readJobStatus(jobId);

    if (status.state !== "completed" || !status.output) {
      return NextResponse.json({ error: "Render output is not ready yet." }, { status: 409 });
    }

    const filePath = path.join(getJobPaths(jobId).outputDir, status.output.fileName);
    const file = await readFile(filePath);

    return new NextResponse(file, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="${status.output.fileName}"`,
        "Cache-Control": "no-store"
      }
    });
  } catch {
    return NextResponse.json({ error: "Rendered file not found." }, { status: 404 });
  }
}
