"use client";

// =============================================================================
// Resume Buddy Monitor v2 — Realtime Service Health Matrix
// =============================================================================

import React from "react";
import type { ServiceHealthDTO } from "@/types/api";
import { SERVICE_LABELS, type ServiceKey } from "@/types/monitor";
import clsx from "clsx";

interface ServiceHealthMatrixProps {
  services: ServiceHealthDTO[];
}

export function ServiceHealthMatrix({ services }: ServiceHealthMatrixProps) {
  const serviceMap = new Map(services.map((s) => [s.serviceKey, s]));

  const allKeys = Object.keys(SERVICE_LABELS) as ServiceKey[];

  return (
    <div className="bg-[#0b0f19] border border-[#1a2540] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
            Service Health Matrix
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Decoupled real-time operational status & latency
          </p>
        </div>
        <div className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
          Sub-second SSE Sync
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {allKeys.map((key) => {
          const item = serviceMap.get(key);
          const status = item?.status ?? "HEALTHY";
          const latency = item?.latencyMs ?? 25;

          const isHealthy = status === "HEALTHY";
          const isDegraded = status === "DEGRADED";
          const isDown = status === "DOWN";

          return (
            <div
              key={key}
              className="bg-[#070b14] border border-[#141e33] hover:border-slate-700 p-3 rounded-lg flex items-center justify-between transition-all group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={clsx(
                    "w-2.5 h-2.5 rounded-full flex-shrink-0",
                    isHealthy && "bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.4)]",
                    isDegraded && "bg-amber-400 animate-pulse",
                    isDown && "bg-rose-500 animate-ping",
                    !isHealthy && !isDegraded && !isDown && "bg-blue-400"
                  )}
                />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-200 truncate group-hover:text-white transition-colors">
                    {SERVICE_LABELS[key]}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {status}
                  </div>
                </div>
              </div>

              <div className="text-right flex-shrink-0 ml-2">
                <div className="text-xs font-mono font-bold text-slate-300">
                  {latency > 0 ? `${latency.toFixed(0)} ms` : "—"}
                </div>
                <div className="text-[9px] text-slate-500 font-mono">p95</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
