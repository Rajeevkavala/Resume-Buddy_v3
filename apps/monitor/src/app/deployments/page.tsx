import { getLatestDeployments } from "@/lib/vercel/vercel-api";
import { StatusBadge } from "@/components/status-badge";
import { ExternalLink, GitCommit, GitBranch } from "lucide-react";

export const revalidate = 60;

export default async function DeploymentsPage() {
  const deployments = await getLatestDeployments(20).catch(() => []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Deployments</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Vercel deployment history · GitHub Actions CI/CD
        </p>
      </div>

      <div className="monitor-card">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <GitBranch size={12} />
          Vercel Deployment History (Last 20)
        </div>

        {deployments.length === 0 ? (
          <p className="text-xs text-slate-600">
            Configure V_API_TOKEN and V_TARGET_PROJECT_ID to see deployment history.
          </p>
        ) : (
          <table className="monitor-table">
            <thead>
              <tr>
                <th>Deployment</th>
                <th>State</th>
                <th>Commit</th>
                <th>Creator</th>
                <th>Build Time</th>
                <th>Deployed</th>
              </tr>
            </thead>
            <tbody>
              {deployments.map((d) => (
                <tr key={d.uid}>
                  <td>
                    <a
                      href={d.url}
                      target="_blank"
                      rel="noopener"
                      className="font-mono text-[11px] text-slate-300 hover:text-emerald-400 flex items-center gap-1"
                    >
                      {d.uid.slice(0, 16)}...
                      <ExternalLink size={10} />
                    </a>
                  </td>
                  <td>
                    <StatusBadge
                      status={d.state === "READY" ? "HEALTHY" : d.state === "ERROR" ? "DOWN" : "DEGRADED"}
                      label={d.state}
                    />
                  </td>
                  <td>
                    {d.meta?.githubCommitSha && (
                      <div className="flex items-center gap-1 text-[11px]">
                        <GitCommit size={10} className="text-slate-600" />
                        <span className="font-mono text-slate-400">{d.meta.githubCommitSha.slice(0, 7)}</span>
                      </div>
                    )}
                    {d.meta?.githubCommitMessage && (
                      <div className="text-[10px] text-slate-600 truncate max-w-xs">
                        {d.meta.githubCommitMessage.slice(0, 50)}
                      </div>
                    )}
                  </td>
                  <td className="text-[11px]">{d.creator?.email || "—"}</td>
                  <td className="text-[11px] text-slate-300">
                    {d.buildDurationMs ? `${(d.buildDurationMs / 1000).toFixed(0)}s` : "—"}
                  </td>
                  <td className="text-[11px] font-mono text-slate-500">
                    {new Date(d.createdAt).toLocaleString("en-IN", {
                      timeZone: "Asia/Kolkata",
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
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
