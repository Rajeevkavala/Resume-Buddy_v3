import type { ProbeResult } from "@/types/monitor";

const BACKEND_URL = process.env.PROBE_TARGET_BACKEND_URL || "https://api.resume-buddy.tech";

export async function runWebSocketProbe(): Promise<ProbeResult> {
  const start = Date.now();
  try {
    // Socket.io polling handshake — HTTP long-polling transport
    const res = await fetch(
      `${BACKEND_URL}/socket.io/?EIO=4&transport=polling`,
      {
        method: "GET",
        signal: AbortSignal.timeout(3000),
        cache: "no-store",
      }
    );

    const latency = Date.now() - start;
    const body = await res.text().catch(() => "");

    // Socket.io handshake returns a JSON payload with sid
    const hasSid = body.includes("sid") || body.includes('"sid"');
    const isDegraded = latency > 600;

    if (!res.ok || !hasSid) {
      return {
        serviceKey: "websocket-gateway",
        serviceName: "WebSocket Gateway",
        status: "DOWN",
        latencyMs: latency,
        statusCode: res.status,
        errorMessage: `Handshake failed: ${res.status}`,
        checkedAt: new Date(),
      };
    }

    return {
      serviceKey: "websocket-gateway",
      serviceName: "WebSocket Gateway",
      status: isDegraded ? "DEGRADED" : "HEALTHY",
      latencyMs: latency,
      statusCode: 200,
      metadata: { handshakeOk: hasSid },
      checkedAt: new Date(),
    };
  } catch (error) {
    return {
      serviceKey: "websocket-gateway",
      serviceName: "WebSocket Gateway",
      status: "DOWN",
      latencyMs: Date.now() - start,
      errorMessage: error instanceof Error ? error.message : "Probe failed",
      checkedAt: new Date(),
    };
  }
}
