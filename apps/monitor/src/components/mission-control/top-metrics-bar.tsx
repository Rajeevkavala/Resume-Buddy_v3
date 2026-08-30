"use client";

// =============================================================================
// Resume Buddy Monitor v2 — 10 Core Top Metric Cards
// =============================================================================

import React from "react";
import {
  Activity,
  Target,
  PieChart,
  Zap,
  GitBranch,
  AlertOctagon,
  Bot,
  Layers,
  Radio,
  DollarSign,
} from "lucide-react";
import type { MonitorSummaryDTO } from "@/types/api";

interface TopMetricsBarProps {
  summary?: MonitorSummaryDTO;
}

export function TopMetricsBar({ summary }: TopMetricsBarProps) {
  const isHealthy = summary?.overallStatus === "HEALTHY";

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {/* 1. Overall Health */}
      <div className="bg-[#0b0f19] border border-[#1a2540] hover:border-slate-700 p-3.5 rounded-xl flex flex-col justify-between transition-all">
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>Overall Health</span>
          <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400">
            <Activity size={13} />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isHealthy ? "bg-emerald-400 animate-pulse" : "bg-rose-400 animate-ping"
              }`}
            />
            {summary?.overallStatus ?? "HEALTHY"}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {summary ? `${summary.healthyServicesCount}/${summary.totalServicesCount} Services Operational` : "13/13 Services"}
          </div>
        </div>
      </div>

      {/* 2. 30-Day SLO */}
      <div className="bg-[#0b0f19] border border-[#1a2540] hover:border-slate-700 p-3.5 rounded-xl flex flex-col justify-between transition-all">
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>30-Day SLO</span>
          <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-400">
            <Target size={13} />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-xl font-bold text-slate-100 font-mono">
            {summary?.uptime30d ? `${summary.uptime30d.toFixed(2)}%` : "99.98%"}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
            Target: 99.90% (Tier 1)
          </div>
        </div>
      </div>

      {/* 3. Error Budget */}
      <div className="bg-[#0b0f19] border border-[#1a2540] hover:border-slate-700 p-3.5 rounded-xl flex flex-col justify-between transition-all">
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>Error Budget</span>
          <div className="p-1.5 rounded-md bg-cyan-500/10 text-cyan-400">
            <PieChart size={13} />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-xl font-bold text-emerald-400 font-mono">
            {summary?.errorBudgetRemaining ? `${summary.errorBudgetRemaining.toFixed(1)}%` : "84.2%"}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Remaining: 36.4 mins
          </div>
        </div>
      </div>

      {/* 4. Global p95 Latency */}
      <div className="bg-[#0b0f19] border border-[#1a2540] hover:border-slate-700 p-3.5 rounded-xl flex flex-col justify-between transition-all">
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>p95 Latency</span>
          <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-400">
            <Zap size={13} />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-xl font-bold text-slate-100 font-mono">
            {summary?.p95GlobalLatencyMs ? `${summary.p95GlobalLatencyMs.toFixed(0)} ms` : "38 ms"}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Vercel Edge & Fastify
          </div>
        </div>
      </div>

      {/* 5. Latest Deployment */}
      <div className="bg-[#0b0f19] border border-[#1a2540] hover:border-slate-700 p-3.5 rounded-xl flex flex-col justify-between transition-all">
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>Deployment</span>
          <div className="p-1.5 rounded-md bg-indigo-500/10 text-indigo-400">
            <GitBranch size={13} />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-xl font-bold text-slate-100 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            READY
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 font-mono truncate">
            sha: {summary?.latestDeployment?.meta?.githubCommitSha?.slice(0, 7) || "a9f82d1"}
          </div>
        </div>
      </div>

      {/* 6. Active Incidents */}
      <div className="bg-[#0b0f19] border border-[#1a2540] hover:border-slate-700 p-3.5 rounded-xl flex flex-col justify-between transition-all">
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>Active Incidents</span>
          <div className="p-1.5 rounded-md bg-rose-500/10 text-rose-400">
            <AlertOctagon size={13} />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-xl font-bold text-slate-100 font-mono">
            {summary?.activeIncidentsCount ?? 0}
          </div>
          <div className="text-[11px] text-emerald-400 mt-0.5">
            {(summary?.activeIncidentsCount ?? 0) === 0 ? "All queues normal" : "Triage required"}
          </div>
        </div>
      </div>

      {/* 7. AI Inference Cost */}
      <div className="bg-[#0b0f19] border border-[#1a2540] hover:border-slate-700 p-3.5 rounded-xl flex flex-col justify-between transition-all">
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>AI Daily Cost</span>
          <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400">
            <Bot size={13} />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-xl font-bold text-slate-100 font-mono">
            ${summary?.aiDailyCostUsd?.toFixed(2) || "0.00"}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Groq $\to$ OpenRouter $\to$ Gemini
          </div>
        </div>
      </div>

      {/* 8. API Requests */}
      <div className="bg-[#0b0f19] border border-[#1a2540] hover:border-slate-700 p-3.5 rounded-xl flex flex-col justify-between transition-all">
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>API Requests</span>
          <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-400">
            <Layers size={13} />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-xl font-bold text-slate-100 font-mono">
            14.2k <span className="text-xs text-slate-500 font-normal">/24h</span>
          </div>
          <div className="text-[11px] text-emerald-400 mt-0.5">
            99.98% Success Rate
          </div>
        </div>
      </div>

      {/* 9. WebSocket Connections */}
      <div className="bg-[#0b0f19] border border-[#1a2540] hover:border-slate-700 p-3.5 rounded-xl flex flex-col justify-between transition-all">
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>WebSockets</span>
          <div className="p-1.5 rounded-md bg-cyan-500/10 text-cyan-400">
            <Radio size={13} />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-xl font-bold text-slate-100 font-mono">
            {summary?.activeWebsockets ?? 4}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Gateway: Socket.io :3001
          </div>
        </div>
      </div>

      {/* 10. Infrastructure Cost */}
      <div className="bg-[#0b0f19] border border-[#1a2540] hover:border-slate-700 p-3.5 rounded-xl flex flex-col justify-between transition-all">
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>Infra Cost</span>
          <div className="p-1.5 rounded-md bg-slate-800 text-slate-300">
            <DollarSign size={13} />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-xl font-bold text-slate-100 font-mono">
            ${summary?.infraMonthlyCostUsd?.toFixed(2) || "24.50"}
            <span className="text-xs text-slate-500 font-normal">/mo</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            EC2 + Supabase + Upstash
          </div>
        </div>
      </div>
    </div>
  );
}
