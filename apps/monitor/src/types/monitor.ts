// =============================================================================
// Resume Buddy Monitoring Platform — TypeScript Domain Contracts
// =============================================================================

// ─── Enums ───────────────────────────────────────────────────────────────────

export type ServiceStatus = "HEALTHY" | "DEGRADED" | "DOWN" | "MAINTENANCE";

export type IncidentSeverity =
  | "P1_CRITICAL"
  | "P2_HIGH"
  | "P3_MEDIUM"
  | "P4_LOW";

export type IncidentStatus =
  | "OPEN"
  | "ACKNOWLEDGED"
  | "INVESTIGATING"
  | "MITIGATED"
  | "RESOLVED";

export type ProbeState = "IDLE" | "RUNNING" | "SUCCESS" | "FAILURE";

// ─── Core Probe Results ───────────────────────────────────────────────────────

export interface ProbeResult {
  serviceKey: ServiceKey;
  serviceName: string;
  status: ServiceStatus;
  latencyMs: number;
  statusCode?: number;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
  checkedAt: Date;
}

// ─── Service Keys ─────────────────────────────────────────────────────────────

export type ServiceKey =
  | "vercel-frontend"
  | "aws-cloudwatch-ec2"
  | "latex-service"
  | "websocket-gateway"
  | "database-postgres"
  | "redis-cache"
  | "aws-s3-storage"
  | "ai-groq-primary"
  | "ai-openrouter-secondary"
  | "ai-gemini-fallback"
  | "payments-razorpay"
  | "email-resend"
  | "ssl-certificates"
  | "sarvam-ai";

export const SERVICE_LABELS: Record<ServiceKey, string> = {
  "vercel-frontend": "Vercel Edge (Next.js 16)",
  "aws-cloudwatch-ec2": "AWS EC2 (CloudWatch)",
  "latex-service": "LaTeX Engine (Fastify)",
  "websocket-gateway": "WebSocket Gateway",
  "database-postgres": "Supabase PostgreSQL",
  "redis-cache": "Upstash Redis",
  "aws-s3-storage": "AWS S3 Bucket",
  "ai-groq-primary": "Groq (Tier 1 AI)",
  "ai-openrouter-secondary": "OpenRouter (Tier 2 AI)",
  "ai-gemini-fallback": "Gemini 2.5 (Tier 3)",
  "payments-razorpay": "Razorpay Payments",
  "email-resend": "Resend Email",
  "ssl-certificates": "SSL Certificates",
  "sarvam-ai": "Sarvam AI (Audio)",
};

// ─── CloudWatch Metrics ───────────────────────────────────────────────────────

export interface EC2Metrics {
  cpuUtilization: number; // percentage
  memUsedPercent: number; // percentage (CWAgent)
  diskUsedPercent: number; // percentage (CWAgent)
  swapUsedPercent: number; // percentage (CWAgent)
  statusCheckFailed: number; // 0 = OK, 1 = FAILED
  networkIn: number; // bytes
  networkOut: number; // bytes
  timestamp: Date;
}

export interface S3Metrics {
  bucketSizeBytes: number;
  numberOfObjects: number;
  fivexxErrors: number;
  headBucketLatencyMs: number;
  timestamp: Date;
}

export interface CloudWatchAlarmState {
  alarmName: string;
  alarmArn: string;
  stateValue: "OK" | "ALARM" | "INSUFFICIENT_DATA";
  stateReason: string;
  stateUpdatedTimestamp: Date;
  metricName: string;
}

// ─── Vercel Types ─────────────────────────────────────────────────────────────

export interface VercelDeployment {
  uid: string;
  url: string;
  name: string;
  state: "READY" | "BUILDING" | "ERROR" | "CANCELED" | "QUEUED";
  readySubstate?: string;
  buildDurationMs?: number;
  creator?: {
    email: string;
    username: string;
  };
  meta?: {
    githubCommitSha?: string;
    githubCommitMessage?: string;
  };
  createdAt: number;
  readyAt?: number;
}

export interface VercelSpeedInsights {
  lcp: number; // Largest Contentful Paint (s)
  fid: number; // First Input Delay (ms)
  cls: number; // Cumulative Layout Shift (unitless)
  inp: number; // Interaction to Next Paint (ms)
  fcp: number; // First Contentful Paint (s)
  ttfb: number; // Time to First Byte (ms)
  score: "good" | "needs-improvement" | "poor";
}

export interface VercelEdgeStats {
  requestCount24h: number;
  errorRate: number; // percentage
  bandwidthGB: number;
  cacheHitPercent: number;
  edgeNodeCount: number;
}

// ─── Database Types ───────────────────────────────────────────────────────────

export interface DatabasePoolStats {
  activeConnections: number;
  idleConnections: number;
  totalConnections: number;
  maxConnections: number;
  saturationPercent: number;
  queryLatencyMs: number;
}

export interface SlowQuery {
  query: string;
  meanExecTimeMs: number;
  calls: number;
}

// ─── Redis Types ──────────────────────────────────────────────────────────────

export interface RedisStats {
  memoryUsedBytes: number;
  memoryUsedMB: number;
  commandsPerSecond: number;
  keyspaceHits: number;
  keyspaceMisses: number;
  hitRatioPercent: number;
  connectedClients: number;
  totalKeys: number;
  pingLatencyMs: number;
}

// ─── AI Provider Types ────────────────────────────────────────────────────────

export interface AIProviderStats {
  provider: "groq" | "openrouter" | "gemini" | "sarvam";
  latencyMs: number;
  tokensGenerated: number;
  costPerDay: number;
  status: ServiceStatus;
  fallbackActive: boolean;
  lastChecked: Date;
}

// ─── Synthetic Run Types ──────────────────────────────────────────────────────

