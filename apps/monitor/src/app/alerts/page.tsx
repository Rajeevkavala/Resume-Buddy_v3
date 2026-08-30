import { getCloudWatchAlarms } from "@/lib/aws/cloudwatch";
import { StatusBadge } from "@/components/status-badge";
import { Bell, CheckCircle2 } from "lucide-react";

export const revalidate = 60;

export default async function AlertsPage() {
  const alarms = await getCloudWatchAlarms().catch(() => []);
  const activeAlarms = alarms.filter((a) => a.stateValue === "ALARM");
  const okAlarms = alarms.filter((a) => a.stateValue === "OK");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Alerts & Alarms</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          CloudWatch Alarms (resumebuddy prefix) · Alert threshold manager
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="monitor-card">
          <div className="text-xs text-slate-500 mb-2">Active Alarms</div>
          <div className={`text-3xl font-bold tabular-nums ${activeAlarms.length > 0 ? "text-red-400" : "text-emerald-400"}`}>
            {activeAlarms.length}
          </div>
        </div>
        <div className="monitor-card">
          <div className="text-xs text-slate-500 mb-2">OK Alarms</div>
          <div className="text-3xl font-bold text-emerald-400 tabular-nums">{okAlarms.length}</div>
        </div>
        <div className="monitor-card">
          <div className="text-xs text-slate-500 mb-2">Total Configured</div>
          <div className="text-3xl font-bold text-white tabular-nums">{alarms.length}</div>
        </div>
      </div>

      {/* Alarm List */}
      <div className="monitor-card">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
          CloudWatch Alarms
        </div>
        {alarms.length === 0 ? (
          <div className="text-xs text-slate-600 py-4 text-center">
            <div className="mb-2">No CloudWatch Alarms found with prefix &quot;resumebuddy&quot;</div>
            <div className="text-slate-700">
              Create alarms in AWS Console → CloudWatch → Alarms<br/>
              Name format: resumebuddy-ec2-cpu-high, resumebuddy-ec2-statuscheck, etc.
            </div>
          </div>
        ) : (
          <table className="monitor-table">
            <thead>
              <tr>
                <th>Alarm Name</th>
                <th>Metric</th>
                <th>State</th>
                <th>Reason</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {alarms.map((a) => (
                <tr key={a.alarmName}>
                  <td className="font-mono text-[11px] text-slate-300">{a.alarmName}</td>
                  <td className="text-[11px]">{a.metricName}</td>
                  <td>
                    <StatusBadge
                      status={a.stateValue === "OK" ? "HEALTHY" : a.stateValue === "ALARM" ? "DOWN" : "DEGRADED"}
                      label={a.stateValue}
                    />
                  </td>
                  <td className="text-[11px] text-slate-500 max-w-xs truncate">{a.stateReason}</td>
                  <td className="text-[11px] font-mono text-slate-600">
                    {a.stateUpdatedTimestamp.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Alert Rules Reference */}
      <div className="monitor-card">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Monitor Alert Rules (Internal Thresholds)
        </div>
        <table className="monitor-table">
          <thead>
            <tr><th>Service</th><th>Condition</th><th>Severity</th><th>Channels</th></tr>
          </thead>
          <tbody>
            {[
              { svc: "AWS EC2", cond: "StatusCheckFailed > 0", sev: "P1_CRITICAL", ch: "SMS + Email" },
              { svc: "AWS EC2", cond: "CPU > 85% for 2 cycles", sev: "P2_HIGH", ch: "Email" },
              { svc: "Supabase DB", cond: "Connection refused", sev: "P1_CRITICAL", ch: "SMS + Email" },
              { svc: "Vercel Edge", cond: "HTTP 5xx or DOWN", sev: "P1_CRITICAL", ch: "SMS + Email" },
              { svc: "LaTeX Service", cond: "DOWN (3 consecutive fails)", sev: "P1_CRITICAL", ch: "SMS + Email" },
              { svc: "Upstash Redis", cond: "DOWN or auth failure", sev: "P2_HIGH", ch: "Email" },
              { svc: "SSL Cert", cond: "Expiring < 14 days", sev: "P3_MEDIUM", ch: "Email" },
            ].map((row) => (
              <tr key={row.svc + row.cond}>
                <td className="text-[11px] text-slate-300">{row.svc}</td>
                <td className="text-[11px] font-mono text-slate-400">{row.cond}</td>
                <td>
                  <span className={`badge ${row.sev.includes("P1") ? "badge-red" : row.sev.includes("P2") ? "badge-amber" : "badge-blue"} text-[10px]`}>
                    {row.sev}
                  </span>
                </td>
                <td className="text-[11px] text-slate-500">{row.ch}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
