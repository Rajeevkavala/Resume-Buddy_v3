import { getRecentErrors, getLatexCompileStats } from "@/lib/aws/cloudwatch-logs";
import { ScrollText } from "lucide-react";

export const revalidate = 30;
export const dynamic = "force-dynamic";

export default async function LogsPage() {
  const [errorsResult, latexResult] = await Promise.allSettled([
    getRecentErrors(60),
    getLatexCompileStats(60),
  ]);

  const errors = errorsResult.status === "fulfilled" ? errorsResult.value : [];
  const latex = latexResult.status === "fulfilled" ? latexResult.value : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Log Explorer</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          AWS CloudWatch Logs Insights · /aws/ec2/resumebuddy/* · Last 60 minutes
        </p>
      </div>

      {/* CloudWatch Error Logs */}
      <div className="monitor-card">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <ScrollText size={12} />
            CloudWatch Logs — Errors & Warnings
          </div>
          <div className="text-[11px] text-slate-600">{errors.length} entries</div>
        </div>

        <div className="bg-[#060b14] rounded-lg border border-[#1a2540] p-3 max-h-80 overflow-y-auto">
          {errors.length === 0 ? (
            <div className="text-emerald-400 text-xs flex items-center gap-2 py-2">
              <span>✓</span>
              No errors or warnings in CloudWatch Logs in the last 60 minutes
            </div>
          ) : (
            errors.map((e, i) => (
              <div
                key={i}
                className={`log-font flex items-start gap-2 py-1 border-b border-[#0d1526] last:border-0 ${
                  e.level === "ERROR" ? "text-red-400" : e.level === "WARN" ? "text-amber-400" : "text-slate-400"
                }`}
              >
                <span className="text-slate-700 flex-shrink-0 w-36 truncate">{e.timestamp}</span>
                <span className={`flex-shrink-0 w-12 font-semibold ${e.level === "ERROR" ? "text-red-400" : "text-amber-400"}`}>
                  [{e.level}]
                </span>
                <span className="truncate">{e.message}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* LaTeX Compile Logs */}
      <div className="monitor-card">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            CloudWatch Logs — LaTeX Compile Activity
          </div>
          <div className="text-[11px] text-slate-600">{latex.length} entries</div>
        </div>

        <div className="bg-[#060b14] rounded-lg border border-[#1a2540] p-3 max-h-60 overflow-y-auto">
          {latex.length === 0 ? (
            <div className="text-slate-600 text-xs py-2">
              No LaTeX compile events found in CloudWatch Logs. Ensure Docker is configured with awslogs driver.
            </div>
          ) : (
            latex.map((e, i) => (
              <div key={i} className="log-font flex items-start gap-2 py-1 border-b border-[#0d1526] last:border-0 text-slate-400">
                <span className="text-slate-700 flex-shrink-0 w-36 truncate">{e.timestamp}</span>
                <span className="text-purple-400 flex-shrink-0">[LATEX]</span>
                <span className="truncate">{e.message}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Query Reference */}
      <div className="monitor-card">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          CloudWatch Logs Insights Query Reference
        </div>
        <div className="space-y-2">
          {[
            {
              label: "All Errors & Warnings (last 60m)",
              query: `fields @timestamp, @message | filter @message like /(ERROR|WARN|exception|timeout|failed)/ | sort @timestamp desc | limit 100`,
            },
            {
              label: "LaTeX Compile Activity",
              query: `fields @timestamp, @message | filter @message like /compiled|compile|Tectonic/ | sort @timestamp desc`,
            },
            {
              label: "WebSocket Connections",
              query: `fields @timestamp, @message | filter @message like /Socket|connection|room/ | sort @timestamp desc`,
            },
          ].map((q) => (
            <div key={q.label} className="bg-[#0a0f1e] rounded-lg p-3 border border-[#1a2540]">
              <div className="text-[11px] font-semibold text-slate-400 mb-1">{q.label}</div>
              <div className="log-font text-[11px] text-slate-500 whitespace-pre-wrap">{q.query}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
