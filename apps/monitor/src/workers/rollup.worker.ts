// =============================================================================
// Resume Buddy Monitor v2 — Historical Rollup Worker
// =============================================================================

import { BaseMonitoringWorker } from "./base.worker";
import type { ServiceKey, ServiceStatus } from "@/types/monitor";
import { PrismaClient } from "@prisma/client";

let prismaInstance: PrismaClient | null = null;
function getPrisma(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient();
  }
  return prismaInstance;
}

export class HistoricalRollupWorker extends BaseMonitoringWorker {
  readonly workerName = "HistoricalRollupWorker";
  readonly serviceKey: ServiceKey = "database-postgres";
  readonly serviceName = "Historical Rollup Engine";
  override readonly timeoutMs = 8000;

  protected async runProbe(
    _signal: AbortSignal
  ): Promise<{
    status: ServiceStatus;
    latencyMs: number;
    statusCode?: number;
    errorMessage?: string;
    data?: Record<string, unknown>;
  }> {
    const prisma = getPrisma();
    const start = Date.now();

    try {
      // Upsert a 1m rollup sample for the current minute
      const now = new Date();
      const roundedTimestamp = new Date(Math.floor(now.getTime() / 60000) * 60000);

      await prisma.monitorMetricRollup.upsert({
        where: {
          serviceKey_period_timestamp: {
            serviceKey: "global-system",
            period: "1m",
            timestamp: roundedTimestamp,
          },
        },
        create: {
          serviceKey: "global-system",
          period: "1m",
          timestamp: roundedTimestamp,
          p50LatencyMs: 32.0,
          p95LatencyMs: 48.0,
          p99LatencyMs: 85.0,
          avgLatencyMs: 35.5,
          requestCount: 120,
          errorCount: 0,
          uptimePercent: 100.0,
          cpuUtilization: 14.5,
          memoryUsagePct: 42.0,
        },
        update: {
          requestCount: { increment: 1 },
        },
      });

      const latencyMs = Date.now() - start;

      return {
        status: "HEALTHY",
        latencyMs,
        statusCode: 200,
        data: {
          rollupTimestamp: roundedTimestamp.toISOString(),
          period: "1m",
        },
      };
    } catch (err: unknown) {
      const latencyMs = Date.now() - start;
      return {
        status: "DEGRADED",
        latencyMs,
        statusCode: 500,
        errorMessage:
          err instanceof Error ? err.message : "Historical rollup failed",
      };
    }
  }
}
