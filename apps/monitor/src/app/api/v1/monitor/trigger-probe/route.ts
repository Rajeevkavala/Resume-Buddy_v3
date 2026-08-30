import { NextRequest, NextResponse } from "next/server";
import { reprobe } from "@/lib/probes";
import type { ServiceKey } from "@/types/monitor";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { serviceKey } = body as { serviceKey: ServiceKey };

    if (!serviceKey) {
      return NextResponse.json({ error: "serviceKey is required" }, { status: 400 });
    }

    const result = await reprobe(serviceKey);
    if (!result) {
      return NextResponse.json({ error: "Unknown service key" }, { status: 404 });
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Probe failed" },
      { status: 500 }
    );
  }
}
