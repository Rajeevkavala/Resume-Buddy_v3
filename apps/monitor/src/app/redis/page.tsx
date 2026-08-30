import { runRedisProbe, getRedisStats } from "@/lib/probes/redis.probe";
import { StatusBadge } from "@/components/status-badge";
import { CheckCircle2, AlertTriangle } from "lucide-react";

export const revalidate = 15;

export default async function RedisPage() {
  const [probeResult, statsResult] = await Promise.allSettled([
    runRedisProbe(),
    getRedisStats(),
  ]);

  const probe = probeResult.status === "fulfilled" ? probeResult.value : null;
  const stats = statsResult.status === "fulfilled" ? statsResult.value : null;

  const hitRatio = stats?.hitRatioPercent ?? 0;

  const redisEndpoint = (() => {
    try {
      const raw = process.env.PROD_REDIS_URL || process.env.REDIS_URL || "";
      if (raw.includes("@")) {
        return raw.split("@")[1].replace(/["']/g, "");
      }
      return raw ? new URL(raw.replace(/^rediss:\/\//, "https://")).host : "Upstash Redis TLS";
    } catch {
      return "Upstash Redis TLS";
    }
  })();
  const region = process.env.AWS_REGION || "ap-south-1";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Redis — Upstash Serverless</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {redisEndpoint} · TLS · {region}
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="monitor-card">
          <div className="text-xs text-slate-500 mb-2">PING Latency</div>
          <div className={`text-3xl font-bold tabular-nums ${(stats?.pingLatencyMs ?? 0) > 400 ? "text-amber-400" : "text-emerald-400"}`}>
            {stats ? `${stats.pingLatencyMs}ms` : "—"}
          </div>
          {probe && <div className="mt-2"><StatusBadge status={probe.status} /></div>}
        </div>
        <div className="monitor-card">
          <div className="text-xs text-slate-500 mb-2">Memory Used</div>
          <div className="text-3xl font-bold text-white tabular-nums">
            {stats ? `${stats.memoryUsedMB.toFixed(1)} MB` : "—"}
          </div>
        </div>
        <div className="monitor-card">
          <div className="text-xs text-slate-500 mb-2">Cache Hit Ratio</div>
          <div className={`text-3xl font-bold tabular-nums ${hitRatio > 80 ? "text-emerald-400" : hitRatio > 50 ? "text-amber-400" : "text-red-400"}`}>
            {stats ? `${hitRatio.toFixed(1)}%` : "—"}
          </div>
        </div>
        <div className="monitor-card">
          <div className="text-xs text-slate-500 mb-2">Total Keys</div>
          <div className="text-3xl font-bold text-white tabular-nums">
            {stats?.totalKeys?.toLocaleString() ?? "—"}
          </div>
        </div>
      </div>

      {/* Hit/Miss Chart */}
      <div className="monitor-card">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Cache Hit/Miss Statistics
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Hits</span>
              <span className="text-emerald-400 font-semibold">{stats?.keyspaceHits?.toLocaleString() ?? "—"}</span>
            </div>
            <div className="h-2 bg-[#0a0f1e] rounded-full overflow-hidden border border-[#1a2540]">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${hitRatio}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Misses</span>
              <span className="text-red-400 font-semibold">{stats?.keyspaceMisses?.toLocaleString() ?? "—"}</span>
            </div>
            <div className="h-2 bg-[#0a0f1e] rounded-full overflow-hidden border border-[#1a2540]">
              <div className="h-full bg-red-500 rounded-full" style={{ width: `${100 - hitRatio}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Connected Clients</span>
              <span className="text-blue-400 font-semibold">{stats?.connectedClients ?? "—"}</span>
            </div>
            <div className="h-2 bg-[#0a0f1e] rounded-full overflow-hidden border border-[#1a2540]">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: "30%" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Connection Info */}
      <div className="monitor-card">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Connection Details
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-[#0a0f1e] rounded-lg p-3 border border-[#1a2540]">
            <div className="text-slate-500 mb-1">Endpoint</div>
            <div className="font-mono text-slate-300">{redisEndpoint}</div>
          </div>
          <div className="bg-[#0a0f1e] rounded-lg p-3 border border-[#1a2540]">
            <div className="text-slate-500 mb-1">Transport</div>
            <div className="font-mono text-slate-300">TLS (rediss://)</div>
          </div>
          <div className="bg-[#0a0f1e] rounded-lg p-3 border border-[#1a2540]">
            <div className="text-slate-500 mb-1">SET/GET/DEL Roundtrip</div>
            <div className="flex items-center gap-1">
              {(probe?.metadata as any)?.roundtripOk ? (
                <><CheckCircle2 size={12} className="text-emerald-400" /><span className="text-emerald-400">PASS</span></>
              ) : (
                <><AlertTriangle size={12} className="text-red-400" /><span className="text-red-400">FAIL</span></>
              )}
            </div>
          </div>
          <div className="bg-[#0a0f1e] rounded-lg p-3 border border-[#1a2540]">
            <div className="text-slate-500 mb-1">Commands Processed</div>
            <div className="font-mono text-slate-300">{stats?.commandsPerSecond?.toLocaleString() ?? "—"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
