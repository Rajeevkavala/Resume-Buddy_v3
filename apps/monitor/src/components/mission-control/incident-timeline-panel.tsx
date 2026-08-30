"use client";

// =============================================================================
// Resume Buddy Monitor v2 — Incident Timeline Panel
// =============================================================================

import React from "react";
import { AlertOctagon, CheckCircle2, ChevronRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { IncidentDTO } from "@/types/api";

interface IncidentTimelinePanelProps {
  incidents: IncidentDTO[];
}

export function IncidentTimelinePanel({
  incidents,
}: IncidentTimelinePanelProps) {
  return (
    <div className="bg-[#0b0f19] border border-[#1a2540] rounded-xl p-5 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-rose-500/10 text-rose-400">
            <AlertOctagon size={13} />
          </div>
          <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Incident Desk & Timeline
          </h2>
        </div>
        <Link
          href="/incidents"
          className="text-[11px] text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition-colors"
        >
          View All <ChevronRight size={11} />
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2.5 max-h-64 scrollbar-thin scrollbar-thumb-slate-800">
        {incidents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-slate-500 text-xs">
            <ShieldCheck size={24} className="text-emerald-400 mb-2" />
            <div className="text-slate-300 font-medium">Zero Open Incidents</div>
            <div className="text-[11px] text-slate-500">
              Platform stability is 100% within SLA targets.
            </div>
          </div>
        ) : (
          incidents.map((inc) => (
            <div
              key={inc.id}
              className="p-3 rounded-lg bg-[#070b14] border border-[#1a2540] flex items-start justify-between gap-3"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-rose-950/80 text-rose-400 border border-rose-800/60">
                    {inc.severity}
                  </span>
                  <span className="text-xs font-semibold text-slate-200">
                    {inc.title}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Impact: {inc.impactedService} · Status: {inc.status}
                </div>
                <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                  Opened: {new Date(inc.createdAt).toLocaleString()}
                </div>
              </div>

              <Link
                href={`/incidents?id=${inc.id}`}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex-shrink-0 transition-colors"
              >
                Triage
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
