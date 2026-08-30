import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Vercel Log Drain Receiver
 * Vercel → Log Drain → This endpoint
 * Accepts structured JSON log entries from Vercel Edge runtime
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Vercel Log Drain sends an array of log entries
    const logs = Array.isArray(body) ? body : [body];

    // Broadcast to SSE clients
    const { broadcast } = await import("@/lib/sse/sse-hub");
    broadcast({
      type: "probe-result",
      data: {
        source: "vercel-log-drain",
        logs: logs.slice(0, 50), // limit payload
      },
      timestamp: new Date().toISOString(),
    });

    // Log to console for visibility
    for (const entry of logs.slice(0, 10)) {
      console.log("[Vercel LogDrain]", entry.message || JSON.stringify(entry).slice(0, 100));
    }

    return NextResponse.json({ ok: true, received: logs.length });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Parse failed" },
      { status: 400 }
    );
  }
}
