"use client";

// =============================================================================
// Resume Buddy Monitor v2 — Live Alerts Feed Component
// =============================================================================

import React from "react";
import { Bell, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import type { AlertEventDTO } from "@/types/api";

interface LiveAlertsPanelProps {
  alerts: AlertEventDTO[];
}

export function LiveAlertsPanel({ alerts }: LiveAlertsPanelProps) {
  return (
    <div className="bg-[#0b0f19] border border-[#1a2540] rounded-xl p-5 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-amber-500/10 text-amber-400">
            <Bell size={13} />
          </div>
          <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Live Alerts Feed
          </h2>
        </div>
        <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
          {alerts.length} Active
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 max-h-64 scrollbar-thin scrollbar-thumb-slate-800">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-slate-500 text-xs">
            <CheckCircle2 size={24} className="text-emerald-400 mb-2" />
            <div className="text-slate-300 font-medium">All Alerts Clear</div>
            <div className="text-[11px] text-slate-500">
              No threshold breaches or active incident alerts.
            </div>
          </div>
        ) : (
          alerts.map((alt) => (
            <div
              key={alt.id}
              className="p-2.5 rounded-lg bg-[#070b14] border border-[#1a2540] flex items-start gap-2.5"
            >
              <AlertTriangle size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-slate-200 truncate">
                  {alt.title}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                  {alt.message}
                </div>
                <div className="text-[9px] font-mono text-slate-500 mt-1">
                  Triggered: {new Date(alt.triggeredAt).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
