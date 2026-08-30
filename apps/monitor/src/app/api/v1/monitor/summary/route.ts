// =============================================================================
// Resume Buddy Monitor v2 — API: GET /api/v1/monitor/summary
// Reads strictly from Redis Live State
// =============================================================================

import { NextResponse } from "next/server";
import { getLiveSummary } from "@/lib/redis/live-state";
import { runMonitoringWorkerBatch } from "@/workers/runner";
import type { ApiResponse, MonitorSummaryDTO } from "@/types/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    let liveSummary = await getLiveSummary();

    // If cache is empty on cold start, trigger a worker batch asynchronously
    if (!liveSummary) {
      const report = await runMonitoringWorkerBatch();
      liveSummary = await getLiveSummary();
    }

    if (!liveSummary) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          data: null,
          error: "Monitoring state unavailable",
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }

    const summaryDto: MonitorSummaryDTO = {
      overallStatus: liveSummary.overallStatus,
      uptime30d: liveSummary.uptime30d,
      sloTarget: liveSummary.sloTarget,
      errorBudgetRemaining: liveSummary.errorBudgetRemaining,
      activeIncidentsCount: liveSummary.activeIncidentsCount,
      activeAlertsCount: liveSummary.activeAlertsCount,
      p95GlobalLatencyMs: liveSummary.p95GlobalLatencyMs,
      healthyServicesCount: liveSummary.healthyServicesCount,
      totalServicesCount: liveSummary.totalServicesCount,
      aiDailyCostUsd: liveSummary.aiDailyCostUsd,
      infraMonthlyCostUsd: liveSummary.infraMonthlyCostUsd,
      activeWebsockets: liveSummary.activeWebsockets,
      lastWorkerRun: liveSummary.lastWorkerRun,
      services: liveSummary.services,
      ec2: liveSummary.ec2,
      latestDeployment: liveSummary.latestDeployment,
      aiStats: liveSummary.aiStats,
    };

    return NextResponse.json<ApiResponse<MonitorSummaryDTO>>({
      success: true,
      data: summaryDto,
      timestamp: new Date().toISOString(),
      cachedAt: liveSummary.lastWorkerRun,
    });
  } catch (err) {
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        data: null,
        error: err instanceof Error ? err.message : "Internal error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
