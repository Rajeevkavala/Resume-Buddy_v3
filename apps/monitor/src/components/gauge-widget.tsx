"use client";

interface GaugeWidgetProps {
  value: number; // 0-100
  label: string;
  sublabel?: string;
  color?: "green" | "amber" | "red" | "blue";
  size?: "sm" | "md" | "lg";
}

const COLORS = {
  green: { stroke: "#10b981", bg: "#0d2a1a", text: "#10b981" },
  amber: { stroke: "#f59e0b", bg: "#2a1d0d", text: "#f59e0b" },
  red: { stroke: "#ef4444", bg: "#2a0d0d", text: "#ef4444" },
  blue: { stroke: "#3b82f6", bg: "#0d1a2a", text: "#3b82f6" },
};

export function GaugeWidget({
  value,
  label,
  sublabel,
  color = "green",
  size = "md",
}: GaugeWidgetProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  // Dynamic color based on value if auto
  const colorKey =
    clampedValue > 90
      ? "red"
      : clampedValue > 75
      ? "amber"
      : color;

  const c = COLORS[colorKey];

  // SVG gauge parameters
  const radius = size === "lg" ? 52 : size === "sm" ? 30 : 40;
  const strokeWidth = size === "lg" ? 8 : size === "sm" ? 5 : 6;
  const cx = radius + strokeWidth;
  const cy = radius + strokeWidth;
  const svgSize = (radius + strokeWidth) * 2;

  // Arc calculation (270° arc from 135° to 405°)
  const startAngle = 135;
  const totalAngle = 270;
  const progressAngle = (clampedValue / 100) * totalAngle;

  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const arcPath = (startDeg: number, endDeg: number) => {
    const start = {
      x: cx + radius * Math.cos(toRad(startDeg)),
      y: cy + radius * Math.sin(toRad(startDeg)),
    };
    const end = {
      x: cx + radius * Math.cos(toRad(endDeg)),
      y: cy + radius * Math.sin(toRad(endDeg)),
    };
    const largeArc = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  };

  const fontSize = size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-xl";

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: svgSize, height: svgSize }}>
        <svg width={svgSize} height={svgSize}>
          {/* Track arc */}
          <path
            d={arcPath(startAngle, startAngle + totalAngle)}
            fill="none"
            stroke="#1a2540"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Progress arc */}
          {clampedValue > 0 && (
            <path
              d={arcPath(startAngle, startAngle + progressAngle)}
              fill="none"
              stroke={c.stroke}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              style={{
                filter: `drop-shadow(0 0 4px ${c.stroke}40)`,
              }}
            />
          )}
        </svg>
        {/* Center value */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ paddingBottom: "8%" }}
        >
          <span
            className={`${fontSize} font-bold tabular-nums`}
            style={{ color: c.text }}
          >
            {clampedValue.toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="text-center">
        <div className="text-xs font-semibold text-slate-300">{label}</div>
        {sublabel && (
          <div className="text-[11px] text-slate-600">{sublabel}</div>
        )}
      </div>
    </div>
  );
}
