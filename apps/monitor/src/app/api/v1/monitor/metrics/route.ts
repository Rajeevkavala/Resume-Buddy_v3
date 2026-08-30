// =============================================================================
// Resume Buddy Monitor v2 — API: GET /api/v1/monitor/metrics
// Reads historical time-series rollups from PostgreSQL
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import type { ApiResponse, TimeSeriesPointDTO } from "@/types/api";

export const dynamic = "force-dynamic";

let prismaInstance: PrismaClient | null = null;
function getPrisma(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient();
  }
  return prismaInstance;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const serviceKey = searchParams.get("service") || "global-system";
    const range = searchParams.get("range") || "24h";

    const hours = range === "7d" ? 168 : range === "30d" ? 720 : 24;
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const prisma = getPrisma();
    const rollups = await prisma.monitorMetricRollup.findMany({
      where: {
        serviceKey,
        timestamp: { gte: since },
      },
      orderBy: { timestamp: "asc" },
      take: 100,
    });

    const data: TimeSeriesPointDTO[] = rollups.map((r: any) => ({
      timestamp: r.timestamp.toISOString(),
      p50LatencyMs: r.p50LatencyMs,
      p95LatencyMs: r.p95LatencyMs,
      p99LatencyMs: r.p99LatencyMs,
      avgLatencyMs: r.avgLatencyMs,
      requestCount: r.requestCount,
      errorCount: r.errorCount,
      uptimePercent: r.uptimePercent,
      cpuUtilization: r.cpuUtilization ?? undefined,
      memoryUsagePct: r.memoryUsagePct ?? undefined,
    }));

    return NextResponse.json<ApiResponse<TimeSeriesPointDTO[]>>({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json<ApiResponse<TimeSeriesPointDTO[]>>({
      success: false,
      data: [],
      error: err instanceof Error ? err.message : "Failed to load metrics",
      timestamp: new Date().toISOString(),
    });
  }
}
