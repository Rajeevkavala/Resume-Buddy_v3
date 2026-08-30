// =============================================================================
// Resume Buddy Monitor v2 — API Contracts & DTOs
// =============================================================================

import type {
  ServiceKey,
  ServiceStatus,
  IncidentSeverity,
  IncidentStatus,
  ProbeResult,
  EC2Metrics,
  VercelDeployment,
  AIProviderStats,
} from "./monitor";

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  timestamp: string;
  cachedAt?: string;
}

export interface ServiceHealthDTO {
  serviceKey: ServiceKey;
  serviceName: string;
  status: ServiceStatus;
  latencyMs: number;
  statusCode?: number;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
  checkedAt: string;
}

export interface MonitorSummaryDTO {
  overallStatus: ServiceStatus;
  uptime30d: number;
  sloTarget: number;
  errorBudgetRemaining: number;
  activeIncidentsCount: number;
  activeAlertsCount: number;
  p95GlobalLatencyMs: number;
  healthyServicesCount: number;
  totalServicesCount: number;
  aiDailyCostUsd: number;
  infraMonthlyCostUsd: number;
  activeWebsockets: number;
  lastWorkerRun: string;
  services: ServiceHealthDTO[];
  ec2?: EC2Metrics;
  latestDeployment?: VercelDeployment;
  aiStats?: Record<string, AIProviderStats>;
}

export interface IncidentDTO {
  id: string;
  incidentNumber: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  title: string;
  impactedService: string;
  triggerReason: string;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  mitigatedAt?: string;
  resolvedAt?: string;
  downtimeSeconds?: number;
  postMortem?: string;
  createdAt: string;
  updatedAt: string;
  events?: IncidentEventDTO[];
}

export interface IncidentEventDTO {
  id: string;
  incidentId: string;
  message: string;
  actor: string;
  eventType: string;
  createdAt: string;
}

export interface AlertEventDTO {
  id: string;
  serviceKey: ServiceKey;
  severity: IncidentSeverity;
  title: string;
  message: string;
  triggeredAt: string;
  resolvedAt?: string;
  notified: boolean;
}

export interface TimeSeriesPointDTO {
  timestamp: string;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  avgLatencyMs: number;
  requestCount: number;
  errorCount: number;
  uptimePercent: number;
  cpuUtilization?: number;
  memoryUsagePct?: number;
}

export interface SSEBroadcastEvent {
  type:
    | "summary-update"
    | "health-update"
    | "alert"
    | "incident"
    | "cloudwatch-alarm"
    | "deployment"
    | "heartbeat";
  data: unknown;
  timestamp: string;
}
