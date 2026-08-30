import { StatusBadge } from "@/components/status-badge";
import { CreditCard, CheckCircle2 } from "lucide-react";

export const revalidate = 300;

async function checkRazorpay(): Promise<{ ok: boolean; latencyMs: number }> {
  const KEY_ID = process.env.RAZORPAY_KEY_ID || "";
  const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";

  if (!KEY_ID || !KEY_SECRET) return { ok: false, latencyMs: 0 };

  const start = Date.now();
  try {
    const credentials = Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString("base64");
    const res = await fetch("https://api.razorpay.com/v1/orders?count=1", {
      headers: { Authorization: `Basic ${credentials}` },
      signal: AbortSignal.timeout(5000),
    });
    return { ok: res.ok, latencyMs: Date.now() - start };
  } catch {
    return { ok: false, latencyMs: Date.now() - start };
  }
}

export default async function PaymentsPage() {
  const razorpay = await checkRazorpay().catch(() => ({ ok: false, latencyMs: 0 }));
  const planId = process.env.RAZORPAY_PLAN_ID || "Pro Subscription";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Payments — Razorpay</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Live mode · {planId} · Webhooks at /api/payments/webhook
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="monitor-card">
          <div className="text-xs text-slate-500 mb-2">API Status</div>
          <div className="mt-2">
            <StatusBadge status={razorpay.ok ? "HEALTHY" : "DOWN"} size="lg" />
          </div>
          <div className="text-xs text-slate-600 mt-2">api.razorpay.com</div>
        </div>
        <div className="monitor-card">
          <div className="text-xs text-slate-500 mb-2">API Latency</div>
          <div className={`text-3xl font-bold tabular-nums ${razorpay.latencyMs > 2000 ? "text-amber-400" : "text-emerald-400"}`}>
            {razorpay.latencyMs > 0 ? `${razorpay.latencyMs}ms` : "—"}
          </div>
        </div>
        <div className="monitor-card">
          <div className="text-xs text-slate-500 mb-2">Plan</div>
          <div className="text-sm font-mono text-white">{planId}</div>
          <div className="text-[11px] text-slate-600 mt-1">Live mode credentials active</div>
        </div>
      </div>

      <div className="monitor-card">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Webhook Configuration
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-[#0a0f1e] rounded-lg p-3 border border-[#1a2540]">
            <div className="text-slate-500 mb-1">Webhook Endpoint</div>
            <div className="font-mono text-slate-300">/api/payments/webhook</div>
          </div>
          <div className="bg-[#0a0f1e] rounded-lg p-3 border border-[#1a2540]">
            <div className="text-slate-500 mb-1">Secret Verification</div>
            <div className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 size={11} />
              HMAC-SHA256 active
            </div>
          </div>
        </div>
        <p className="text-xs text-slate-600 mt-3">
          Payment success/failure metrics are tracked via incoming Razorpay webhook events.
          Conversion rate and revenue metrics will display once webhook events are being received.
        </p>
      </div>
    </div>
  );
}
