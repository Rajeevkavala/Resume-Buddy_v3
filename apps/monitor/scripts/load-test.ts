// =============================================================================
// Resume Buddy Monitor v2 — Enterprise Load Testing & Performance Benchmark
// Production-grade concurrency simulation (10 to 1,000 users), Redis, PostgreSQL, & SSE
// =============================================================================

import { getRedisClient } from "../src/lib/redis/client";
import { prisma } from "../src/lib/prisma";
import { runMonitoringWorkerBatch } from "../src/workers/runner";
import { getLiveSummary, getLiveAlerts, getLiveIncidents } from "../src/lib/redis/live-state";
import { publishMonitorEvent } from "../src/lib/redis/pubsub";

interface LatencyStats {
  count: number;
  p50: number;
  p95: number;
  p99: number;
  max: number;
  avg: number;
  rps: number;
  errors: number;
}

function calculatePercentiles(latencies: number[], durationSec: number, errors: number): LatencyStats {
  if (latencies.length === 0) {
    return { count: 0, p50: 0, p95: 0, p99: 0, max: 0, avg: 0, rps: 0, errors };
  }
  latencies.sort((a, b) => a - b);
  const sum = latencies.reduce((acc, v) => acc + v, 0);
  return {
    count: latencies.length,
    p50: latencies[Math.floor(latencies.length * 0.5)],
    p95: latencies[Math.floor(latencies.length * 0.95)],
    p99: latencies[Math.floor(latencies.length * 0.99)],
    max: latencies[latencies.length - 1],
    avg: Math.round(sum / latencies.length),
    rps: Math.round(latencies.length / Math.max(durationSec, 0.001)),
    errors,
  };
}

async function benchmarkRedis(operations = 1000): Promise<{
  readStats: LatencyStats;
  writeStats: LatencyStats;
  pipelineStats: LatencyStats;
  pubsubLatencyMs: number;
}> {
  console.log(`\n─── [1/5] Redis Engine Benchmark (${operations} operations) ───`);
  const redis = getRedisClient();

  // 1. Single Set Latency
  const writeLatencies: number[] = [];
  let writeErrors = 0;
  const writeStart = Date.now();
  for (let i = 0; i < operations; i++) {
    const t0 = Date.now();
    try {
      await redis.set(`monitor:loadtest:${i}`, "test-payload", "EX", 30);
      writeLatencies.push(Date.now() - t0);
    } catch {
      writeErrors++;
    }
  }
  const writeDur = (Date.now() - writeStart) / 1000;
  const writeStats = calculatePercentiles(writeLatencies, writeDur, writeErrors);

  // 2. Single Get Latency
  const readLatencies: number[] = [];
  let readErrors = 0;
  const readStart = Date.now();
  for (let i = 0; i < operations; i++) {
    const t0 = Date.now();
    try {
      await redis.get(`monitor:loadtest:${i}`);
      readLatencies.push(Date.now() - t0);
    } catch {
      readErrors++;
    }
  }
  const readDur = (Date.now() - readStart) / 1000;
  const readStats = calculatePercentiles(readLatencies, readDur, readErrors);

  // 3. Pipeline Latency (batches of 50)
  const pipelineLatencies: number[] = [];
  let pipeErrors = 0;
  const pipeStart = Date.now();
  const batchCount = Math.floor(operations / 50);
  for (let b = 0; b < batchCount; b++) {
    const t0 = Date.now();
    try {
      const pipe = redis.pipeline();
      for (let i = 0; i < 50; i++) {
        pipe.get(`monitor:loadtest:${b * 50 + i}`);
      }
      await pipe.exec();
      pipelineLatencies.push(Date.now() - t0);
    } catch {
      pipeErrors++;
    }
  }
  const pipeDur = (Date.now() - pipeStart) / 1000;
  const pipelineStats = calculatePercentiles(pipelineLatencies, pipeDur, pipeErrors);

  // 4. Pub/Sub Latency
  const sub = redis.duplicate();
  await sub.connect();
  let pubsubLatencyMs = 0;
  await new Promise<void>((resolve) => {
    sub.subscribe("monitor:events");
    const sendTime = Date.now();
    sub.on("message", (_ch, _msg) => {
      pubsubLatencyMs = Date.now() - sendTime;
      resolve();
    });
    publishMonitorEvent({
      type: "health-update",
      data: { test: true },
      timestamp: new Date().toISOString(),
    });
  });
  await sub.unsubscribe();
  await sub.quit();

  // Cleanup test keys
  const cleanPipe = redis.pipeline();
  for (let i = 0; i < operations; i++) {
    cleanPipe.del(`monitor:loadtest:${i}`);
  }
  await cleanPipe.exec();

  console.log(`  Reads      : p50=${readStats.p50}ms | p95=${readStats.p95}ms | p99=${readStats.p99}ms | RPS=${readStats.rps}`);
  console.log(`  Writes     : p50=${writeStats.p50}ms | p95=${writeStats.p95}ms | p99=${writeStats.p99}ms | RPS=${writeStats.rps}`);
  console.log(`  Pipelines  : p50=${pipelineStats.p50}ms | p95=${pipelineStats.p95}ms | p99=${pipelineStats.p99}ms | RPS=${pipelineStats.rps * 50} keys/s`);
  console.log(`  Pub/Sub    : ${pubsubLatencyMs}ms roundtrip delivery`);

  return { readStats, writeStats, pipelineStats, pubsubLatencyMs };
}

