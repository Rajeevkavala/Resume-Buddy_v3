import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * CloudWatch SNS Webhook Receiver
 * AWS → SNS → HTTP Subscription → This endpoint
 * Handles: SubscriptionConfirmation, Notification (Alarm state changes)
 */
export async function POST(request: NextRequest) {
  const messageType = request.headers.get("x-amz-sns-message-type") || "";
  const body = await request.text();

  let message: Record<string, unknown>;
  try {
    message = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // ─── SNS Subscription Confirmation ────────────────────────────────────────

  if (messageType === "SubscriptionConfirmation") {
    const subscribeUrl = message.SubscribeURL as string;
    if (subscribeUrl) {
      // Auto-confirm the SNS subscription
      await fetch(subscribeUrl).catch(console.error);
      console.log("[CloudWatch Ingest] SNS subscription confirmed");
    }
    return NextResponse.json({ ok: true, message: "Subscription confirmed" });
  }

  // ─── SNS Alarm Notification ────────────────────────────────────────────────

  if (messageType === "Notification") {
    let alarmMessage: Record<string, unknown>;
    try {
      alarmMessage = JSON.parse(message.Message as string);
    } catch {
      return NextResponse.json({ error: "Invalid alarm message" }, { status: 400 });
    }

    const alarmName = alarmMessage.AlarmName as string;
    const newState = alarmMessage.NewStateValue as string;
    const oldState = alarmMessage.OldStateValue as string;
    const reason = alarmMessage.NewStateReason as string;

    console.log(`[CloudWatch Ingest] Alarm: ${alarmName} ${oldState} → ${newState}`);

    // Store the alarm event
    try {
      const { PrismaClient } = await import("@prisma/client");
      const prisma = new PrismaClient();
      await prisma.monitorCloudWatchAlarmEvent.create({
        data: { alarmName, oldState, newState, reason },
      });
      await prisma.$disconnect();
    } catch (e) {
      console.error("[CloudWatch Ingest] DB write failed:", e);
    }

    // Broadcast via SSE
    const { broadcast } = await import("@/lib/sse/sse-hub");
    broadcast({
      type: "cloudwatch-alarm",
      data: { alarmName, oldState, newState, reason, timestamp: new Date().toISOString() },
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, alarmName, newState });
  }

  return NextResponse.json({ ok: true });
}
