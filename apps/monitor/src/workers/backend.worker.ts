// =============================================================================
// Resume Buddy Monitor v2 — Backend & LaTeX Service Worker
// =============================================================================

import { BaseMonitoringWorker } from "./base.worker";
import type { ServiceKey, ServiceStatus } from "@/types/monitor";

export class BackendWorker extends BaseMonitoringWorker {
  readonly workerName = "BackendWorker";
  readonly serviceKey: ServiceKey = "latex-service";
  readonly serviceName = "LaTeX Engine (Fastify)";
  override readonly timeoutMs = 3000;

  protected async runProbe(
    signal: AbortSignal
  ): Promise<{
    status: ServiceStatus;
    latencyMs: number;
    statusCode?: number;
    errorMessage?: string;
    data?: Record<string, unknown>;
  }> {
    const baseUrl =
      process.env.LATEX_SERVICE_URL || "https://api.resume-buddy.tech";
    const start = Date.now();

    try {
      let res = await fetch(`${baseUrl}/healthz`, {
        method: "GET",
        signal,
        headers: { "User-Agent": "ResumeBuddy-Monitor-Worker/2.0" },
      }).catch(() => null);

      if (!res || res.status === 404) {
        res = await fetch(`${baseUrl}/`, {
          method: "GET",
          signal,
          headers: { "User-Agent": "ResumeBuddy-Monitor-Worker/2.0" },
        }).catch(() => null);
      }

      const latencyMs = Date.now() - start;

      let status: ServiceStatus = "HEALTHY";
      if (!res || !res.ok) {
        status = res && res.status >= 500 ? "DOWN" : "DEGRADED";
      } else if (latencyMs > 1500) {
        status = "DEGRADED";
      }

      return {
        status,
        latencyMs,
        statusCode: res ? res.status : 503,
        data: {
          url: baseUrl,
          healthy: status === "HEALTHY",
        },
      };
    } catch (err: unknown) {
      const latencyMs = Date.now() - start;
      return {
        status: "DOWN",
        latencyMs,
        statusCode: 500,
        errorMessage:
          err instanceof Error ? err.message : "LaTeX backend probe failed",
      };
    }
  }
}
