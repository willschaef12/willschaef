import { NextResponse } from "next/server";

import { cleanupExpiredJobs } from "@/lib/editforge/server/storage";
import { readJobStatus } from "@/lib/editforge/server/status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ jobId: string }> }) {
  try {
    await cleanupExpiredJobs();
    const { jobId } = await context.params;
    const status = await readJobStatus(jobId);

    return NextResponse.json(status, {
      headers: {
        "Cache-Control": "no-store"
      }
    });
  } catch {
    return NextResponse.json({ error: "Render job not found." }, { status: 404 });
  }
}
