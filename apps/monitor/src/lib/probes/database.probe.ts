import type { ProbeResult } from "@/types/monitor";

const DATABASE_URL = process.env.DATABASE_URL || "";

let pgPool: import("pg").Pool | null = null;

async function getPool() {
  if (!pgPool) {
    const { Pool } = await import("pg");
    pgPool = new Pool({
      connectionString: DATABASE_URL,
      max: 3,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 4000,
      ssl: { rejectUnauthorized: false },
    });
  }
  return pgPool;
}

export async function runDatabaseProbe(): Promise<ProbeResult> {
  const start = Date.now();
  let client;

  try {
    const pool = await getPool();
    client = await pool.connect();

    // Execute lightweight count query
    const queryStart = Date.now();
    const result = await client.query(`SELECT count(*) as cnt FROM "User"`);
    const queryLatency = Date.now() - queryStart;
    const totalLatency = Date.now() - start;

    const isDegraded = queryLatency > 450;
    const isCritical = queryLatency > 4000;
    const userCount = parseInt(result.rows[0]?.cnt || "0", 10);

    return {
      serviceKey: "database-postgres",
      serviceName: "Supabase PostgreSQL",
      status: isCritical ? "DOWN" : isDegraded ? "DEGRADED" : "HEALTHY",
      latencyMs: queryLatency,
      metadata: { userCount, totalLatencyMs: totalLatency },
      checkedAt: new Date(),
    };
  } catch (error) {
    return {
      serviceKey: "database-postgres",
      serviceName: "Supabase PostgreSQL",
      status: "DOWN",
      latencyMs: Date.now() - start,
      errorMessage: error instanceof Error ? error.message : "DB probe failed",
      checkedAt: new Date(),
    };
  } finally {
    client?.release();
  }
}

// ─── Get Pool Stats ───────────────────────────────────────────────────────────

export async function getDatabasePoolStats() {
  let client;
  try {
    const pool = await getPool();
    client = await pool.connect();

    const result = await client.query(`
      SELECT state, count(*) as count
      FROM pg_stat_activity
      WHERE datname = current_database()
      GROUP BY state
    `);

    const stats: Record<string, number> = {};
    for (const row of result.rows) {
      stats[row.state || "unknown"] = parseInt(row.count, 10);
    }

    const active = stats["active"] || 0;
    const idle = stats["idle"] || 0;
    const total = Object.values(stats).reduce((a, b) => a + b, 0);

    return { active, idle, total, maxConnections: 100 };
  } catch {
    return { active: 0, idle: 0, total: 0, maxConnections: 100 };
  } finally {
    client?.release();
  }
}

// ─── Get Slow Queries ─────────────────────────────────────────────────────────

export async function getSlowQueries() {
  let client;
  try {
    const pool = await getPool();
    client = await pool.connect();

    const result = await client.query(`
      SELECT query, mean_exec_time, calls
      FROM pg_stat_statements
      ORDER BY mean_exec_time DESC
      LIMIT 10
    `);

    return result.rows.map((r) => ({
      query: (r.query as string).substring(0, 100) + "...",
      meanExecTimeMs: parseFloat(r.mean_exec_time),
      calls: parseInt(r.calls, 10),
    }));
  } catch {
    return [];
  } finally {
    client?.release();
  }
}
