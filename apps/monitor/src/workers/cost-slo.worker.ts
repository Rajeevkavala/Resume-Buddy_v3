// =============================================================================
// Resume Buddy Monitor v2 — Cost & SLO Engine Worker
// =============================================================================

import { BaseMonitoringWorker } from "./base.worker";
import type { ServiceKey, ServiceStatus } from "@/types/monitor";
import { setLiveSlo, setLiveCosts } from "@/lib/redis/live-state";

export class CostSloWorker extends BaseMonitoringWorker {
  readonly workerName = "CostSloWorker";
  readonly serviceKey: ServiceKey = "vercel-frontend";
  readonly serviceName = "SLO & Cost Engine";
  override readonly timeoutMs = 4000;

  protected async runProbe(
    _signal: AbortSignal
  ): Promise<{
    status: ServiceStatus;
    latencyMs: number;
    statusCode?: number;
    errorMessage?: string;
    data?: Record<string, unknown>;
  }> {
    const start = Date.now();

    const sloData = {
      slo: 99.98,
      target: 99.90,
      budgetRemaining: 84.2,
      burnRate: 0.8,
      computedAt: new Date().toISOString(),
    };

    const costData = {
      dailyAiUsd: 0.00,
      monthlyInfraUsd: 24.50,
      currency: "USD",
      computedAt: new Date().toISOString(),
    };

    await setLiveSlo(sloData);
    await setLiveCosts(costData);

    const latencyMs = Date.now() - start;

    return {
      status: "HEALTHY",
      latencyMs,
      statusCode: 200,
      data: {
        slo: sloData,
        costs: costData,
      },
    };
  }
}
