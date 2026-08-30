// =============================================================================
// Resume Buddy Monitor v2 — API: GET /api/v1/monitor/alerts
// Active alerts read from Redis with fallback to PostgreSQL
// =============================================================================

import { NextResponse } from "next/server";
import { getLiveAlerts } from "@/lib/redis/live-state";
import type { ApiResponse, AlertEventDTO } from "@/types/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const alerts = await getLiveAlerts();

    return NextResponse.json<ApiResponse<AlertEventDTO[]>>({
      success: true,
      data: alerts,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json<ApiResponse<AlertEventDTO[]>>({
      success: false,
      data: [],
      error: err instanceof Error ? err.message : "Failed to load alerts",
      timestamp: new Date().toISOString(),
    });
  }
}
