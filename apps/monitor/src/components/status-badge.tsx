"use client";

import type { ServiceStatus } from "@/types/monitor";

interface StatusBadgeProps {
  status: ServiceStatus;
  label?: string;
  size?: "sm" | "md" | "lg";
}

const STATUS_CONFIG = {
  HEALTHY: {
    dotClass: "status-dot-healthy",
    badgeClass: "badge-green",
    label: "HEALTHY",
    color: "#10b981",
  },
  DEGRADED: {
    dotClass: "status-dot-degraded",
    badgeClass: "badge-amber",
    label: "DEGRADED",
    color: "#f59e0b",
  },
  DOWN: {
    dotClass: "status-dot-down",
    badgeClass: "badge-red",
    label: "DOWN",
    color: "#ef4444",
  },
  MAINTENANCE: {
    dotClass: "",
    badgeClass: "badge-gray",
    label: "MAINTENANCE",
    color: "#64748b",
  },
};

export function StatusBadge({ status, label, size = "md" }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.MAINTENANCE;
  const displayLabel = label || config.label;

  if (size === "sm") {
    return (
      <div className="flex items-center gap-1.5">
        <div className={config.dotClass} style={{ width: 8, height: 8 }} />
        <span className="text-xs text-slate-400">{displayLabel}</span>
      </div>
    );
  }

  if (size === "lg") {
    return (
      <div
        className={`badge ${config.badgeClass} text-sm px-4 py-1.5 gap-2`}
      >
        <div className={config.dotClass} style={{ width: 10, height: 10 }} />
        {displayLabel}
      </div>
    );
  }

  return (
    <span className={`badge ${config.badgeClass}`}>
      <div className={config.dotClass} style={{ width: 7, height: 7 }} />
      {displayLabel}
    </span>
  );
}

// ─── Overall System Status Banner ─────────────────────────────────────────────

interface SystemStatusBannerProps {
  servicesHealthy: number;
  servicesTotal: number;
  activeIncidents: number;
  uptimePercent: number;
}

export function SystemStatusBanner({
  servicesHealthy,
  servicesTotal,
  activeIncidents,
  uptimePercent,
}: SystemStatusBannerProps) {
  const allHealthy = servicesHealthy === servicesTotal && activeIncidents === 0;
  const hasDegraded = servicesHealthy < servicesTotal;

  const bannerColor = allHealthy
    ? "border-emerald-800 bg-emerald-950/30"
    : hasDegraded
    ? "border-amber-800 bg-amber-950/30"
    : "border-red-800 bg-red-950/30";

  const textColor = allHealthy
    ? "text-emerald-400"
    : hasDegraded
    ? "text-amber-400"
    : "text-red-400";

  const message = allHealthy
    ? "● ALL SYSTEMS FULLY OPERATIONAL"
    : hasDegraded
    ? `⚠ ${servicesTotal - servicesHealthy} SERVICE(S) DEGRADED`
    : "✕ SYSTEM OUTAGE DETECTED";

  return (
    <div
      className={`border rounded-xl px-6 py-4 flex items-center justify-between ${bannerColor}`}
    >
      <div className={`font-bold text-sm tracking-wide ${textColor}`}>
        OVERALL SYSTEM STATUS: {message}
      </div>
      <div className="flex items-center gap-6 text-xs text-slate-400">
        <span>
          Uptime (30d):{" "}
          <span className="text-white font-semibold">
            {uptimePercent.toFixed(3)}%
          </span>
        </span>
        <span>
          Services:{" "}
          <span className="text-emerald-400 font-semibold">
            {servicesHealthy}/{servicesTotal}
          </span>
        </span>
        {activeIncidents > 0 && (
          <span className="text-red-400 font-semibold">
            {activeIncidents} Active Incident(s)
          </span>
        )}
      </div>
    </div>
  );
}
