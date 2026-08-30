import { Settings, CheckCircle2, AlertTriangle } from "lucide-react";

export const revalidate = 0;

function EnvStatus({ name, value }: { name: string; value: string | undefined }) {
  const isSet = !!value && value !== "" && !value.startsWith("REPLACE_WITH") && !value.startsWith("YOUR_");
  return (
    <div className="flex items-center justify-between py-2 border-b border-[#1a2540] last:border-0">
      <span className="font-mono text-[11px] text-slate-400">{name}</span>
      <span className={`flex items-center gap-1 text-[11px] ${isSet ? "text-emerald-400" : "text-amber-400"}`}>
        {isSet ? <><CheckCircle2 size={11} /> SET</> : <><AlertTriangle size={11} /> NOT SET</>}
      </span>
    </div>
  );
}

export default function SettingsPage() {
  const envVars: Array<[string, string | undefined]> = [
    ["MONITOR_ADMIN_USER", process.env.MONITOR_ADMIN_USER],
    ["MONITOR_ADMIN_PASSWORD", process.env.MONITOR_ADMIN_PASSWORD],
    ["VERCEL_TOKEN", process.env.VERCEL_TOKEN],
    ["VERCEL_PROJECT_ID", process.env.VERCEL_PROJECT_ID],
    ["VERCEL_ORG_ID", process.env.VERCEL_ORG_ID],
    ["AWS_EC2_INSTANCE_ID", process.env.AWS_EC2_INSTANCE_ID],
    ["AWS_ACCESS_KEY_ID", process.env.AWS_ACCESS_KEY_ID],
    ["DATABASE_URL", process.env.DATABASE_URL],
    ["REDIS_URL", process.env.REDIS_URL],
    ["GROQ_API_KEY", process.env.GROQ_API_KEY],
    ["GOOGLE_API_KEY", process.env.GOOGLE_API_KEY],
    ["OPENROUTER_API_KEY", process.env.OPENROUTER_API_KEY],
    ["RESEND_API_KEY", process.env.RESEND_API_KEY],
    ["TWILIO_ACCOUNT_SID", process.env.TWILIO_ACCOUNT_SID],
    ["RAZORPAY_KEY_ID", process.env.RAZORPAY_KEY_ID],
  ];

  const setCount = envVars.filter(([, v]) => v && !v.startsWith("REPLACE") && !v.startsWith("YOUR_")).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Integration configuration · Probe intervals · Environment status
        </p>
      </div>

      {/* Env Status */}
      <div className="monitor-card">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Environment Variables
          </div>
          <span className={`badge ${setCount === envVars.length ? "badge-green" : "badge-amber"}`}>
            {setCount}/{envVars.length} Configured
          </span>
        </div>
        <div>
          {envVars.map(([name, value]) => (
            <EnvStatus key={name} name={name} value={value} />
          ))}
        </div>
      </div>

      {/* Probe Intervals */}
      <div className="monitor-card">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Probe Intervals (as configured)
        </div>
        <table className="monitor-table">
          <thead>
            <tr><th>Service</th><th>Interval</th><th>Timeout</th><th>Retries</th></tr>
          </thead>
          <tbody>
            {[
              { svc: "Vercel Frontend", interval: "15s", timeout: "3000ms", retries: 2 },
              { svc: "AWS CloudWatch EC2", interval: "30s", timeout: "5000ms", retries: 2 },
              { svc: "LaTeX Service", interval: "10s", timeout: "2500ms", retries: 2 },
              { svc: "WebSocket Gateway", interval: "15s", timeout: "3000ms", retries: 2 },
              { svc: "Supabase PostgreSQL", interval: "30s", timeout: "4000ms", retries: 2 },
              { svc: "Upstash Redis", interval: "15s", timeout: "2000ms", retries: 2 },
              { svc: "AWS S3 Storage", interval: "60s", timeout: "5000ms", retries: 2 },
              { svc: "Groq (Tier 1 AI)", interval: "45s", timeout: "4000ms", retries: 1 },
              { svc: "OpenRouter (Tier 2)", interval: "60s", timeout: "5000ms", retries: 1 },
              { svc: "Gemini (Tier 3)", interval: "60s", timeout: "4000ms", retries: 1 },
              { svc: "Razorpay", interval: "5m", timeout: "5000ms", retries: 2 },
              { svc: "Resend Email", interval: "5m", timeout: "5000ms", retries: 2 },
            ].map((r) => (
              <tr key={r.svc}>
                <td className="text-[11px] text-slate-300">{r.svc}</td>
                <td className="text-[11px] font-mono text-emerald-400">{r.interval}</td>
                <td className="text-[11px] font-mono text-slate-400">{r.timeout}</td>
                <td className="text-[11px] text-slate-400">{r.retries}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* DNS Setup */}
      <div className="monitor-card">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
          DNS Configuration (Namify manage.get.tech)
        </div>
        <table className="monitor-table">
          <thead>
            <tr><th>Type</th><th>Host</th><th>Target</th><th>TTL</th><th>Purpose</th></tr>
          </thead>
          <tbody>
            <tr>
              <td className="badge badge-blue text-[10px]">CNAME</td>
              <td className="font-mono text-[11px]">monitor</td>
              <td className="font-mono text-[11px] text-emerald-400">cname.vercel-dns.com</td>
              <td className="text-[11px]">3600</td>
              <td className="text-[11px] text-slate-500">monitor.resume-buddy.tech → Vercel</td>
            </tr>
            <tr>
              <td className="badge badge-blue text-[10px]">A</td>
              <td className="font-mono text-[11px]">api</td>
              <td className="font-mono text-[11px] text-emerald-400">{process.env.PROBE_TARGET_EC2_HOST || "13.207.140.19"}</td>
              <td className="text-[11px]">3600</td>
              <td className="text-[11px] text-slate-500">api.resume-buddy.tech → EC2</td>
            </tr>
            <tr>
              <td className="badge badge-blue text-[10px]">CNAME</td>
              <td className="font-mono text-[11px]">www</td>
              <td className="font-mono text-[11px] text-emerald-400">cname.vercel-dns.com</td>
              <td className="text-[11px]">3600</td>
              <td className="text-[11px] text-slate-500">www.resume-buddy.tech → Vercel</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
