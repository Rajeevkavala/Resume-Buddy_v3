import { BookOpen } from "lucide-react";

export const revalidate = 60;

export default async function AuditLogsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Audit Logs</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Tamper-evident admin action log · All actions performed in the monitoring platform
        </p>
      </div>

      <div className="monitor-card">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <BookOpen size={12} />
          Admin Actions
        </div>
        <div className="text-xs text-slate-600 py-4 text-center">
          Audit log entries are stored in the database (MonitorAuditLog table).<br />
          Actions like ACK_INCIDENT, VERCEL_ROLLBACK, TRIGGER_PROBE will appear here.
        </div>
      </div>

      <div className="monitor-card">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Tracked Actions
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            "ACK_INCIDENT", "VERCEL_ROLLBACK", "TRIGGER_PROBE",
            "RESOLVE_INCIDENT", "DECLARE_MAINTENANCE", "RESTART_SERVICE",
            "CHANGE_THRESHOLD", "VIEW_LOGS", "EXPORT_DATA",
          ].map((action) => (
            <div key={action} className="bg-[#0a0f1e] rounded-lg p-2.5 border border-[#1a2540]">
              <span className="font-mono text-[11px] text-slate-400">{action}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
