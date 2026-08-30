import { InfrastructureWorker } from "../src/workers/infra.worker";
import { FrontendWorker } from "../src/workers/frontend.worker";
import { BackendWorker } from "../src/workers/backend.worker";
import { WebSocketWorker } from "../src/workers/websocket.worker";
import { DatabaseWorker } from "../src/workers/database.worker";
import { RedisWorker } from "../src/workers/redis.worker";
import { StorageWorker } from "../src/workers/storage.worker";
import { AIProviderWorker } from "../src/workers/ai.worker";
import { PaymentsWorker } from "../src/workers/payments.worker";
import { NotificationsWorker } from "../src/workers/notifications.worker";
import { SyntheticsWorker } from "../src/workers/synthetics.worker";
import { DeploymentWorker } from "../src/workers/deployments.worker";
import { SSLWorker } from "../src/workers/ssl.worker";
import { DNSWorker } from "../src/workers/dns.worker";
import { CostSloWorker } from "../src/workers/cost-slo.worker";
import { HistoricalRollupWorker } from "../src/workers/rollup.worker";
import { runMonitoringWorkerBatch } from "../src/workers/runner";
import { getRedisClient } from "../src/lib/redis/client";
import { prisma } from "@/lib/prisma";
import type { ServiceKey } from "@/types/monitor";

interface AuditResult {
  category: string;
  name: string;
  status: "PASS" | "WARNING" | "FAIL";
  latencyMs: number;
  details: string;
  metadata?: Record<string, unknown>;
}

const auditLog: AuditResult[] = [];

function record(res: AuditResult) {
  auditLog.push(res);
  const icon =
    res.status === "PASS"
      ? "\x1b[32m[PASS]\x1b[0m"
      : res.status === "WARNING"
      ? "\x1b[33m[WARN]\x1b[0m"
      : "\x1b[31m[FAIL]\x1b[0m";
  console.log(
    `${icon} [${res.category}] ${res.name} (${res.latencyMs}ms) — ${res.details}`
  );
}