async function benchmarkPostgreSQL(operations = 200): Promise<{
  queryStats: LatencyStats;
  insertStats: LatencyStats;
  poolConnectionTimeMs: number;
}> {
  console.log(`\n─── [2/5] Supabase PostgreSQL Database Benchmark (${operations} queries) ───`);
  const poolStart = Date.now();
  await prisma.$queryRaw`SELECT 1`.catch(() => {});
  const poolConnectionTimeMs = Date.now() - poolStart;

  // 1. Historical Rollup Queries (in concurrent batches of 5)
  const queryLatencies: number[] = [];
  let queryErrors = 0;
  const qStart = Date.now();
  const batchCount = Math.ceil(operations / 5);

  for (let b = 0; b < batchCount; b++) {
    const tasks = Array.from({ length: 5 }).map(async () => {
      const t0 = Date.now();
      try {
        await prisma.monitorMetricRollup.findMany({
          where: { serviceKey: "frontend-vercel" },
          orderBy: { timestamp: "desc" },
          take: 20,
        });
        queryLatencies.push(Date.now() - t0);
      } catch {
        queryErrors++;
      }
    });
    await Promise.all(tasks);
  }
  const qDur = (Date.now() - qStart) / 1000;
  const queryStats = calculatePercentiles(queryLatencies, qDur, queryErrors);

  // 2. Incident Desk Queries
  const insertLatencies: number[] = [];
  let insertErrors = 0;
  const iStart = Date.now();
  const insertTasks = Array.from({ length: 20 }).map(async (_, i) => {
    const t0 = Date.now();
    try {
      await prisma.monitorAuditLog.create({
        data: {
          adminEmail: "loadtest@resume-buddy.tech",
          action: "load_test_probe",
          target: `test_target_${i}`,
          payload: { loadTest: true, iteration: i },
        },
      });
      insertLatencies.push(Date.now() - t0);
    } catch {
      insertErrors++;
    }
  });
  await Promise.all(insertTasks);
  const iDur = (Date.now() - iStart) / 1000;
  const insertStats = calculatePercentiles(insertLatencies, iDur, insertErrors);

  // Clean up audit logs
  await prisma.monitorAuditLog.deleteMany({
    where: { adminEmail: "loadtest@resume-buddy.tech" },
  }).catch(() => {});

  console.log(`  Initial Pool Connect : ${poolConnectionTimeMs}ms`);
  console.log(`  Historical Queries   : p50=${queryStats.p50}ms | p95=${queryStats.p95}ms | p99=${queryStats.p99}ms | RPS=${queryStats.rps}`);
  console.log(`  Audit Log Inserts    : p50=${insertStats.p50}ms | p95=${insertStats.p95}ms | p99=${insertStats.p99}ms | RPS=${insertStats.rps}`);

  return { queryStats, insertStats, poolConnectionTimeMs };
}

