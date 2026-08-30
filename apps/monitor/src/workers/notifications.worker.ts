// =============================================================================
// Resume Buddy Monitor v2 — Notification & Email Worker
// =============================================================================

import { BaseMonitoringWorker } from "./base.worker";
import type { ServiceKey, ServiceStatus } from "@/types/monitor";

export class NotificationsWorker extends BaseMonitoringWorker {
  readonly workerName = "NotificationsWorker";
  readonly serviceKey: ServiceKey = "email-resend";
  readonly serviceName = "Resend Email";
  override readonly timeoutMs = 5000;

  protected async runProbe(
    signal: AbortSignal
  ): Promise<{
    status: ServiceStatus;
    latencyMs: number;
    statusCode?: number;
    errorMessage?: string;
    data?: Record<string, unknown>;
  }> {
    const resendKey = process.env.RESEND_API_KEY;
    const start = Date.now();

    if (!resendKey) {
      return {
        status: "MAINTENANCE",
        latencyMs: 0,
        errorMessage: "RESEND_API_KEY not configured",
      };
    }

    try {
      const res = await fetch("https://api.resend.com/domains", {
        method: "GET",
        signal,
        headers: { Authorization: `Bearer ${resendKey}` },
      });

      const latencyMs = Date.now() - start;

      let status: ServiceStatus = "HEALTHY";
      if (!res.ok) {
        status = "DEGRADED";
      }

      return {
        status,
        latencyMs,
        statusCode: res.status,
        data: {
          provider: "Resend",
          latencyMs,
        },
      };
    } catch (err: unknown) {
      const latencyMs = Date.now() - start;
      return {
        status: "DOWN",
        latencyMs,
        statusCode: 500,
        errorMessage:
          err instanceof Error ? err.message : "Resend probe failed",
      };
    }
  }
}
