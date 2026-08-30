// =============================================================================
// Resume Buddy Monitor v2 — API: POST /api/v1/monitor/trigger-worker
// Triggers an ad-hoc worker batch execution
// =============================================================================

import { NextResponse } from "next/server";
import { runMonitoringWorkerBatch } from "@/workers/runner";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const report = await runMonitoringWorkerBatch();
    return NextResponse.json({
      success: true,
      data: report,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Worker batch failed",
      },
      { status: 500 }
    );
  }
}
