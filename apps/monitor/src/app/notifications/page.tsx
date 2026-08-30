import { StatusBadge } from "@/components/status-badge";
import { Mail, MessageSquare, CheckCircle2 } from "lucide-react";

export const revalidate = 300;

async function checkResend(): Promise<{ ok: boolean; latencyMs: number; domains: string[] }> {
  const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
  if (!RESEND_API_KEY) return { ok: false, latencyMs: 0, domains: [] };

  const start = Date.now();
  try {
    const res = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${RESEND_API_KEY}` },
      signal: AbortSignal.timeout(5000),
    });
    const latencyMs = Date.now() - start;
    if (!res.ok) return { ok: false, latencyMs, domains: [] };
    const data = await res.json();
    const domains = (data.data || []).map((d: { name: string }) => d.name);
    return { ok: true, latencyMs, domains };
  } catch {
    return { ok: false, latencyMs: Date.now() - start, domains: [] };
  }
}

async function checkTwilio(): Promise<{ ok: boolean; latencyMs: number }> {
  const SID = process.env.TWILIO_ACCOUNT_SID || "";
  const TOKEN = process.env.TWILIO_AUTH_TOKEN || "";
  if (!SID || !TOKEN) return { ok: false, latencyMs: 0 };

  const start = Date.now();
  try {
    const credentials = Buffer.from(`${SID}:${TOKEN}`).toString("base64");
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${SID}.json`, {
      headers: { Authorization: `Basic ${credentials}` },
      signal: AbortSignal.timeout(5000),
    });
    return { ok: res.ok, latencyMs: Date.now() - start };
  } catch {
    return { ok: false, latencyMs: Date.now() - start };
  }
}

export default async function NotificationsPage() {
  const [resend, twilio] = await Promise.all([
    checkResend().catch(() => ({ ok: false, latencyMs: 0, domains: [] as string[] })),
    checkTwilio().catch(() => ({ ok: false, latencyMs: 0 })),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Notifications — Email & SMS</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Resend Email API + Twilio SMS/WhatsApp
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Resend */}
        <div className="monitor-card">
          <div className="flex items-center gap-2 mb-4">
            <Mail size={16} className="text-blue-400" />
            <div className="text-sm font-semibold text-white">Resend Email</div>
            <StatusBadge status={resend.ok ? "HEALTHY" : "DOWN"} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#0a0f1e] rounded-lg p-3 border border-[#1a2540]">
              <div className="text-[11px] text-slate-500">API Latency</div>
              <div className={`text-xl font-bold tabular-nums ${resend.latencyMs > 1500 ? "text-amber-400" : "text-emerald-400"}`}>
                {resend.latencyMs > 0 ? `${resend.latencyMs}ms` : "—"}
              </div>
            </div>
            <div className="bg-[#0a0f1e] rounded-lg p-3 border border-[#1a2540]">
              <div className="text-[11px] text-slate-500">From Address</div>
              <div className="text-xs font-mono text-slate-300 mt-1">{process.env.ALERT_EMAIL_FROM || process.env.EMAIL_FROM || "alerts@resume-buddy.tech"}</div>
            </div>
          </div>
          {resend.domains && resend.domains.length > 0 && (
            <div className="mt-3 flex items-center gap-2 text-xs">
              <CheckCircle2 size={12} className="text-emerald-400" />
              <span className="text-slate-400">Verified domains: {resend.domains.join(", ")}</span>
            </div>
          )}
        </div>

        {/* Twilio */}
        <div className="monitor-card">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare size={16} className="text-red-400" />
            <div className="text-sm font-semibold text-white">Twilio SMS/WhatsApp</div>
            <StatusBadge status={twilio.ok ? "HEALTHY" : "DOWN"} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#0a0f1e] rounded-lg p-3 border border-[#1a2540]">
              <div className="text-[11px] text-slate-500">API Latency</div>
              <div className={`text-xl font-bold tabular-nums ${twilio.latencyMs > 2000 ? "text-amber-400" : "text-emerald-400"}`}>
                {twilio.latencyMs > 0 ? `${twilio.latencyMs}ms` : "—"}
              </div>
            </div>
            <div className="bg-[#0a0f1e] rounded-lg p-3 border border-[#1a2540]">
              <div className="text-[11px] text-slate-500">WhatsApp Number</div>
              <div className="text-xs font-mono text-slate-300 mt-1">{process.env.TWILIO_WHATSAPP_NUMBER || process.env.TWILIO_PHONE_NUMBER || "+14155238886"}</div>
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-600">
            Number: {process.env.TWILIO_WHATSAPP_NUMBER || process.env.TWILIO_PHONE_NUMBER || "+14155238886"} · SMS via Twilio Messaging
          </div>
        </div>
      </div>
    </div>
  );
}
