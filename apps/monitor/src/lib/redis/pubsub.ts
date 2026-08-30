// =============================================================================
// Resume Buddy Monitor v2 — Redis Pub/Sub Event Bus
// =============================================================================

import { getRedisPubClient, getRedisSubClient } from "./client";
import type { SSEBroadcastEvent } from "@/types/api";

const EVENT_CHANNEL = "monitor:events";

export async function publishMonitorEvent(
  event: SSEBroadcastEvent
): Promise<number> {
  try {
    const pub = getRedisPubClient();
    return await pub.publish(EVENT_CHANNEL, JSON.stringify(event));
  } catch (err) {
    if (process.env.NODE_ENV !== "test") {
      console.warn("[Monitor:PubSub] Publish failed:", err);
    }
    return 0;
  }
}

export function subscribeToMonitorEvents(
  handler: (event: SSEBroadcastEvent) => void
): () => void {
  try {
    const sub = getRedisSubClient();
    sub.subscribe(EVENT_CHANNEL, (err) => {
      if (err && process.env.NODE_ENV !== "test") {
        console.warn("[Monitor:PubSub] Subscribe error:", err);
      }
    });

    const onMessage = (channel: string, message: string) => {
      if (channel === EVENT_CHANNEL) {
        try {
          const parsed = JSON.parse(message) as SSEBroadcastEvent;
          handler(parsed);
        } catch {}
      }
    };

    sub.on("message", onMessage);

    return () => {
      sub.removeListener("message", onMessage);
    };
  } catch {
    return () => {};
  }
}
