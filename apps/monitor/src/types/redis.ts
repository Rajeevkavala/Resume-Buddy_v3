// =============================================================================
// Resume Buddy Monitor v2 — Redis State Contracts
// =============================================================================

import type { ServiceKey, ServiceStatus, EC2Metrics, AIProviderStats, VercelDeployment } from "./monitor";
import type { AlertEventDTO, IncidentDTO } from "./api";

export interface RedisLiveServiceHealth {
  serviceKey: ServiceKey;
  serviceName: string;
  status: ServiceStatus;
  latencyMs: number;
  statusCode?: number;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
  checkedAt: string;
}

export interface RedisLiveSummary {
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
  services: RedisLiveServiceHealth[];
  ec2?: EC2Metrics;
  latestDeployment?: VercelDeployment;
  aiStats?: Record<string, AIProviderStats>;
}

export interface RedisLiveSlo {
  slo: number;
  target: number;
  budgetRemaining: number;
  burnRate: number;
  computedAt: string;
}

export interface RedisLiveCosts {
  dailyAiUsd: number;
  monthlyInfraUsd: number;
  currency: string;
  computedAt: string;
}
