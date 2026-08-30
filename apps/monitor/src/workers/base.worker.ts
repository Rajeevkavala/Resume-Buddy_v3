// =============================================================================
// Resume Buddy Monitor v2 — Base Worker Abstract Class
// =============================================================================

import type { ServiceKey, ServiceStatus } from "@/types/monitor";
import type { IMonitoringWorker, WorkerExecutionResult } from "@/types/workers";
import { setLiveServiceHealth } from "@/lib/redis/live-state";
import { publishMonitorEvent } from "@/lib/redis/pubsub";

export abstract class BaseMonitoringWorker<T = Record<string, unknown>>
  implements IMonitoringWorker<T>
{
  abstract readonly workerName: string;
  abstract readonly serviceKey: ServiceKey;
  abstract readonly serviceName: string;
  readonly defaultIntervalMs: number = 30000;
  readonly timeoutMs: number = 4000;
  readonly maxRetries: number = 2;

  protected abstract runProbe(
    signal: AbortSignal
  ): Promise<{
    status: ServiceStatus;
    latencyMs: number;
    statusCode?: number;
    errorMessage?: string;
    data?: T;
  }>;

  async execute(): Promise<WorkerExecutionResult<T>> {
    const startTime = Date.now();
    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt <= this.maxRetries) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const probeResult = await this.runProbe(controller.signal);
        clearTimeout(timeoutId);

        const result: WorkerExecutionResult<T> = {
          workerName: this.workerName,
          serviceKey: this.serviceKey,
          serviceName: this.serviceName,
          status: probeResult.status,
          latencyMs: probeResult.latencyMs,
          statusCode: probeResult.statusCode,
          errorMessage: probeResult.errorMessage,
          data: probeResult.data,
          executedAt: new Date(),
          retryCount: attempt,
        };

        // Asynchronously update Redis Live state
        await setLiveServiceHealth({
          serviceKey: this.serviceKey,
          serviceName: this.serviceName,
          status: result.status,
          latencyMs: result.latencyMs,
          statusCode: result.statusCode,
          errorMessage: result.errorMessage,
          metadata: result.data as Record<string, unknown>,
          checkedAt: result.executedAt.toISOString(),
        }).catch(() => {});

        // Broadcast health update over Pub/Sub
        await publishMonitorEvent({
          type: "health-update",
          data: result,
          timestamp: new Date().toISOString(),
        }).catch(() => {});

        return result;
      } catch (err: unknown) {
        clearTimeout(timeoutId);
        lastError = err instanceof Error ? err : new Error(String(err));
        attempt++;
        if (attempt <= this.maxRetries) {
          // Exponential backoff with jitter
          await new Promise((r) => setTimeout(r, 200 * Math.pow(2, attempt)));
        }
      }
    }

    const elapsed = Date.now() - startTime;
    const failedResult: WorkerExecutionResult<T> = {
      workerName: this.workerName,
      serviceKey: this.serviceKey,
      serviceName: this.serviceName,
      status: "DOWN",
      latencyMs: elapsed,
      statusCode: 500,
      errorMessage: lastError?.message || "Worker execution timed out",
      executedAt: new Date(),
      retryCount: this.maxRetries,
    };

    await setLiveServiceHealth({
      serviceKey: this.serviceKey,
      serviceName: this.serviceName,
      status: "DOWN",
      latencyMs: elapsed,
      statusCode: 500,
      errorMessage: failedResult.errorMessage,
      checkedAt: failedResult.executedAt.toISOString(),
    }).catch(() => {});

    return failedResult;
  }
}
