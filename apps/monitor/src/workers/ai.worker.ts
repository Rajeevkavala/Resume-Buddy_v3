// =============================================================================
// Resume Buddy Monitor v2 — Multi-Tier AI Providers Worker
// =============================================================================

import { BaseMonitoringWorker } from "./base.worker";
import type { ServiceKey, ServiceStatus, AIProviderStats } from "@/types/monitor";
import { setLiveMetrics } from "@/lib/redis/live-state";

export class AIProviderWorker extends BaseMonitoringWorker {
  readonly workerName = "AIProviderWorker";
  readonly serviceKey: ServiceKey = "ai-groq-primary";
  readonly serviceName = "Groq (Tier 1 AI)";
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
    const groqKey = process.env.GROQ_API_KEY;
    const start = Date.now();

    if (!groqKey) {
      return {
        status: "MAINTENANCE",
        latencyMs: 0,
        errorMessage: "GROQ_API_KEY not configured",
      };
    }

    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        signal,
        headers: {
          Authorization: `Bearer ${groqKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [{ role: "user", content: "ping" }],
          max_tokens: 3,
        }),
      });

      const latencyMs = Date.now() - start;

      let status: ServiceStatus = "HEALTHY";
      if (!res.ok) {
        status = "DEGRADED";
      } else if (latencyMs > 2500) {
        status = "DEGRADED";
      }

      const aiStats: Record<string, AIProviderStats> = {
        groq: {
          provider: "groq",
          latencyMs,
          tokensGenerated: 3,
          costPerDay: 0.0,
          status,
          fallbackActive: false,
          lastChecked: new Date(),
        },
      };

      await setLiveMetrics("ai", aiStats);

      return {
        status,
        latencyMs,
        statusCode: res.status,
        data: {
          provider: "groq",
          model: "llama-3.1-8b-instant",
          latencyMs,
        },
      };
    } catch (err: unknown) {
      const latencyMs = Date.now() - start;
      return {
        status: "DOWN",
        latencyMs,
        statusCode: 500,
        errorMessage: err instanceof Error ? err.message : "AI probe failed",
      };
    }
  }
}
