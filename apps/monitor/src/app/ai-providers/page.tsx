import { getAllAIProviderStats } from "@/lib/probes/ai.probe";
import { StatusBadge } from "@/components/status-badge";
import { Brain, Zap, DollarSign } from "lucide-react";

export const revalidate = 45;

const PROVIDER_META = {
  groq: { name: "Groq API", tier: "Tier 1 (Primary)", model: "llama-3.1-8b-instant", color: "text-orange-400", badge: "badge-amber" },
  openrouter: { name: "OpenRouter", tier: "Tier 2 (Secondary)", model: "qwen/qwen3-235b-a22b", color: "text-purple-400", badge: "badge-blue" },
  gemini: { name: "Google Gemini", tier: "Tier 3 (Fallback)", model: "gemini-2.0-flash", color: "text-blue-400", badge: "badge-blue" },
  sarvam: { name: "Sarvam AI", tier: "Audio (Indic Voice)", model: "saaras:v2", color: "text-pink-400", badge: "badge-gray" },
};

export default async function AIProvidersPage() {
  let providers = await getAllAIProviderStats().catch(() => []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">AI Providers</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Multi-tier AI Router: Groq → OpenRouter → Gemini (auto-fallback)
        </p>
      </div>

      {/* Provider Cards */}
      <div className="grid grid-cols-3 gap-4">
        {providers.map((p) => {
          const meta = PROVIDER_META[p.provider] || PROVIDER_META.groq;
          return (
            <div key={p.provider} className="monitor-card">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className={`text-sm font-semibold ${meta.color}`}>{meta.name}</div>
                  <div className="text-[11px] text-slate-600">{meta.tier}</div>
                </div>
                <StatusBadge status={p.status} />
              </div>

              <div className="text-xs text-slate-500 mb-2 font-mono">{meta.model}</div>

              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="bg-[#0a0f1e] rounded p-2 border border-[#1a2540]">
                  <div className="text-[10px] text-slate-600">Latency</div>
                  <div className={`text-sm font-bold tabular-nums ${p.latencyMs > 3000 ? "text-red-400" : p.latencyMs > 1500 ? "text-amber-400" : "text-emerald-400"}`}>
                    {p.latencyMs > 0 ? `${p.latencyMs}ms` : "—"}
                  </div>
                </div>
                <div className="bg-[#0a0f1e] rounded p-2 border border-[#1a2540]">
                  <div className="text-[10px] text-slate-600">Tokens (probe)</div>
                  <div className="text-sm font-bold text-white tabular-nums">{p.tokensGenerated || "—"}</div>
                </div>
              </div>

              {p.fallbackActive && (
                <div className="mt-2 text-[11px] text-amber-400 flex items-center gap-1">
                  <Zap size={10} />
                  Fallback routing active
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Fallback Chain Diagram */}
      <div className="monitor-card">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
          AI Routing Fallback Chain
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {["Groq (Primary)", "→", "OpenRouter (Tier 2)", "→", "Gemini 2.5 (Tier 3)", "→", "Sarvam (Audio)"].map((item, i) => (
            item === "→" ? (
              <span key={i} className="text-slate-600 text-lg">→</span>
            ) : (
              <div key={i} className="px-3 py-1.5 bg-[#0a0f1e] border border-[#1a2540] rounded-lg text-xs text-slate-300 font-medium">
                {item}
              </div>
            )
          ))}
        </div>
        <p className="text-xs text-slate-600 mt-3">
          Automatic fallback triggers on HTTP 429 (rate limit) or 5xx errors. Each tier is probed every 45–60 seconds.
        </p>
      </div>

      {/* Cost Info */}
      <div className="monitor-card">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Cost Tracking (Daily Estimate)
        </div>
        <p className="text-xs text-slate-600">
          Cost tracking requires instrumenting the main application&apos;s AI router with token usage metrics.
          Once integrated, this page will display total tokens/day, cost/day, and per-provider breakdown.
        </p>
      </div>
    </div>
  );
}
