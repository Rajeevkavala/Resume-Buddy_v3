import { runDatabaseProbe, getDatabasePoolStats, getSlowQueries } from "@/lib/probes/database.probe";
import { StatusBadge } from "@/components/status-badge";
import { Database, AlertTriangle, CheckCircle2 } from "lucide-react";

export const revalidate = 30;

export default async function DatabasePage() {
  const [probeResult, poolResult, slowResult] = await Promise.allSettled([
    runDatabaseProbe(),
    getDatabasePoolStats(),
    getSlowQueries(),
  ]);

  const probe = probeResult.status === "fulfilled" ? probeResult.value : null;
  const pool = poolResult.status === "fulfilled" ? poolResult.value : null;
  const slow = slowResult.status === "fulfilled" ? slowResult.value : [];

  const saturation = pool ? (pool.active / pool.maxConnections) * 100 : 0;

  const dbHost = (() => {
    try {
      const raw = process.env.DATABASE_URL || "";
      const parsed = new URL(raw.replace(/^postgresql:\/\//, "http://"));
      return parsed.hostname;
    } catch {
      return "pooler.supabase.com";
    }
  })();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Database — Supabase PostgreSQL</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          PgBouncer :6543 · Direct :5432 · {dbHost}
        </p>
      </div>

      {/* Status + Pool */}
      <div className="grid grid-cols-4 gap-4">
        <div className="monitor-card">
          <div className="text-xs text-slate-500 mb-2">Query Latency</div>
          <div className={`text-3xl font-bold tabular-nums ${probe?.latencyMs && probe.latencyMs > 450 ? "text-amber-400" : "text-emerald-400"}`}>
            {probe ? `${probe.latencyMs.toFixed(0)}ms` : "—"}
          </div>
          <div className="mt-2">{probe && <StatusBadge status={probe.status} />}</div>
        </div>

        <div className="monitor-card">
          <div className="text-xs text-slate-500 mb-2">Active Connections</div>
          <div className="text-3xl font-bold text-white tabular-nums">
            {pool?.active ?? "—"}
          </div>
          <div className="text-xs text-slate-600 mt-1">of {pool?.maxConnections ?? 100} max</div>
        </div>

        <div className="monitor-card">
          <div className="text-xs text-slate-500 mb-2">Idle Connections</div>
          <div className="text-3xl font-bold text-slate-400 tabular-nums">
            {pool?.idle ?? "—"}
          </div>
          <div className="text-xs text-slate-600 mt-1">Pooler saturation: {saturation.toFixed(1)}%</div>
        </div>

        <div className="monitor-card">
          <div className="text-xs text-slate-500 mb-2">Total Users</div>
          <div className="text-3xl font-bold text-white tabular-nums">
            {(probe?.metadata as any)?.userCount ?? "—"}
          </div>
          <div className="text-xs text-slate-600 mt-1">FROM &quot;User&quot; table</div>
        </div>
      </div>

      {/* Pool Saturation Bar */}
      <div className="monitor-card">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          PgBouncer Connection Pool Saturation
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1 bg-[#0a0f1e] rounded-full h-4 overflow-hidden border border-[#1a2540]">
            <div
              className={`h-full rounded-full transition-all ${
                saturation > 80 ? "bg-red-500" : saturation > 60 ? "bg-amber-500" : "bg-emerald-500"
              }`}
              style={{ width: `${Math.min(100, saturation)}%` }}
            />
          </div>
          <span className="text-sm font-mono text-white w-16 text-right">
            {saturation.toFixed(1)}%
          </span>
        </div>
        <div className="flex justify-between text-[11px] text-slate-600 mt-1">
          <span>0</span>
          <span className="text-amber-500">60% warn</span>
          <span className="text-red-500">80% critical</span>
          <span>100 max</span>
        </div>
      </div>

      {/* Slow Queries */}
      <div className="monitor-card">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Slow Query Leaderboard (pg_stat_statements)
        </div>
        {slow.length === 0 ? (
          <div className="flex items-center gap-2 text-emerald-400 text-xs py-2">
            <CheckCircle2 size={13} />
            pg_stat_statements not enabled or no slow queries found
          </div>
        ) : (
          <table className="monitor-table">
            <thead>
              <tr>
                <th>Query (truncated)</th>
                <th>Mean Exec Time</th>
                <th>Calls</th>
              </tr>
            </thead>
            <tbody>
              {slow.map((q, i) => (
                <tr key={i}>
                  <td className="font-mono text-[11px] text-slate-400 max-w-sm truncate">
                    {q.query}
                  </td>
                  <td className={`text-[11px] font-semibold ${q.meanExecTimeMs > 450 ? "text-amber-400" : "text-slate-300"}`}>
                    {q.meanExecTimeMs.toFixed(2)}ms
                  </td>
                  <td className="text-[11px] text-slate-500">{q.calls.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Error */}
      {probe?.errorMessage && (
        <div className="monitor-card flex items-start gap-3">
          <AlertTriangle size={14} className="text-red-400 mt-0.5" />
          <div>
            <div className="text-sm font-semibold text-red-400">Database Connection Error</div>
            <div className="text-xs text-slate-400 mt-1 font-mono">{probe.errorMessage}</div>
          </div>
        </div>
      )}
    </div>
  );
}
