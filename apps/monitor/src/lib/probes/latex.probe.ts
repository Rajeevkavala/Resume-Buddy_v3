import type { ProbeResult } from "@/types/monitor";

const BACKEND_URL = process.env.PROBE_TARGET_BACKEND_URL || "https://api.resume-buddy.tech";

export async function runLatexProbe(): Promise<ProbeResult> {
  const start = Date.now();
  try {
    const res = await fetch(`${BACKEND_URL}/healthz`, {
      method: "GET",
      signal: AbortSignal.timeout(2500),
      cache: "no-store",
    });

    const latency = Date.now() - start;

    if (!res.ok) {
      return {
        serviceKey: "latex-service",
        serviceName: "LaTeX Engine (Fastify)",
        status: "DOWN",
        latencyMs: latency,
        statusCode: res.status,
        errorMessage: `HTTP ${res.status}`,
        checkedAt: new Date(),
      };
    }

    const body = await res.json().catch(() => ({}));
    const isDegraded = latency > 800;
    const isDown = !body?.uptime && body?.uptime !== 0;

    // Extract compile duration from Server-Timing header if present
    const serverTiming = res.headers.get("server-timing");
    let compileDuration: number | undefined;
    if (serverTiming) {
      const match = serverTiming.match(/compile;dur=([\d.]+)/);
      if (match) compileDuration = parseFloat(match[1]);
    }

    return {
      serviceKey: "latex-service",
      serviceName: "LaTeX Engine (Fastify)",
      status: isDown ? "DOWN" : isDegraded ? "DEGRADED" : "HEALTHY",
      latencyMs: latency,
      statusCode: 200,
      metadata: {
        uptime: body.uptime,
        version: body.version,
        compileDurationMs: compileDuration,
      },
      checkedAt: new Date(),
    };
  } catch (error) {
    return {
      serviceKey: "latex-service",
      serviceName: "LaTeX Engine (Fastify)",
      status: "DOWN",
      latencyMs: Date.now() - start,
      errorMessage: error instanceof Error ? error.message : "Probe failed",
      checkedAt: new Date(),
    };
  }
}
