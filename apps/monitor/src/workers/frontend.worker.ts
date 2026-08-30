// =============================================================================
// Resume Buddy Monitor v2 — Frontend & Vercel Edge Worker
// =============================================================================

import { BaseMonitoringWorker } from "./base.worker";
import type { ServiceKey, ServiceStatus } from "@/types/monitor";

export class FrontendWorker extends BaseMonitoringWorker {
  readonly workerName = "FrontendWorker";
  readonly serviceKey: ServiceKey = "vercel-frontend";
  readonly serviceName = "Vercel Edge (Next.js 16)";
  override readonly timeoutMs = 4000;

  protected async runProbe(
    signal: AbortSignal
  ): Promise<{
    status: ServiceStatus;
    latencyMs: number;
    statusCode?: number;
    errorMessage?: string;
    data?: Record<string, unknown>;
  }> {
    const targetUrl =
      process.env.NEXT_PUBLIC_FRONTEND_URL || "https://www.resume-buddy.tech";
    const start = Date.now();

    try {
      const res = await fetch(`${targetUrl}/api/health`, {
        method: "GET",
        signal,
        headers: { "User-Agent": "ResumeBuddy-Monitor-Worker/2.0" },
      });

      const latencyMs = Date.now() - start;
      const json = await res.json().catch(() => ({}));

      let status: ServiceStatus = "HEALTHY";
      if (!res.ok) {
        status = res.status >= 500 ? "DOWN" : "DEGRADED";
      } else if (latencyMs > 2500) {
        status = "DEGRADED";
      }

      return {
        status,
        latencyMs,
        statusCode: res.status,
        data: {
          url: targetUrl,
          edgeRegion: res.headers.get("x-vercel-id") || "global-edge",
          body: json,
        },
      };
    } catch (err: unknown) {
      const latencyMs = Date.now() - start;
      return {
        status: "DOWN",
        latencyMs,
        statusCode: 500,
        errorMessage:
          err instanceof Error ? err.message : "Frontend probe failed",
      };
    }
  }
}
