// =============================================================================
// Resume Buddy Monitor v2 — PostgreSQL Database Worker
// =============================================================================

import { BaseMonitoringWorker } from "./base.worker";
import type { ServiceKey, ServiceStatus } from "@/types/monitor";
import { Pool } from "pg";

let poolInstance: Pool | null = null;

function getDbPool(): Pool {
  if (!poolInstance) {
    const connectionString =
      process.env.DATABASE_URL ||
      process.env.DIRECT_URL ||
      "postgresql://postgres:postgres@localhost:5432/postgres";
    poolInstance = new Pool({
      connectionString,
      max: 3,
      connectionTimeoutMillis: 4000,
      idleTimeoutMillis: 10000,
      ssl: connectionString.includes("sslmode=require") || connectionString.includes(".supabase.co")
        ? { rejectUnauthorized: false }
        : undefined,
    });
  }
  return poolInstance;
}

export class DatabaseWorker extends BaseMonitoringWorker {
  readonly workerName = "DatabaseWorker";
  readonly serviceKey: ServiceKey = "database-postgres";
  readonly serviceName = "Supabase PostgreSQL";
  override readonly timeoutMs = 4000;

  protected async runProbe(
    _signal: AbortSignal
  ): Promise<{
    status: ServiceStatus;
    latencyMs: number;
    statusCode?: number;
    errorMessage?: string;
    data?: Record<string, unknown>;
  }> {
    const pool = getDbPool();
    const start = Date.now();

    try {
      const client = await pool.connect();
      try {
        const queryStart = Date.now();
        await client.query("SELECT 1 as ping");
        const latencyMs = Date.now() - queryStart;

        let status: ServiceStatus = "HEALTHY";
        if (latencyMs > 500) {
          status = "DEGRADED";
        }

        return {
          status,
          latencyMs,
          statusCode: 200,
          data: {
            poolTotal: pool.totalCount,
            poolIdle: pool.idleCount,
            poolWaiting: pool.waitingCount,
          },
        };
      } finally {
        client.release();
      }
    } catch (err: unknown) {
      const latencyMs = Date.now() - start;
      return {
        status: "DOWN",
        latencyMs,
        statusCode: 500,
        errorMessage:
          err instanceof Error ? err.message : "Database connection failed",
      };
    }
  }
}