export interface SyntheticStep {
  stepName: string;
  durationMs: number;
  success: boolean;
  errorMessage?: string;
}

export interface SyntheticRunResult {
  workflowKey: string;
  workflowName: string;
  success: boolean;
  durationMs: number;
  failedStepIndex?: number;
  failureReason?: string;
  stepTimings: SyntheticStep[];
  executedAt: Date;
}

export type SyntheticWorkflowKey =
  | "homepage-load"
  | "auth-login"
  | "ai-inference"
  | "latex-compile"
  | "s3-upload"
  | "database-read"
  | "redis-roundtrip"
  | "websocket-connect"
  | "payment-probe"
  | "email-probe"
  | "ssl-cert"
  | "groq-fallback";

export const SYNTHETIC_WORKFLOW_LABELS: Record<SyntheticWorkflowKey, string> =
  {
    "homepage-load": "Homepage Load & Metadata",
    "auth-login": "Synthetic User Auth & JWT",
    "ai-inference": "AI Resume Bullet Improvement",
    "latex-compile": "LaTeX Compilation → PDF",
    "s3-upload": "S3 Presigned Upload + SHA-256",
    "database-read": "Database Read Verification",
    "redis-roundtrip": "Redis SET/GET/DEL Round-trip",
    "websocket-connect": "WebSocket Handshake & Room",
    "payment-probe": "Razorpay API Credentials Ping",
    "email-probe": "Resend Domain Verification",
    "ssl-cert": "TLS Certificate Validity",
    "groq-fallback": "Groq → OpenRouter → Gemini Fallback",
  };

// ─── Alert Types ──────────────────────────────────────────────────────────────

export interface AlertRule {
  serviceKey: ServiceKey;
  severity: IncidentSeverity;
  condition: string;
  threshold: number;
  consecutiveFailures: number;
  notifyChannels: Array<"email" | "sms" | "whatsapp" | "slack">;
}

export interface AlertEvent {
  id: string;
  serviceKey: ServiceKey;
  severity: IncidentSeverity;
  title: string;
  message: string;
  triggeredAt: Date;
  resolvedAt?: Date;
  notified: boolean;
}

// ─── SSE Event Types ──────────────────────────────────────────────────────────

export interface SSEEvent {
  type:
    | "probe-result"
    | "alert"
    | "deployment"
    | "incident"
    | "cloudwatch-alarm"
    | "heartbeat";
  data: unknown;
  timestamp: string;
}

// ─── Dashboard Summary ────────────────────────────────────────────────────────

export interface SystemHealthSummary {
  overallStatus: ServiceStatus;
  uptimePercent30d: number;
  activeIncidents: number;
  servicesHealthy: number;
  servicesTotal: number;
  lastUpdated: Date;
  services: ProbeResult[];
  ec2Metrics?: EC2Metrics;
  vercelDeployment?: VercelDeployment;
}

// ─── Probe Configuration ──────────────────────────────────────────────────────

export interface ProbeConfig {
  serviceKey: ServiceKey;
  intervalMs: number;
  timeoutMs: number;
  retryCount: number;
  degradedThreshold: number;
  criticalThreshold: number;
}

export const DEFAULT_PROBE_CONFIGS: ProbeConfig[] = [
  {
    serviceKey: "vercel-frontend",
    intervalMs: 15000,
    timeoutMs: 3000,
    retryCount: 2,
    degradedThreshold: 1200,
    criticalThreshold: 3000,
  },
  {
    serviceKey: "aws-cloudwatch-ec2",
    intervalMs: 30000,
    timeoutMs: 5000,
    retryCount: 2,
    degradedThreshold: 5000,
    criticalThreshold: 10000,
  },
  {
    serviceKey: "latex-service",
    intervalMs: 10000,
    timeoutMs: 2500,
    retryCount: 2,
    degradedThreshold: 800,
    criticalThreshold: 2500,
  },
  {
    serviceKey: "websocket-gateway",
    intervalMs: 15000,
    timeoutMs: 3000,
    retryCount: 2,
    degradedThreshold: 600,
    criticalThreshold: 3000,
  },
  {
    serviceKey: "database-postgres",
    intervalMs: 30000,
    timeoutMs: 4000,
    retryCount: 2,
    degradedThreshold: 450,
    criticalThreshold: 4000,
  },
  {
    serviceKey: "redis-cache",
    intervalMs: 15000,
    timeoutMs: 2000,
    retryCount: 2,
    degradedThreshold: 400,
    criticalThreshold: 2000,
  },
  {
    serviceKey: "aws-s3-storage",
    intervalMs: 60000,
    timeoutMs: 5000,
    retryCount: 2,
    degradedThreshold: 1500,
    criticalThreshold: 5000,
  },
  {
    serviceKey: "ai-groq-primary",
    intervalMs: 45000,
    timeoutMs: 4000,
    retryCount: 1,
    degradedThreshold: 2500,
    criticalThreshold: 4000,
  },
  {
    serviceKey: "ai-openrouter-secondary",
    intervalMs: 60000,
    timeoutMs: 5000,
    retryCount: 1,
    degradedThreshold: 3500,
    criticalThreshold: 5000,
  },
  {
    serviceKey: "ai-gemini-fallback",
    intervalMs: 60000,
    timeoutMs: 4000,
    retryCount: 1,
    degradedThreshold: 2000,
    criticalThreshold: 4000,
  },
  {
    serviceKey: "payments-razorpay",
    intervalMs: 300000,
    timeoutMs: 5000,
    retryCount: 2,
    degradedThreshold: 2000,
    criticalThreshold: 5000,
  },
  {
    serviceKey: "email-resend",
    intervalMs: 300000,
    timeoutMs: 5000,
    retryCount: 2,
    degradedThreshold: 1500,
    criticalThreshold: 5000,
  },
];
