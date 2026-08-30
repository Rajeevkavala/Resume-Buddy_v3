// =============================================================================
// Resume Buddy Monitor v2 — DNS Resolution Worker
// =============================================================================

import { BaseMonitoringWorker } from "./base.worker";
import type { ServiceKey, ServiceStatus } from "@/types/monitor";
import dns from "dns/promises";

export class DNSWorker extends BaseMonitoringWorker {
  readonly workerName = "DNSWorker";
  readonly serviceKey: ServiceKey = "vercel-frontend";
  readonly serviceName = "DNS Resolution";
  override readonly timeoutMs = 3000;

  protected async runProbe(
    _signal: AbortSignal
  ): Promise<{
    status: ServiceStatus;
    latencyMs: number;
    statusCode?: number;
    errorMessage?: string;
    data?: Record<string, unknown>;
  }> {
    const domain = "resume-buddy.tech";
    const start = Date.now();

    try {
      const records = await dns.resolve4(domain);
      const latencyMs = Date.now() - start;

      let status: ServiceStatus = "HEALTHY";
      if (latencyMs > 400) {
        status = "DEGRADED";
      }

      return {
        status,
        latencyMs,
        statusCode: 200,
        data: {
          domain,
          resolvedIps: records,
          latencyMs,
        },
      };
    } catch (err: unknown) {
      const latencyMs = Date.now() - start;
      return {
        status: "DOWN",
        latencyMs,
        statusCode: 500,
        errorMessage: err instanceof Error ? err.message : "DNS resolution failed",
      };
    }
  }
}
