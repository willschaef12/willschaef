import { NextResponse } from "next/server";

import { analyzeProduct } from "@/lib/realprice/analysis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as { query?: string } | null;
    const query = body?.query?.trim() ?? "";

    if (!query) {
      return NextResponse.json({ error: "Paste a product name or product URL to analyze." }, { status: 400 });
    }

    await new Promise((resolve) => setTimeout(resolve, 700));

    return NextResponse.json({
      analysis: analyzeProduct(query)
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to analyze this product right now."
      },
      { status: 500 }
    );
  }
}
