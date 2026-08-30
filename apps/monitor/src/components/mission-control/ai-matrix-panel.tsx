"use client";

// =============================================================================
// Resume Buddy Monitor v2 — Multi-Tier AI Provider Matrix Panel
// =============================================================================

import React from "react";
import { Bot, ArrowRight, CheckCircle2, AlertTriangle, ShieldAlert } from "lucide-react";
import type { AIProviderStats } from "@/types/monitor";

interface AIMatrixPanelProps {
  aiStats?: Record<string, AIProviderStats>;
}

export function AIMatrixPanel({ aiStats }: AIMatrixPanelProps) {
  const tiers = [
    {
      tier: "Tier 1 (Primary)",
      name: "Groq (Llama 3.1 8B Instant)",
      latency: aiStats?.groq?.latencyMs || 380,
      status: aiStats?.groq?.status || "HEALTHY",
      cost: "$0.00 / token tier",
      color: "emerald",
    },
    {
      tier: "Tier 2 (Secondary)",
      name: "OpenRouter (Qwen 3.6 / Llama 70B)",
      latency: aiStats?.openrouter?.latencyMs || 1200,
      status: aiStats?.openrouter?.status || "HEALTHY",
      cost: "$0.0012 / 1k tokens",
      color: "blue",
    },
    {
      tier: "Tier 3 (Fallback)",
      name: "Google Gemini 2.5 Flash",
      latency: aiStats?.gemini?.latencyMs || 650,
      status: aiStats?.gemini?.status || "HEALTHY",
      cost: "Free quota tier",
      color: "purple",
    },
  ];

  return (
    <div className="bg-[#0b0f19] border border-[#1a2540] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-indigo-500/10 text-indigo-400">
            <Bot size={13} />
          </div>
          <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Multi-Tier AI Routing & Failover Chain
          </h2>
        </div>
        <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
          Circuit Breakers Active
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {tiers.map((t, idx) => (
          <div
            key={idx}
            className="p-3 rounded-lg bg-[#070b14] border border-[#1a2540] relative overflow-hidden flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  {t.tier}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
              <div className="text-xs font-bold text-slate-200 mt-1 truncate">
                {t.name}
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-[#1a2540] flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400">Latency:</span>
              <span className="text-slate-200 font-bold">{t.latency} ms</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
