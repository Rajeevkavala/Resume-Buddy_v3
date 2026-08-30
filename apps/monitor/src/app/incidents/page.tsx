"use client";

// =============================================================================
// Resume Buddy Monitor v2 — Enterprise Incident Desk
// =============================================================================

import React, { useState } from "react";
import {
  AlertOctagon,
  ShieldCheck,
  Clock,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { IncidentDTO, ApiResponse } from "@/types/api";
import { toast } from "sonner";

async function fetchIncidents(): Promise<IncidentDTO[]> {
  const res = await fetch("/api/v1/monitor/incidents");
  if (!res.ok) return [];
  const json: ApiResponse<IncidentDTO[]> = await res.json();
  return json.data;
}

export default function IncidentsPage() {
  const [filterSeverity, setFilterSeverity] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: incidents = [], refetch } = useQuery<IncidentDTO[]>({
    queryKey: ["incidents"],
    queryFn: fetchIncidents,
    refetchInterval: 10000,
  });

  const filtered = incidents.filter((inc) => {
    if (filterSeverity !== "ALL" && inc.severity !== filterSeverity) return false;
    if (
      searchQuery &&
      !inc.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !inc.incidentNumber.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleCreateIncident = async () => {
    toast.info("Opening new incident...");
    try {
      const res = await fetch("/api/v1/monitor/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Service Latency Degradation Investigation",
          severity: "P2_HIGH",
          impactedService: "ai-groq-primary",
          triggerReason: "Operator initiated triage cycle",
        }),
      });
      if (res.ok) {
        toast.success("Incident created successfully.");
        refetch();
      }
    } catch {
      toast.error("Failed to create incident.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <AlertOctagon className="text-rose-400" size={20} />
            Incident Management Desk
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time incident response, severity SLA tracking, and post-mortems
          </p>
        </div>

        <button
          onClick={handleCreateIncident}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-950/40 transition-all"
        >
          <Plus size={14} />
          <span>Declare Incident</span>
        </button>
      </div>

      {/* SLA Tiers Reference Card */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-[#0b0f19] border border-rose-900/40 p-3 rounded-lg">
          <div className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">
            P1 — Critical Outage
          </div>
          <div className="text-sm font-bold text-white mt-1">15 min SLA</div>
          <div className="text-[10px] text-slate-500">
            Automated SMS + WhatsApp escalation
          </div>
        </div>
        <div className="bg-[#0b0f19] border border-amber-900/40 p-3 rounded-lg">
          <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
            P2 — High Degradation
          </div>
          <div className="text-sm font-bold text-white mt-1">1 Hour SLA</div>
          <div className="text-[10px] text-slate-500">
            Email + Slack Ops Notification
          </div>
        </div>
        <div className="bg-[#0b0f19] border border-blue-900/40 p-3 rounded-lg">
          <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
            P3 — Medium Issue
          </div>
          <div className="text-sm font-bold text-white mt-1">4 Hours SLA</div>
          <div className="text-[10px] text-slate-500">
            SRE dashboard ticket creation
          </div>
        </div>
        <div className="bg-[#0b0f19] border border-slate-800 p-3 rounded-lg">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            P4 — Low / Info
          </div>
          <div className="text-sm font-bold text-white mt-1">24 Hours SLA</div>
          <div className="text-[10px] text-slate-500">
            Next scheduled maintenance window
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0b0f19] border border-[#1a2540] p-3 rounded-xl">
        <div className="relative w-full sm:w-72">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            type="text"
            placeholder="Search incident number, title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#070b14] border border-[#1a2540] rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-slate-700"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          {["ALL", "P1_CRITICAL", "P2_HIGH", "P3_MEDIUM", "P4_LOW"].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                filterSeverity === sev
                  ? "bg-slate-800 text-white font-semibold border border-slate-700"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {sev.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Incident List */}
      <div className="bg-[#0b0f19] border border-[#1a2540] rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            <ShieldCheck size={32} className="text-emerald-400 mx-auto mb-2" />
            <div className="text-slate-300 font-semibold text-sm">
              No Matching Incidents
            </div>
            <div className="text-slate-500 mt-0.5">
              All infrastructure and application services are operating normally.
            </div>
          </div>
        ) : (
          <div className="divide-y divide-[#1a2540]">
            {filtered.map((inc) => (
              <div
                key={inc.id}
                className="p-4 hover:bg-[#070b14] transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-400">
                      {inc.incidentNumber}
                    </span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-rose-950/80 text-rose-400 border border-rose-800/60">
                      {inc.severity}
                    </span>
                    <span className="text-xs font-semibold text-white">
                      {inc.title}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Impacted: <span className="text-slate-200">{inc.impactedService}</span> · Trigger: {inc.triggerReason}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 mt-1 flex items-center gap-3">
                    <span>Opened: {new Date(inc.createdAt).toLocaleString()}</span>
                    <span>Status: {inc.status}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button className="px-3 py-1.5 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-400 hover:bg-emerald-900 text-xs font-medium transition-colors">
                    Resolve
                  </button>
                  <button className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors">
                    View Logs
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
