import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      message: "AI enhancement endpoint not connected yet.",
      nextStep: "Replace this handler with your image-enhancement provider integration."
    },
    { status: 501 }
  );
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "/api/ai-enhance",
    status: "placeholder",
    message: "AI enhancement endpoint not connected yet."
  });
}
