import type { ProbeResult, IncidentSeverity } from "@/types/monitor";

// ─── Alert Thresholds ─────────────────────────────────────────────────────────

const ALERT_RULES: Array<{
  serviceKey: string;
  severity: IncidentSeverity;
  condition: (r: ProbeResult) => boolean;
  title: (r: ProbeResult) => string;
}> = [
  {
    serviceKey: "aws-cloudwatch-ec2",
    severity: "P1_CRITICAL",
    condition: (r) => (r.metadata as any)?.statusCheckFailed > 0,
    title: () => "AWS EC2 StatusCheckFailed — Possible hardware failure",
  },
  {
    serviceKey: "aws-cloudwatch-ec2",
    severity: "P2_HIGH",
    condition: (r) => (r.metadata as any)?.cpuUtilization > 85,
    title: (r) => `AWS EC2 CPU critical: ${((r.metadata as any)?.cpuUtilization ?? 0).toFixed(1)}%`,
  },
  {
    serviceKey: "database-postgres",
    severity: "P1_CRITICAL",
    condition: (r) => r.status === "DOWN",
    title: () => "Supabase PostgreSQL — Database connection refused",
  },
  {
    serviceKey: "vercel-frontend",
    severity: "P1_CRITICAL",
    condition: (r) => r.status === "DOWN",
    title: () => "Vercel Edge — Frontend is DOWN",
  },
  {
    serviceKey: "latex-service",
    severity: "P1_CRITICAL",
    condition: (r) => r.status === "DOWN",
    title: () => "LaTeX Service — Compilation engine unreachable",
  },
  {
    serviceKey: "redis-cache",
    severity: "P2_HIGH",
    condition: (r) => r.status === "DOWN",
    title: () => "Upstash Redis — Cache layer unavailable",
  },
];

// Deduplication set (service key → last alerted time)
const alertedAt = new Map<string, number>();
const ALERT_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

export interface AlertPayload {
  serviceKey: string;
  severity: IncidentSeverity;
  title: string;
  message: string;
}

// ─── Evaluate Probe Results ───────────────────────────────────────────────────

export async function evaluateAndAlert(probes: ProbeResult[]): Promise<AlertPayload[]> {
  const triggered: AlertPayload[] = [];

  for (const probe of probes) {
    for (const rule of ALERT_RULES) {
      if (rule.serviceKey !== probe.serviceKey) continue;
      if (!rule.condition(probe)) continue;

      const dedupeKey = `${rule.serviceKey}:${rule.severity}`;
      const lastAlerted = alertedAt.get(dedupeKey) || 0;
      if (Date.now() - lastAlerted < ALERT_COOLDOWN_MS) continue;

      alertedAt.set(dedupeKey, Date.now());
      const payload: AlertPayload = {
        serviceKey: probe.serviceKey,
        severity: rule.severity,
        title: rule.title(probe),
        message: `Service: ${probe.serviceName}\nStatus: ${probe.status}\nLatency: ${probe.latencyMs}ms\nError: ${probe.errorMessage || "N/A"}\nTime: ${probe.checkedAt.toISOString()}`,
      };
      triggered.push(payload);

      // Dispatch to notification channels asynchronously
      dispatchAlert(payload).catch((e) =>
        console.error("[AlertManager] Dispatch failed:", e)
      );
    }
  }

  return triggered;
}

// ─── Dispatch to Channels ─────────────────────────────────────────────────────

async function dispatchAlert(alert: AlertPayload): Promise<void> {
  const isCritical =
    alert.severity === "P1_CRITICAL" || alert.severity === "P2_HIGH";

  // Always send email
  const { sendAlertEmail } = await import("./channels/email");
  await sendAlertEmail(alert).catch(console.error);

  // Send SMS only for P1/P2
  if (isCritical) {
    const { sendAlertSMS } = await import("./channels/sms");
    await sendAlertSMS(alert).catch(console.error);
  }

  console.log(`[AlertManager] Alert dispatched: [${alert.severity}] ${alert.title}`);
}
