// =============================================================================
// Resume Buddy Monitor v2 — WebSocket Gateway Worker
// =============================================================================

import { BaseMonitoringWorker } from "./base.worker";
import type { ServiceKey, ServiceStatus } from "@/types/monitor";

export class WebSocketWorker extends BaseMonitoringWorker {
  readonly workerName = "WebSocketWorker";
  readonly serviceKey: ServiceKey = "websocket-gateway";
  readonly serviceName = "WebSocket Gateway";
  override readonly timeoutMs = 3500;

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
      process.env.WEBSOCKET_GATEWAY_URL || "https://api.resume-buddy.tech";
    const start = Date.now();

    try {
      // Socket.io polling handshake
      let res = await fetch(`${baseUrl}/socket.io/?EIO=4&transport=polling`, {
        method: "GET",
        signal,
        headers: { "User-Agent": "ResumeBuddy-Monitor-Worker/2.0" },
      }).catch(() => null);

      let text = res ? await res.text().catch(() => "") : "";
      let handshakeOk = text.includes("sid");

      if (!res || res.status === 404) {
        // Fallback check on gateway host
        res = await fetch(`${baseUrl}/`, {
          method: "GET",
          signal,
          headers: { "User-Agent": "ResumeBuddy-Monitor-Worker/2.0" },
        }).catch(() => null);
        handshakeOk = res?.ok ?? false;
      }

      const latencyMs = Date.now() - start;

      let status: ServiceStatus = "HEALTHY";
      if (!res || (!res.ok && res.status >= 500)) {
        status = "DOWN";
      } else if (!handshakeOk) {
        status = "DEGRADED";
      }

      return {
        status,
        latencyMs,
        statusCode: res ? res.status : 503,
        data: {
          handshakeOk,
          url: baseUrl,
        },
      };
    } catch (err: unknown) {
      const latencyMs = Date.now() - start;
      return {
        status: "DOWN",
        latencyMs,
        statusCode: 500,
        errorMessage:
          err instanceof Error ? err.message : "WebSocket probe failed",
      };
    }
  }
}
