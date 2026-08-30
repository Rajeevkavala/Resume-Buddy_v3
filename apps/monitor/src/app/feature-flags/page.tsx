"use client";

// =============================================================================
// Resume Buddy Monitor v2 — Platform Feature Flags & Kill Switches
// =============================================================================

import React, { useState } from "react";
import { Flag, Plus, CheckCircle2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  percentage: number;
  environment: string;
}

const INITIAL_FLAGS: FeatureFlag[] = [
  {
    id: "flag_1",
    key: "ai_groq_instant_routing",
    name: "Groq Instant AI Routing",
    description: "Routes real-time bullet improvements directly to Groq Llama 3.1 8B Instant",
    enabled: true,
    percentage: 100,
    environment: "production",
  },
  {
    id: "flag_2",
    key: "latex_in_memory_cache",
    name: "Fastify PDF Cache Optimization",
    description: "Caches compiled PDF byte buffers in memory keyed by LaTeX hash",
    enabled: true,
    percentage: 100,
    environment: "production",
  },
  {
    id: "flag_3",
    key: "socketio_redis_adapter",
    name: "Multi-Instance Redis Socket.io Adapter",
    description: "Broadcasts WebSocket notifications across multiple container instances via Redis",
    enabled: true,
    percentage: 100,
    environment: "production",
  },
  {
    id: "flag_4",
    key: "sarvam_indic_voice_beta",
    name: "Sarvam Indic Voice Processing (Beta)",
    description: "Enables Sarvam AI pipeline for vernacular Hindi/Tamil mock interviews",
    enabled: false,
    percentage: 20,
    environment: "staging",
  },
];

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>(INITIAL_FLAGS);

  const toggleFlag = (id: string) => {
    setFlags((prev) =>
      prev.map((f) => {
        if (f.id === id) {
          const next = !f.enabled;
          toast.success(`Flag "${f.key}" is now ${next ? "ENABLED" : "DISABLED"}`);
          return { ...f, enabled: next };
        }
        return f;
      })
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Flag className="text-pink-400" size={20} />
            Feature Flags & Circuit Breakers
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gradual rollouts, emergency kill switches, and runtime feature toggles
          </p>
        </div>

        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold shadow-lg shadow-pink-950/40 transition-all">
          <Plus size={14} />
          <span>New Feature Flag</span>
        </button>
      </div>

      <div className="bg-[#0b0f19] border border-[#1a2540] rounded-xl overflow-hidden divide-y divide-[#1a2540]">
        {flags.map((flag) => (
          <div
            key={flag.id}
            className="p-4 hover:bg-[#070b14] transition-colors flex items-center justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">{flag.name}</span>
                <span className="text-[10px] font-mono text-slate-500 bg-slate-800 px-1.5 py-0.2 rounded">
                  {flag.key}
                </span>
                <span className="text-[10px] font-mono text-slate-400 border border-slate-700 px-1.5 py-0.2 rounded">
                  {flag.environment}
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {flag.description}
              </div>
              <div className="text-[10px] font-mono text-slate-500 mt-1">
                Rollout: {flag.percentage}% of active traffic
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleFlag(flag.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold font-mono transition-all ${
                  flag.enabled
                    ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 hover:bg-emerald-900"
                    : "bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700"
                }`}
              >
                {flag.enabled ? "ACTIVE" : "DISABLED"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
