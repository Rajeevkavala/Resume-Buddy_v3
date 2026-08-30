"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { format } from "date-fns";

interface DataPoint {
  timestamp: Date | string | number;
  [key: string]: number | Date | string;
}

interface CloudWatchChartProps {
  data: DataPoint[];
  metrics: Array<{
    key: string;
    label: string;
    color: string;
    unit?: string;
  }>;
  title?: string;
  type?: "area" | "line";
  height?: number;
  unit?: string;
}

const CustomTooltip = ({
  active,
  payload,
  label,
  unit,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string; unit?: string }>;
  label?: string;
  unit?: string;
}) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-[#111b30] border border-[#1a2540] rounded-lg p-3 text-xs shadow-xl">
      <div className="text-slate-400 mb-2 font-mono">{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: p.color }}
          />
          <span className="text-slate-400">{p.name}:</span>
          <span className="font-semibold" style={{ color: p.color }}>
            {typeof p.value === "number" ? p.value.toFixed(1) : p.value}
            {p.unit || unit || ""}
          </span>
        </div>
      ))}
    </div>
  );
};

export function CloudWatchChart({
  data,
  metrics,
  title,
  type = "area",
  height = 200,
  unit,
}: CloudWatchChartProps) {
  const formatted = data.map((d) => ({
    ...d,
    _time:
      d.timestamp instanceof Date
        ? format(d.timestamp, "HH:mm")
        : typeof d.timestamp === "number"
        ? format(new Date(d.timestamp), "HH:mm")
        : String(d.timestamp),
  }));

  const ChartComponent = type === "area" ? AreaChart : LineChart;
  const DataComponent = type === "area" ? Area : Line;

  return (
    <div className="monitor-card">
      {title && (
        <div className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">
          {title}
        </div>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <ChartComponent data={formatted} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            {metrics.map((m) => (
              <linearGradient key={m.key} id={`grad-${m.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={m.color} stopOpacity={0.15} />
                <stop offset="95%" stopColor={m.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a2540" />
          <XAxis
            dataKey="_time"
            tick={{ fill: "#475569", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "#1a2540" }}
          />
          <YAxis
            tick={{ fill: "#475569", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            content={<CustomTooltip unit={unit} />}
          />
          <Legend
            wrapperStyle={{ fontSize: "11px", color: "#64748b" }}
          />
          {metrics.map((m) =>
            type === "area" ? (
              <Area
                key={m.key}
                type="monotone"
                dataKey={m.key}
                name={m.label}
                stroke={m.color}
                strokeWidth={2}
                fill={`url(#grad-${m.key})`}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            ) : (
              <Line
                key={m.key}
                type="monotone"
                dataKey={m.key}
                name={m.label}
                stroke={m.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            )
          )}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Sparkline (mini chart for stat cards) ────────────────────────────────────

export function Sparkline({
  data,
  color = "#10b981",
  height = 40,
}: {
  data: number[];
  color?: string;
  height?: number;
}) {
  const formatted = data.map((v, i) => ({ i, v }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={formatted} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.2} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={1.5}
          fill="url(#sparkGrad)"
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