async function simulateConcurrentUsers(concurrencyLevels: number[]): Promise<
  Record<number, { summaryStats: LatencyStats; alertsStats: LatencyStats; incidentsStats: LatencyStats }>
> {
  console.log("\n─── [3/5] Concurrent User Simulation (10 to 1,000 Virtual Users) ───");
  const results: Record<
    number,
    { summaryStats: LatencyStats; alertsStats: LatencyStats; incidentsStats: LatencyStats }
  > = {};

  for (const concurrency of concurrencyLevels) {
    const requestsPerUser = 5;
    const totalRequests = concurrency * requestsPerUser;

    // Simulate Dashboard /summary calls
    const summaryLatencies: number[] = [];
    let summaryErrors = 0;
    const sStart = Date.now();

    const chunks = [];
    for (let c = 0; c < concurrency; c++) {
      chunks.push(
        (async () => {
          for (let r = 0; r < requestsPerUser; r++) {
            const t0 = Date.now();
            try {
              const live = await getLiveSummary();
              if (!live) throw new Error("Empty summary");
              summaryLatencies.push(Date.now() - t0);
            } catch {
              summaryErrors++;
            }
          }
        })()
      );
    }
    await Promise.all(chunks);
    const sDur = (Date.now() - sStart) / 1000;
    const summaryStats = calculatePercentiles(summaryLatencies, sDur, summaryErrors);

    // Simulate /alerts calls
    const alertLatencies: number[] = [];
    let alertErrors = 0;
    const aStart = Date.now();
    const alertChunks = [];
    for (let c = 0; c < concurrency; c++) {
      alertChunks.push(
        (async () => {
          for (let r = 0; r < requestsPerUser; r++) {
            const t0 = Date.now();
            try {
              await getLiveAlerts();
              alertLatencies.push(Date.now() - t0);
            } catch {
              alertErrors++;
            }
          }
        })()
      );
    }
    await Promise.all(alertChunks);
    const aDur = (Date.now() - aStart) / 1000;
    const alertsStats = calculatePercentiles(alertLatencies, aDur, alertErrors);

    // Simulate /incidents calls
    const incLatencies: number[] = [];
    let incErrors = 0;
    const incStart = Date.now();
    const incChunks = [];
    for (let c = 0; c < concurrency; c++) {
      incChunks.push(
        (async () => {
          for (let r = 0; r < requestsPerUser; r++) {
            const t0 = Date.now();
            try {
              await getLiveIncidents();
              incLatencies.push(Date.now() - t0);
            } catch {
              incErrors++;
            }
          }
        })()
      );
    }
    await Promise.all(incChunks);
    const incDur = (Date.now() - incStart) / 1000;
    const incidentsStats = calculatePercentiles(incLatencies, incDur, incErrors);

    results[concurrency] = { summaryStats, alertsStats, incidentsStats };

    console.log(
      `  Concurrency = ${concurrency.toString().padEnd(4)} users (${totalRequests} reqs): ` +
        `/summary: p50=${summaryStats.p50}ms, p95=${summaryStats.p95}ms, RPS=${summaryStats.rps} | ` +
        `/alerts: p50=${alertsStats.p50}ms, RPS=${alertsStats.rps} | ` +
        `Errors=${summaryErrors + alertErrors + incErrors}`
    );
  }

  return results;
}

async function benchmarkSSEHub(clientCounts: number[]): Promise<
  Record<number, { connectionDurationMs: number; eventsReceived: number; dropRate: number }>
