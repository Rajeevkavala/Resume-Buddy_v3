// =============================================================================
// Resume Buddy Monitor v2 — Worker Execution Interfaces
// =============================================================================

import type { ServiceKey, ServiceStatus, IncidentSeverity } from "./monitor";

export interface WorkerExecutionResult<T = Record<string, unknown>> {
  workerName: string;
  serviceKey: ServiceKey;
  serviceName: string;
  status: ServiceStatus;
  latencyMs: number;
  statusCode?: number;
  errorMessage?: string;
  data?: T;
  executedAt: Date;
  retryCount: number;
}

export interface IMonitoringWorker<T = Record<string, unknown>> {
  readonly workerName: string;
  readonly serviceKey: ServiceKey;
  readonly defaultIntervalMs: number;
  readonly timeoutMs: number;
  readonly maxRetries: number;
  execute(): Promise<WorkerExecutionResult<T>>;
}

export interface WorkerBatchReport {
  batchId: string;
  startedAt: Date;
  completedAt: Date;
  totalDurationMs: number;
  results: WorkerExecutionResult[];
  healthyCount: number;
  totalCount: number;
  alertsGenerated: number;
}

export interface AlertTriggerPayload {
  serviceKey: ServiceKey;
  severity: IncidentSeverity;
  title: string;
  message: string;
  metricName?: string;
  observedValue?: number;
  threshold?: number;
}
