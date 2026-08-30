// =============================================================================
// Resume Buddy Monitor v2 — Synthetic User Journey Worker
// =============================================================================

import { BaseMonitoringWorker } from "./base.worker";
import type { ServiceKey, ServiceStatus, SyntheticRunResult } from "@/types/monitor";
import { setLiveMetrics } from "@/lib/redis/live-state";

export class SyntheticsWorker extends BaseMonitoringWorker {
  readonly workerName = "SyntheticsWorker";
  readonly serviceKey: ServiceKey = "vercel-frontend";
  readonly serviceName = "Synthetic User Flows";
  override readonly timeoutMs = 10000;

  protected async runProbe(
    signal: AbortSignal
  ): Promise<{
    status: ServiceStatus;
    latencyMs: number;
    statusCode?: number;
    errorMessage?: string;
    data?: Record<string, unknown>;
  }> {
    const start = Date.now();
    const appUrl =
      process.env.NEXT_PUBLIC_FRONTEND_URL || "https://www.resume-buddy.tech";

    const steps = [
      { name: "Step 1: Homepage HTML Get", fn: () => fetch(`${appUrl}/`, { signal }) },
      { name: "Step 2: Health Probe", fn: () => fetch(`${appUrl}/api/health`, { signal }) },
    ];

    const stepTimings: { stepName: string; durationMs: number; success: boolean }[] = [];
    let allOk = true;

    for (const step of steps) {
      const stepStart = Date.now();
      try {
        const res = await step.fn();
        const durationMs = Date.now() - stepStart;
        stepTimings.push({
          stepName: step.name,
          durationMs,
          success: res.ok,
        });
        if (!res.ok) allOk = false;
      } catch {
        stepTimings.push({
          stepName: step.name,
          durationMs: Date.now() - stepStart,
          success: false,
        });
        allOk = false;
      }
    }

    const totalDuration = Date.now() - start;

    const synthResult: SyntheticRunResult = {
      workflowKey: "homepage-flow",
      workflowName: "Homepage & Health Synthetic Journey",
      success: allOk,
      durationMs: totalDuration,
      stepTimings,
      executedAt: new Date(),
    };

    await setLiveMetrics("synthetics:homepage-flow", synthResult);

    return {
      status: allOk ? "HEALTHY" : "DEGRADED",
      latencyMs: totalDuration,
      statusCode: allOk ? 200 : 500,
      data: {
        steps: stepTimings,
        success: allOk,
      },
    };
  }
}
