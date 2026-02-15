// ============ Notification Send API ============
// POST /api/notifications/send — Queue a notification for delivery

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const sendSchema = z.object({
  channel: z.enum(['email', 'whatsapp', 'sms']),
  to: z.string().min(1),
  type: z.string().min(1),
  data: z.record(z.unknown()).optional().default({}),
  subject: z.string().optional(),
  message: z.string().optional(), // for WhatsApp/SMS
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = sendSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { channel, to, type, data, subject, message } = parsed.data;

    // Dynamically import queue to avoid loading Redis on every API hit
    const { emailQueue, whatsappQueue, smsQueue } = await import(
      '@/lib/queue'
    );

    let job;

    switch (channel) {
      case 'email':
        job = await emailQueue.add(type, { type: type as any, to, data, subject });
        break;

      case 'whatsapp':
        if (!message) {
          return NextResponse.json(
            { error: 'VALIDATION_ERROR', details: { message: 'message is required for WhatsApp' } },
            { status: 400 }
          );
        }
        job = await whatsappQueue.add(type, { type: type as any, phone: to, message, templateId: type });
        break;

      case 'sms':
        if (!message) {
          return NextResponse.json(
            { error: 'VALIDATION_ERROR', details: { message: 'message is required for SMS' } },
            { status: 400 }
          );
        }
        job = await smsQueue.add(type, { type: type as any, phone: to, message });
        break;
    }

    return NextResponse.json({
      success: true,
      channel,
      jobId: job?.id,
      message: `Notification queued for delivery via ${channel}`,
    });
  } catch (error) {
    console.error('[Notification API] Error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
