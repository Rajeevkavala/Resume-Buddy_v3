// =============================================================================
// Resume Buddy Monitor v2 — API: GET /api/v1/monitor/stream (SSE)
// Real-time Event Stream subscribed to Redis Pub/Sub
// =============================================================================

import { NextRequest } from "next/server";
import { getLiveSummary } from "@/lib/redis/live-state";
import { subscribeToMonitorEvents } from "@/lib/redis/pubsub";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let isClosed = false;

      const safeEnqueue = (data: string) => {
        if (!isClosed) {
          try {
            controller.enqueue(encoder.encode(data));
          } catch {
            isClosed = true;
          }
        }
      };

      // Push initial cached summary immediately
      const initialSummary = await getLiveSummary();
      if (initialSummary) {
        safeEnqueue(
          `event: summary-update\ndata: ${JSON.stringify(initialSummary)}\n\n`
        );
      }

      // 10s Heartbeat loop
      const heartbeatInterval = setInterval(() => {
        if (isClosed) {
          clearInterval(heartbeatInterval);
          return;
        }
        safeEnqueue(
          `event: heartbeat\ndata: ${JSON.stringify({ ts: Date.now() })}\n\n`
        );
      }, 10000);

      // Subscribe to Redis Pub/Sub events
      const unsubscribe = subscribeToMonitorEvents((event) => {
        if (isClosed) return;
        safeEnqueue(
          `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`
        );
      });

      const cleanup = () => {
        if (!isClosed) {
          isClosed = true;
          clearInterval(heartbeatInterval);
          try {
            unsubscribe();
          } catch {}
          try {
            controller.close();
          } catch {}
        }
      };

      req.signal.addEventListener("abort", cleanup);
    },
    cancel() {
      // Called when consumer cancels or disconnects
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
