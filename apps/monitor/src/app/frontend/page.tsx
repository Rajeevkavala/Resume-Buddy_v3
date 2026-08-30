import { getLatestDeployments, getSpeedInsights } from "@/lib/vercel/vercel-api";
import { StatusBadge } from "@/components/status-badge";
import { ExternalLink, GitCommit, Clock, Globe, CheckCircle2, AlertTriangle } from "lucide-react";

export const revalidate = 30;

function WebVitalScore({ label, value, unit, threshold }: {
  label: string; value: number | null; unit: string; threshold: { good: number; poor: number };
}) {
  if (value === null) return (
    <div className="monitor-card text-center">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className="text-2xl font-bold text-slate-600">—</div>
      <div className="text-[11px] text-slate-700 mt-1">No data</div>
    </div>
  );

  const isGood = value <= threshold.good;
  const isPoor = value >= threshold.poor;
  const color = isGood ? "text-emerald-400" : isPoor ? "text-red-400" : "text-amber-400";
  const badge = isGood ? "GOOD" : isPoor ? "POOR" : "NEEDS WORK";
  const badgeClass = isGood ? "badge-green" : isPoor ? "badge-red" : "badge-amber";

  return (
    <div className="monitor-card text-center">
      <div className="text-xs text-slate-500 mb-2">{label}</div>
      <div className={`text-2xl font-bold tabular-nums ${color}`}>
        {value.toFixed(value < 10 ? 3 : 0)}{unit}
      </div>
      <div className="mt-2"><span className={`badge ${badgeClass} text-[10px]`}>{badge}</span></div>
    </div>
  );
}

export default async function FrontendPage() {
  const [deploymentsResult, insightsResult] = await Promise.allSettled([
    getLatestDeployments(8),
    getSpeedInsights(),
  ]);

  const deployments = deploymentsResult.status === "fulfilled" ? deploymentsResult.value : [];
  const insights = insightsResult.status === "fulfilled" ? insightsResult.value : null;
  const activeDeployment = deployments.find((d) => d.state === "READY");
  const projectId = process.env.VERCEL_TARGET_PROJECT_ID || process.env.VERCEL_PROJECT_ID || "resume-buddy-v3";
  const prodDomain = (() => {
    try {
      return new URL(process.env.NEXT_PUBLIC_VERCEL_PROD_URL || "https://www.resume-buddy.tech").hostname;
    } catch {
      return "www.resume-buddy.tech";
    }
  })();
  const monitorDomain = (() => {
    try {
      return new URL(process.env.NEXT_PUBLIC_APP_URL || "https://monitor.resume-buddy.tech").hostname;
    } catch {
      return "monitor.resume-buddy.tech";
    }
  })();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Frontend & Edge Observability</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Vercel Project: {projectId} · {prodDomain}
        </p>
      </div>

      {/* Active Deployment */}
      <div className="grid grid-cols-4 gap-4">
        <div className="monitor-card col-span-2">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Active Production Deployment
          </div>
          {activeDeployment ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <StatusBadge status="HEALTHY" />
                <span className="font-mono text-sm text-white">{activeDeployment.uid}</span>
                <a href={activeDeployment.url} target="_blank" rel="noopener" className="text-slate-600 hover:text-slate-400">
                  <ExternalLink size={12} />
                </a>
              </div>
              {activeDeployment.meta?.githubCommitSha && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <GitCommit size={11} />
                  <span className="font-mono">{activeDeployment.meta.githubCommitSha.slice(0, 7)}</span>
                  <span className="text-slate-600">— {activeDeployment.meta.githubCommitMessage?.slice(0, 60)}</span>
                </div>
              )}
              {activeDeployment.buildDurationMs && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock size={11} />
                  Build time: <span className="text-slate-300">{(activeDeployment.buildDurationMs / 1000).toFixed(0)}s</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-600">
              {deployments.length === 0
                ? "Configure VERCEL_TOKEN to see deployment data"
                : "No READY deployment found"}
            </p>
          )}
        </div>

        <div className="monitor-card">
          <div className="text-xs text-slate-500 mb-1">Primary Domain</div>
          <div className="flex items-center gap-1.5 text-sm text-white font-semibold">
            <Globe size={13} className="text-emerald-400" />
            {prodDomain}
          </div>
          <div className="text-[11px] text-slate-600 mt-1">CNAME → cname.vercel-dns.com</div>
        </div>

        <div className="monitor-card">
          <div className="text-xs text-slate-500 mb-1">Monitor Domain</div>
          <div className="flex items-center gap-1.5 text-sm text-white font-semibold">
            <Globe size={13} className="text-cyan-400" />
            {monitorDomain}
          </div>
          <div className="text-[11px] text-slate-600 mt-1">CNAME → cname.vercel-dns.com</div>
        </div>
      </div>

      {/* Core Web Vitals */}
      <div>
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Core Web Vitals — Real User Monitoring (Vercel Speed Insights)
        </div>
        <div className="grid grid-cols-5 gap-3">
          <WebVitalScore
            label="LCP"
            value={insights?.lcp ?? null}
            unit="s"
            threshold={{ good: 2.5, poor: 4.0 }}
          />
          <WebVitalScore
            label="FID / INP"
            value={insights?.inp ?? null}
            unit="ms"
            threshold={{ good: 200, poor: 500 }}
          />
          <WebVitalScore
            label="CLS"
            value={insights?.cls ?? null}
            unit=""
            threshold={{ good: 0.1, poor: 0.25 }}
          />
          <WebVitalScore
            label="FCP"
            value={insights?.fcp ?? null}
            unit="s"
            threshold={{ good: 1.8, poor: 3.0 }}
          />
          <WebVitalScore
            label="TTFB"
            value={insights?.ttfb ?? null}
            unit="ms"
            threshold={{ good: 800, poor: 1800 }}
          />
        </div>
        {!insights && (
          <p className="text-xs text-slate-600 mt-2">
            Speed Insights require VERCEL_TOKEN + VERCEL_PROJECT_ID to be configured.
          </p>
        )}
      </div>

      {/* Deployment History */}
      <div className="monitor-card">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Recent Deployments
        </div>
        {deployments.length === 0 ? (
          <p className="text-xs text-slate-600">Configure VERCEL_TOKEN to see deployments.</p>
        ) : (
          <table className="monitor-table">
            <thead>
              <tr>
                <th>Deployment ID</th>
                <th>State</th>
                <th>Creator</th>
                <th>Commit</th>
                <th>Build Time</th>
                <th>Deployed At</th>
              </tr>
            </thead>
            <tbody>
              {deployments.map((d) => (
                <tr key={d.uid}>
                  <td className="font-mono text-[11px] text-slate-300">
                    <a href={d.url} target="_blank" rel="noopener" className="hover:text-emerald-400 flex items-center gap-1">
                      {d.uid.slice(0, 16)}...
                      <ExternalLink size={10} />
                    </a>
                  </td>
                  <td>
                    <StatusBadge
                      status={
                        d.state === "READY" ? "HEALTHY"
                        : d.state === "ERROR" ? "DOWN"
                        : "DEGRADED"
                      }
                      label={d.state}
                    />
                  </td>
                  <td className="text-[11px]">{d.creator?.email || "—"}</td>
                  <td className="font-mono text-[11px] text-slate-500">
                    {d.meta?.githubCommitSha?.slice(0, 7) || "—"}
                  </td>
                  <td className="text-[11px]">
                    {d.buildDurationMs ? `${(d.buildDurationMs / 1000).toFixed(0)}s` : "—"}
                  </td>
                  <td className="text-[11px] font-mono text-slate-500">
                    {new Date(d.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
