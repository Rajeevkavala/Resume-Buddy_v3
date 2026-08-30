"use client";

// =============================================================================
// Resume Buddy Monitor v2 — Mission Control Real-time Client View
// =============================================================================

import React, { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { TopMetricsBar } from "@/components/mission-control/top-metrics-bar";
import { ServiceHealthMatrix } from "@/components/mission-control/service-health-matrix";
import { LiveAlertsPanel } from "@/components/mission-control/live-alerts-panel";
import { IncidentTimelinePanel } from "@/components/mission-control/incident-timeline-panel";
import { AIMatrixPanel } from "@/components/mission-control/ai-matrix-panel";
import { RealtimeChartsPanel } from "@/components/mission-control/realtime-charts-panel";
import type { MonitorSummaryDTO, ApiResponse, AlertEventDTO, IncidentDTO } from "@/types/api";

async function fetchSummary(): Promise<MonitorSummaryDTO> {
  const res = await fetch("/api/v1/monitor/summary");
  if (!res.ok) throw new Error("Failed to fetch monitor summary");
  const json: ApiResponse<MonitorSummaryDTO> = await res.json();
  return json.data;
}

export function OverviewClient({
  initialSummary,
}: {
  initialSummary?: MonitorSummaryDTO;
}) {
  const queryClient = useQueryClient();

  const { data: summary } = useQuery<MonitorSummaryDTO>({
    queryKey: ["monitor-summary"],
    queryFn: fetchSummary,
    initialData: initialSummary,
    refetchInterval: 15000,
  });

  // Subscribe to real-time SSE stream for instant push updates
  useEffect(() => {
    const es = new EventSource("/api/v1/monitor/stream");

    es.addEventListener("summary-update", (e) => {
      try {
        const updated = JSON.parse(e.data) as MonitorSummaryDTO;
        queryClient.setQueryData(["monitor-summary"], updated);
      } catch {}
    });

    es.addEventListener("health-update", () => {
      queryClient.invalidateQueries({ queryKey: ["monitor-summary"] });
    });

    return () => {
      es.close();
    };
  }, [queryClient]);

  const activeAlerts: AlertEventDTO[] = [];
  const activeIncidents: IncidentDTO[] = [];

  return (
    <div className="space-y-6">
      {/* 10 Core Top Metrics */}
      <TopMetricsBar summary={summary} />

      {/* Realtime Service Health Matrix */}
      <ServiceHealthMatrix services={summary?.services ?? []} />

      {/* Multi-Tier AI Provider Matrix */}
      <AIMatrixPanel aiStats={summary?.aiStats} />

      {/* Mid-Tier Panels: Alerts, Incidents & Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LiveAlertsPanel alerts={activeAlerts} />
        <IncidentTimelinePanel incidents={activeIncidents} />
      </div>

      {/* Realtime Charts */}
      <RealtimeChartsPanel />
    </div>
  );
}
