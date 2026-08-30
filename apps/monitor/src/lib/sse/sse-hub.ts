import type { SSEEvent } from "@/types/monitor";

type SSEController = ReadableStreamDefaultController<Uint8Array>;

// Global registry of active SSE connections
const connections = new Set<SSEController>();

// ─── Subscribe / Unsubscribe ──────────────────────────────────────────────────

export function subscribe(controller: SSEController): () => void {
  connections.add(controller);
  console.log(`[SSE Hub] Client connected. Total: ${connections.size}`);

  return () => {
    connections.delete(controller);
    console.log(`[SSE Hub] Client disconnected. Total: ${connections.size}`);
  };
}

// ─── Broadcast to all connected clients ──────────────────────────────────────

export function broadcast(event: SSEEvent): void {
  if (connections.size === 0) return;

  const payload = `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
  const encoded = new TextEncoder().encode(payload);

  const dead = new Set<SSEController>();
  for (const controller of connections) {
    try {
      controller.enqueue(encoded);
    } catch {
      // Connection closed
      dead.add(controller);
    }
  }

  // Clean up dead connections
  for (const d of dead) {
    connections.delete(d);
  }
}

// ─── Send Heartbeat ───────────────────────────────────────────────────────────

export function sendHeartbeat(): void {
  broadcast({
    type: "heartbeat",
    data: { connections: connections.size, timestamp: new Date().toISOString() },
    timestamp: new Date().toISOString(),
  });
}

// ─── Get connection count ─────────────────────────────────────────────────────

export function getConnectionCount(): number {
  return connections.size;
}
