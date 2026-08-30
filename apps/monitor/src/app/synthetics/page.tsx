import { runAllSynthetics, getCachedSyntheticResults, getSyntheticLastRunAt } from "@/lib/synthetics";
import { SYNTHETIC_WORKFLOW_LABELS } from "@/types/monitor";
import { CheckCircle2, XCircle, Clock, FlaskConical, RefreshCw } from "lucide-react";

export const revalidate = 300;

export default async function SyntheticsPage() {
  // Trigger a run if no cached results
  let results = getCachedSyntheticResults();
  if (results.length === 0) {
    results = await runAllSynthetics().catch(() => []);
  }

  const lastRun = getSyntheticLastRunAt();
  const passCount = results.filter((r) => r.success).length;
  const failCount = results.filter((r) => !r.success).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Synthetic Tests</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            End-to-end user journey probes · Runs every 5 minutes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`badge ${passCount === results.length ? "badge-green" : failCount > 0 ? "badge-red" : "badge-amber"}`}>
            <FlaskConical size={11} />
            {passCount}/{results.length} PASSING
          </div>
          {lastRun && (
            <div className="text-[11px] text-slate-600 flex items-center gap-1">
              <Clock size={10} />
              Last run: {lastRun.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" })} IST
            </div>
          )}
        </div>
      </div>

      {/* Summary Bar */}
      <div className="monitor-card">
        <div className="grid grid-cols-3 gap-6">
          <div>
            <div className="text-xs text-slate-500 mb-1">Passing</div>
            <div className="text-3xl font-bold text-emerald-400 tabular-nums">{passCount}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1">Failing</div>
            <div className="text-3xl font-bold text-red-400 tabular-nums">{failCount}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1">Avg Duration</div>
            <div className="text-3xl font-bold text-white tabular-nums">
              {results.length > 0
                ? `${(results.reduce((a, r) => a + r.durationMs, 0) / results.length).toFixed(0)}ms`
                : "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Test Matrix */}
      <div className="monitor-card">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Synthetic Journey Test Matrix
        </div>
        <div className="space-y-2">
          {Object.entries(SYNTHETIC_WORKFLOW_LABELS).map(([key, name]) => {
            const result = results.find((r) => r.workflowKey === key);

            return (
              <div
                key={key}
                className="flex items-start gap-3 p-3 rounded-lg bg-[#0a0f1e] border border-[#1a2540]"
              >
                {/* Status icon */}
                <div className="mt-0.5 flex-shrink-0">
                  {!result ? (
                    <div className="w-4 h-4 rounded-full bg-[#1a2540]" />
                  ) : result.success ? (
                    <CheckCircle2 size={16} className="text-emerald-400" />
                  ) : (
                    <XCircle size={16} className="text-red-400" />
                  )}
                </div>

                {/* Name + steps */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-300">{name}</span>
                    <span className="text-[10px] font-mono text-slate-600">{key}</span>
                  </div>

                  {/* Step timeline */}
                  {result && result.stepTimings.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {result.stepTimings.map((step, i) => (
                        <div
                          key={i}
                          className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border ${
                            step.success
                              ? "border-emerald-900 bg-emerald-950/30 text-emerald-400"
                              : "border-red-900 bg-red-950/30 text-red-400"
                          }`}
                        >
                          <span>{step.stepName}</span>
                          <span className="text-slate-600">{step.durationMs}ms</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {result?.failureReason && (
                    <div className="text-[11px] text-red-400 mt-1">
                      ✕ {result.failureReason}
                    </div>
                  )}
                </div>

                {/* Duration */}
                <div className="flex-shrink-0 text-right">
                  {result ? (
                    <>
                      <div className="text-sm font-mono text-white">{result.durationMs}ms</div>
                      <div className="text-[10px] text-slate-600">
                        {result.executedAt.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" })} IST
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-slate-600">Not run</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
