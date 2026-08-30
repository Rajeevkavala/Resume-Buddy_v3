"use client";

// =============================================================================
// Resume Buddy Monitor v2 — Realtime Telemetry Charts
// =============================================================================

import React, { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface TelemetryPoint {
  time: string;
  latency: number;
  cpu: number;
  requests: number;
}

const SAMPLE_DATA: TelemetryPoint[] = [
  { time: "18:00", latency: 28, cpu: 12.1, requests: 110 },
  { time: "18:15", latency: 32, cpu: 14.5, requests: 145 },
  { time: "18:30", latency: 35, cpu: 13.8, requests: 130 },
  { time: "18:45", latency: 42, cpu: 18.2, requests: 190 },
  { time: "19:00", latency: 38, cpu: 15.1, requests: 160 },
  { time: "19:15", latency: 30, cpu: 12.9, requests: 125 },
  { time: "19:30", latency: 34, cpu: 14.0, requests: 140 },
  { time: "19:45", latency: 31, cpu: 13.2, requests: 135 },
];

export function RealtimeChartsPanel() {
  const [activeTab, setActiveTab] = useState<"latency" | "cpu" | "traffic">(
    "latency"
  );

  return (
    <div className="bg-[#0b0f19] border border-[#1a2540] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Realtime Telemetry & Resource Trends
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Rollup aggregation: 1m · Retention: 7 days
          </p>
        </div>

        {/* Tab Filter */}
        <div className="flex items-center gap-1 bg-[#070b14] p-1 rounded-lg border border-[#1a2540] text-xs">
          <button
            onClick={() => setActiveTab("latency")}
            className={`px-2.5 py-1 rounded-md transition-all font-medium ${
              activeTab === "latency"
                ? "bg-slate-800 text-purple-400 font-semibold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            p95 Latency
          </button>
          <button
            onClick={() => setActiveTab("cpu")}
            className={`px-2.5 py-1 rounded-md transition-all font-medium ${
              activeTab === "cpu"
                ? "bg-slate-800 text-blue-400 font-semibold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            EC2 CPU %
          </button>
          <button
            onClick={() => setActiveTab("traffic")}
            className={`px-2.5 py-1 rounded-md transition-all font-medium ${
              activeTab === "traffic"
                ? "bg-slate-800 text-emerald-400 font-semibold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Requests / min
          </button>
        </div>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={SAMPLE_DATA}>
            <defs>
              <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1a2540" />
            <XAxis
              dataKey="time"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
            />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#070b14",
                borderColor: "#1a2540",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />

            {activeTab === "latency" && (
              <Area
                type="monotone"
                dataKey="latency"
                stroke="#a855f7"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#latencyGradient)"
                name="Latency (ms)"
              />
            )}
            {activeTab === "cpu" && (
              <Area
                type="monotone"
                dataKey="cpu"
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#cpuGradient)"
                name="CPU Utilization (%)"
              />
            )}
            {activeTab === "traffic" && (
              <Area
                type="monotone"
                dataKey="requests"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#trafficGradient)"
                name="Requests / min"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
