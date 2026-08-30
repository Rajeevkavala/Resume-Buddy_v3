import { getEC2Metrics, getEC2MetricsHistory, getCloudWatchAlarms } from "@/lib/aws/cloudwatch";
import { getRecentErrors } from "@/lib/aws/cloudwatch-logs";
import { GaugeWidget } from "@/components/gauge-widget";
import { CloudWatchChart } from "@/components/cloudwatch-chart";
import { StatusBadge } from "@/components/status-badge";
import { AlertTriangle, CheckCircle2, Server, Database } from "lucide-react";

export const revalidate = 30;

export default async function InfrastructurePage() {
  const [ec2, history, alarms, errors] = await Promise.allSettled([
    getEC2Metrics(),
    getEC2MetricsHistory(24),
    getCloudWatchAlarms(),
    getRecentErrors(60),
  ]);

  const m = ec2.status === "fulfilled" ? ec2.value : null;
  const h = history.status === "fulfilled" ? history.value : [];
  const a = alarms.status === "fulfilled" ? alarms.value : [];
  const e = errors.status === "fulfilled" ? errors.value : [];

  const statusCheckOk = (m?.statusCheckFailed ?? 0) === 0;
  const activeAlarms = a.filter((alarm) => alarm.stateValue === "ALARM");

  const ec2Host = process.env.PROBE_TARGET_EC2_HOST || "EC2 Graviton2";
  const backendHost = (() => {
    try {
      return new URL(process.env.PROBE_TARGET_BACKEND_URL || "https://api.resume-buddy.tech").hostname;
    } catch {
      return "api.resume-buddy.tech";
    }
  })();
  const region = process.env.AWS_REGION || "ap-south-1";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">
          Infrastructure — AWS CloudWatch
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          EC2 Graviton2 ({region}) · {ec2Host} · {backendHost}
        </p>
      </div>

      {/* EC2 Gauges */}
      <div className="monitor-card">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-6">
          CloudWatch Metrics & CWAgent Telemetry
        </div>
        <div className="grid grid-cols-4 gap-6">
          <GaugeWidget
            value={m?.cpuUtilization ?? 0}
            label="EC2 CPU"
            sublabel="AWS/EC2:CPUUtilization"
            size="md"
          />
          <GaugeWidget
            value={m?.memUsedPercent ?? 0}
            label="Memory Usage"
            sublabel="CWAgent:mem_used_percent"
            size="md"
          />
          <GaugeWidget
            value={m?.diskUsedPercent ?? 0}
            label="Disk Usage"
            sublabel="CWAgent:disk_used_percent"
            size="md"
          />
          <GaugeWidget
            value={m?.swapUsedPercent ?? 0}
            label="Swap Usage"
            sublabel="CWAgent:swap_used_percent"
            size="md"
          />
        </div>

        {/* Status Check */}
        <div className="mt-6 pt-4 border-t border-[#1a2540] flex items-center gap-6">
          <div className="flex items-center gap-2">
            {statusCheckOk ? (
              <CheckCircle2 size={14} className="text-emerald-400" />
            ) : (
              <AlertTriangle size={14} className="text-red-400" />
            )}
            <span className="text-xs text-slate-300">
              StatusCheckFailed:{" "}
              <span
                className={
                  statusCheckOk ? "text-emerald-400" : "text-red-400"
                }
              >
                {m?.statusCheckFailed ?? "—"} (
                {statusCheckOk ? "OK" : "FAILED"})
              </span>
            </span>
          </div>
          <div className="text-xs text-slate-500">
            NetworkIn:{" "}
            <span className="text-slate-300">
              {m ? (m.networkIn / 1024 / 1024).toFixed(2) : "—"} MB
            </span>
          </div>
          <div className="text-xs text-slate-500">
            NetworkOut:{" "}
            <span className="text-slate-300">
              {m ? (m.networkOut / 1024 / 1024).toFixed(2) : "—"} MB
            </span>
          </div>
        </div>
      </div>

      {/* 24h History Chart */}
      {h.length > 0 && (
        <CloudWatchChart
          data={h.map((d) => ({
            timestamp: d.timestamp,
            cpu: d.cpu,
            memory: d.memory,
          }))}
          metrics={[
            { key: "cpu", label: "CPU %", color: "#3b82f6" },
            { key: "memory", label: "Memory %", color: "#10b981" },
          ]}
          title="24h CPU & Memory History (5-min granularity)"
          height={220}
          unit="%"
        />
      )}

      {/* CloudWatch Alarms */}
      <div className="monitor-card">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
          CloudWatch Alarms ({a.length} configured,{" "}
          <span className={activeAlarms.length > 0 ? "text-red-400" : "text-emerald-400"}>
            {activeAlarms.length} ALARM
          </span>
          )
        </div>
        {a.length === 0 ? (
          <p className="text-xs text-slate-600">
            No alarms found with prefix &quot;resumebuddy&quot;. Configure CloudWatch Alarms in AWS Console.
          </p>
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
              {a.map((alarm) => (
                <tr key={alarm.alarmName}>
                  <td className="font-mono text-[11px] text-slate-300">
                    {alarm.alarmName}
                  </td>
                  <td className="text-[11px]">{alarm.metricName}</td>
                  <td>
                    <StatusBadge
                      status={
                        alarm.stateValue === "OK"
                          ? "HEALTHY"
                          : alarm.stateValue === "ALARM"
                          ? "DOWN"
                          : "DEGRADED"
                      }
                    />
                  </td>
                  <td className="text-[11px] text-slate-500 max-w-xs truncate">
                    {alarm.stateReason}
                  </td>
                  <td className="text-[11px] font-mono text-slate-600">
                    {alarm.stateUpdatedTimestamp.toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Docker Container Table */}
      <div className="monitor-card">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Docker Runtime & Container Log Streams
        </div>
        <table className="monitor-table">
          <thead>
            <tr>
              <th>Container</th>
              <th>Status</th>
              <th>Port</th>
              <th>CloudWatch Log Group</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="font-mono text-[11px] text-slate-300">resumebuddy-latex</td>
              <td><span className="badge badge-green">UP</span></td>
              <td className="text-[11px] font-mono">127.0.0.1:8080</td>
              <td className="text-[11px] font-mono text-slate-500">/aws/ec2/resumebuddy/latex-service</td>
            </tr>
            <tr>
              <td className="font-mono text-[11px] text-slate-300">resumebuddy-ws</td>
              <td><span className="badge badge-green">UP</span></td>
              <td className="text-[11px] font-mono">127.0.0.1:3001</td>
              <td className="text-[11px] font-mono text-slate-500">/aws/ec2/resumebuddy/websocket-service</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Recent Log Events */}
      <div className="monitor-card">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
          CloudWatch Logs Insights — Recent Errors & Warnings (Last 60 min)
        </div>
        <div className="space-y-1 max-h-60 overflow-y-auto">
          {e.length === 0 ? (
            <div className="flex items-center gap-2 text-emerald-400 text-xs py-2">
              <CheckCircle2 size={13} />
              No errors or warnings in the last 60 minutes
            </div>
          ) : (
            e.map((evt, i) => (
              <div
                key={i}
                className={`log-font py-1 px-2 rounded flex items-start gap-2 ${
                  evt.level === "ERROR"
                    ? "text-red-400 bg-red-950/20"
                    : evt.level === "WARN"
                    ? "text-amber-400 bg-amber-950/20"
                    : "text-slate-400"
                }`}
              >
                <span className="text-slate-600 flex-shrink-0">{evt.timestamp}</span>
                <span className="font-semibold flex-shrink-0">[{evt.level}]</span>
                <span className="truncate">{evt.message}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