> {
  console.log("\n─── [4/5] Real-Time SSE Hub & Event Bus Scalability Benchmark ───");
  const redis = getRedisClient();
  const results: Record<
    number,
    { connectionDurationMs: number; eventsReceived: number; dropRate: number }
  > = {};

  for (const clientCount of clientCounts) {
    const subscribers: ReturnType<typeof redis.duplicate>[] = [];
    let totalReceived = 0;

    const connectStart = Date.now();
    for (let i = 0; i < clientCount; i++) {
      const sub = redis.duplicate();
      await sub.connect();
      await sub.subscribe("monitor:events");
      sub.on("message", () => {
        totalReceived++;
      });
      subscribers.push(sub);
    }
    const connectionDurationMs = Date.now() - connectStart;

    // Broadcast 5 events
    for (let e = 0; e < 5; e++) {
      await publishMonitorEvent({
        type: "health-update",
        data: { eventId: e, clientCount },
        timestamp: new Date().toISOString(),
      });
    }

    await new Promise((r) => setTimeout(r, 800));

    const expected = clientCount * 5;
    const dropRate = ((expected - totalReceived) / expected) * 100;

    results[clientCount] = {
      connectionDurationMs,
      eventsReceived: totalReceived,
      dropRate: Math.max(0, dropRate),
    };

    console.log(
      `  SSE Clients = ${clientCount.toString().padEnd(4)} : ` +
        `Subscribed in ${connectionDurationMs}ms | ` +
        `Events Received: ${totalReceived}/${expected} (${(100 - dropRate).toFixed(1)}% delivery) | ` +
        `Drops: ${Math.max(0, dropRate).toFixed(1)}%`
    );

    // Cleanup subscribers
    await Promise.all(
      subscribers.map(async (s) => {
        await s.unsubscribe();
        await s.quit();
      })
    );
  }

  return results;
}

async function benchmarkWorkersUnderLoad(cycles = 3): Promise<{
  durations: number[];
  avgDurationMs: number;
  memoryUsageMb: number;
  cpuUserSec: number;
}> {
  console.log(`\n─── [5/5] Autonomous Monitoring Workers Parallel Benchmark (${cycles} cycles) ───`);
  const durations: number[] = [];

  const memBefore = process.memoryUsage().rss / (1024 * 1024);
  const cpuBefore = process.cpuUsage();

  for (let c = 1; c <= cycles; c++) {
    const start = Date.now();
    const batchReport = await runMonitoringWorkerBatch();
    const dur = Date.now() - start;
    durations.push(dur);
    console.log(
      `  Cycle ${c}/${cycles} : Executed ${batchReport.totalCount} workers concurrently in ${dur}ms (${batchReport.healthyCount}/${batchReport.totalCount} Healthy)`
    );
  }

  const memAfter = process.memoryUsage().rss / (1024 * 1024);
  const cpuDiff = process.cpuUsage(cpuBefore);
  const avgDurationMs = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);

  console.log(`  Average Batch Runtime : ${avgDurationMs}ms`);
  console.log(`  Process Memory (RSS)  : ${memAfter.toFixed(1)} MB (Delta: +${(memAfter - memBefore).toFixed(1)} MB)`);
  console.log(`  CPU User / System     : ${(cpuDiff.user / 1e6).toFixed(2)}s / ${(cpuDiff.system / 1e6).toFixed(2)}s`);

  return {
    durations,
    avgDurationMs,
    memoryUsageMb: memAfter,
    cpuUserSec: cpuDiff.user / 1e6,
  };
}

async function runFullLoadTest() {
  console.log("=============================================================================");
  console.log("  RESUME BUDDY MONITOR v2 — ENTERPRISE LOAD & PERFORMANCE AUDIT");
  console.log("  Timestamp:", new Date().toISOString());
  console.log("  Node Version:", process.version);
  console.log("  Platform:", process.platform, process.arch);
  console.log("=============================================================================");

  const tStart = Date.now();

  const redisResults = await benchmarkRedis(500);
  const pgResults = await benchmarkPostgreSQL(100);
  const concurrencyResults = await simulateConcurrentUsers([10, 25, 50, 100, 250, 500, 1000]);
  const sseResults = await benchmarkSSEHub([10, 50, 100, 250, 500]);
  const workerResults = await benchmarkWorkersUnderLoad(3);

  const totalTimeSec = ((Date.now() - tStart) / 1000).toFixed(1);

  console.log("\n=============================================================================");
  console.log(`  LOAD TEST BENCHMARK COMPLETE (Total Duration: ${totalTimeSec}s)`);
  console.log("=============================================================================\n");

  process.exit(0);
}

runFullLoadTest().catch((err) => {
  console.error("Fatal load test runner failure:", err);
  process.exit(1);
});