async function runLiveAudit() {
  console.log("\n=============================================================================");
  console.log("  RESUME BUDDY MONITOR v2 — LIVE PRODUCTION INFRASTRUCTURE AUDIT");
  console.log("  Timestamp:", new Date().toISOString());
  console.log("  Environment:", process.env.NODE_ENV || "production");
  console.log("  Target DB:", process.env.DATABASE_URL ? "Configured" : "MISSING");
  console.log("  Monitor Redis:", process.env.REDIS_URL ? "Configured" : "MISSING");
  console.log("  Target Prod Redis:", process.env.PROD_REDIS_URL ? "Configured" : "MISSING");
  console.log("=============================================================================\n");

  // ─── 1. INDEPENDENT WORKER VALIDATION (16 Workers) ──────────────────────────
  console.log("─── 1. Autonomous Worker Execution (16 Workers) ───");

  const workers = [
    new FrontendWorker(),
    new BackendWorker(),
    new WebSocketWorker(),
    new RedisWorker(),
    new DatabaseWorker(),
    new InfrastructureWorker(),
    new StorageWorker(),
    new AIProviderWorker(),
    new PaymentsWorker(),
    new NotificationsWorker(),
    new SSLWorker(),
    new DNSWorker(),
    new SyntheticsWorker(),
    new DeploymentWorker(),
    new CostSloWorker(),
    new HistoricalRollupWorker(),
  ];

  for (const worker of workers) {
    const start = Date.now();
    try {
      const res = await worker.execute();
      const dur = Date.now() - start;
      const pass =
        res.status === "HEALTHY"
          ? "PASS"
          : res.status === "DEGRADED"
          ? "WARNING"
          : "FAIL";
      record({
        category: "Workers",
        name: worker.workerName,
        status: pass,
        latencyMs: dur,
        details: `Service Status: ${res.status} · Message: ${res.errorMessage || "OK"}`,
        metadata: { ...res.data, statusCode: res.statusCode },
      });
    } catch (err: any) {
      record({
        category: "Workers",
        name: worker.workerName,
        status: "FAIL",
        latencyMs: Date.now() - start,
        details: `Unhandled Worker Exception: ${err.message}`,
      });
    }
  }

  // Master Runner Batch
  console.log("\n─── 2. Master Runner Orchestration Batch ───");
  const runnerStart = Date.now();
  try {
    const batchReport = await runMonitoringWorkerBatch();
    record({
      category: "Runner",
      name: "runMonitoringWorkerBatch() Orchestrator",
      status: "PASS",
      latencyMs: Date.now() - runnerStart,
      details: `Batch: ${batchReport.batchId} · Executed: ${batchReport.totalCount} services in ${batchReport.totalDurationMs}ms (${batchReport.healthyCount}/${batchReport.totalCount} Healthy)`,
    });
  } catch (err: any) {
    record({
      category: "Runner",
      name: "runMonitoringWorkerBatch() Orchestrator",
      status: "FAIL",
      latencyMs: Date.now() - runnerStart,
      details: `Batch execution failed: ${err.message}`,
    });
  }

  // ─── 3. REDIS LIVE STATE AUDIT ──────────────────────────────────────────────
  console.log("\n─── 3. Upstash Redis Real-Time State Layer Audit ───");
  const redis = getRedisClient();

  // Test Redis Summary
  const rStart = Date.now();
  try {
    const rawSummary = await redis.get("monitor:live:summary");
    const ttl = await redis.ttl("monitor:live:summary");
    if (rawSummary) {
      const parsed = JSON.parse(rawSummary);
      record({
        category: "Redis",
        name: "Key: monitor:live:summary",
        status: "PASS",
        latencyMs: Date.now() - rStart,
        details: `Valid JSON · TTL: ${ttl}s · Status: ${parsed.overallStatus} · Services: ${parsed.services?.length}`,
      });
    } else {
      record({
        category: "Redis",
        name: "Key: monitor:live:summary",
        status: "WARNING",
        latencyMs: Date.now() - rStart,
        details: "Key not found in Redis (may have expired or pending worker cycle)",
      });
    }
  } catch (err: any) {
    record({
      category: "Redis",
      name: "Key: monitor:live:summary",
      status: "FAIL",
      latencyMs: Date.now() - rStart,
      details: `Redis error: ${err.message}`,
    });
  }

  // Test Pub/Sub on monitor:events
  const pubsubStart = Date.now();
  try {
    const subscriber = redis.duplicate();
    await subscriber.connect();
    let received = false;

    await subscriber.subscribe("monitor:events");
    subscriber.on("message", (channel, message) => {
      if (channel === "monitor:events") {
        received = true;
      }
    });

    await redis.publish(
      "monitor:events",
      JSON.stringify({ type: "audit-test", timestamp: new Date().toISOString() })
    );

    await new Promise((r) => setTimeout(r, 600));
    await subscriber.unsubscribe();
    await subscriber.quit();

    record({
      category: "Redis",
      name: "Pub/Sub Channel: monitor:events",
      status: received ? "PASS" : "WARNING",
      latencyMs: Date.now() - pubsubStart,
      details: received
        ? "Subscribed & successfully received live broadcast event"
        : "Event published, but subscriber receive timed out",
    });
  } catch (err: any) {
    record({
      category: "Redis",
      name: "Pub/Sub Channel: monitor:events",
      status: "FAIL",
      latencyMs: Date.now() - pubsubStart,
      details: `Pub/Sub failed: ${err.message}`,
    });
  }

  // ─── 4. POSTGRESQL DATABASE AUDIT ──────────────────────────────────────────
  console.log("\n─── 4. Supabase PostgreSQL Historical Storage Audit ───");
  const pgStart = Date.now();
  try {
    const rawCount = await prisma.monitorMetricRollup.count();
    const incidentCount = await prisma.monitorIncident.count();
    record({
      category: "PostgreSQL",
      name: "Database Models & Queries",
      status: "PASS",
      latencyMs: Date.now() - pgStart,
      details: `Rollup rows: ${rawCount} · Incident rows: ${incidentCount} · Connection pool active`,
    });
  } catch (err: any) {
    record({
      category: "PostgreSQL",
      name: "Database Models & Queries",
      status: "FAIL",
      latencyMs: Date.now() - pgStart,
      details: `PostgreSQL query failed: ${err.message}`,
    });
  }

  // ─── 5. SYNTHETIC LIVE ENDPOINTS AUDIT ───────────────────────────────────────
  console.log("\n─── 5. Live Production Endpoints & Synthetics ───");

  const endpoints = [
    { name: "Frontend Landing", url: "https://www.resume-buddy.tech" },
    { name: "Backend Health Probe", url: "https://api.resume-buddy.tech/healthz" },
    { name: "Fastify Status", url: "https://api.resume-buddy.tech/" },
    { name: "Socket.IO Polling", url: "https://api.resume-buddy.tech/socket.io/?EIO=4&transport=polling" },
  ];

  for (const ep of endpoints) {
    const epStart = Date.now();
    try {
      const res = await fetch(ep.url, {
        method: "GET",
        headers: { "User-Agent": "ResumeBuddy-Monitor-Audit/2.0" },
        signal: AbortSignal.timeout(5000),
      });
      const dur = Date.now() - epStart;
      record({
        category: "Synthetics",
        name: ep.name,
        status: res.ok || res.status === 404 ? "PASS" : "WARNING",
        latencyMs: dur,
        details: `HTTP ${res.status} ${res.statusText} · URL: ${ep.url}`,
      });
    } catch (err: any) {
      record({
        category: "Synthetics",
        name: ep.name,
        status: "FAIL",
        latencyMs: Date.now() - epStart,
        details: `Network Error: ${err.message}`,
      });
    }
  }

  // ─── AUDIT SUMMARY ─────────────────────────────────────────────────────────
  console.log("\n=============================================================================");
  console.log("  PRODUCTION AUDIT SUMMARY MATRIX");
  console.log("=============================================================================");
  const total = auditLog.length;
  const passed = auditLog.filter((r) => r.status === "PASS").length;
  const warnings = auditLog.filter((r) => r.status === "WARNING").length;
  const failed = auditLog.filter((r) => r.status === "FAIL").length;
  const passRate = ((passed / total) * 100).toFixed(1);

  console.log(`Total Checks Executed : ${total}`);
  console.log(`Passed (Green)        : ${passed}`);
  console.log(`Warnings (Yellow)     : ${warnings}`);
  console.log(`Failed (Red)          : ${failed}`);
  console.log(`Pass Rate             : ${passRate}%`);
  console.log("=============================================================================\n");

  process.exit(failed > 0 ? 1 : 0);
}

runLiveAudit().catch((err) => {
  console.error("Fatal audit runner failure:", err);
  process.exit(1);
});
