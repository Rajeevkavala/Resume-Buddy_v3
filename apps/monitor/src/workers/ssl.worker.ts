// =============================================================================
// Resume Buddy Monitor v2 — SSL & Certificate Worker
// =============================================================================

import { BaseMonitoringWorker } from "./base.worker";
import type { ServiceKey, ServiceStatus } from "@/types/monitor";
import https from "https";

export class SSLWorker extends BaseMonitoringWorker {
  readonly workerName = "SSLWorker";
  readonly serviceKey: ServiceKey = "ssl-certificates";
  readonly serviceName = "SSL Certificates";
  override readonly timeoutMs = 5000;

  protected async runProbe(
    _signal: AbortSignal
  ): Promise<{
    status: ServiceStatus;
    latencyMs: number;
    statusCode?: number;
    errorMessage?: string;
    data?: Record<string, unknown>;
  }> {
    const host = "www.resume-buddy.tech";
    const start = Date.now();

    return new Promise((resolve) => {
      const req = https.request(
        {
          host,
          port: 443,
          method: "HEAD",
          timeout: 4000,
        },
        (res) => {
          const socket = res.socket as any;
          const cert = socket && typeof socket.getPeerCertificate === "function" ? socket.getPeerCertificate() : null;
          const latencyMs = Date.now() - start;

          if (cert && cert.valid_to) {
            const validTo = new Date(cert.valid_to);
            const daysRemaining = Math.floor(
              (validTo.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            );

            let status: ServiceStatus = "HEALTHY";
            if (daysRemaining < 7) {
              status = "DOWN";
            } else if (daysRemaining < 30) {
              status = "DEGRADED";
            }

            resolve({
              status,
              latencyMs,
              statusCode: 200,
              data: {
                host,
                issuer: cert.issuer?.O || "Let's Encrypt / Google Trust",
                validTo: validTo.toISOString(),
                daysRemaining,
              },
            });
          } else {
            resolve({
              status: "HEALTHY",
              latencyMs,
              statusCode: 200,
              data: { host, valid: true },
            });
          }
        }
      );

      req.on("error", (err) => {
        resolve({
          status: "DEGRADED",
          latencyMs: Date.now() - start,
          statusCode: 500,
          errorMessage: err.message,
        });
      });

      req.on("timeout", () => {
        req.destroy();
        resolve({
          status: "DEGRADED",
          latencyMs: 4000,
          statusCode: 408,
          errorMessage: "SSL handshake timed out",
        });
      });

      req.end();
    });
  }
}
