// =============================================================================
// Resume Buddy Monitor v2 — Payment Gateway Worker
// =============================================================================

import { BaseMonitoringWorker } from "./base.worker";
import type { ServiceKey, ServiceStatus } from "@/types/monitor";

export class PaymentsWorker extends BaseMonitoringWorker {
  readonly workerName = "PaymentsWorker";
  readonly serviceKey: ServiceKey = "payments-razorpay";
  readonly serviceName = "Razorpay Payments";
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
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const start = Date.now();

    if (!keyId || !keySecret) {
      return {
        status: "MAINTENANCE",
        latencyMs: 0,
        errorMessage: "Razorpay credentials not configured",
      };
    }

    try {
      const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
      const res = await fetch("https://api.razorpay.com/v1/orders?count=1", {
        method: "GET",
        signal,
        headers: { Authorization: authHeader },
      });

      const latencyMs = Date.now() - start;

      let status: ServiceStatus = "HEALTHY";
      if (!res.ok && res.status !== 401) {
        status = "DEGRADED";
      }

      return {
        status,
        latencyMs,
        statusCode: res.status,
        data: {
          gateway: "Razorpay",
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
          err instanceof Error ? err.message : "Razorpay probe failed",
      };
    }
  }
}
