// ============ WhatsApp Worker ============
// Processes WhatsApp notification jobs from the BullMQ queue

import { Worker, Job } from 'bullmq';
import type { WhatsAppJobData } from '../types';
import { queueConnection } from '../queues';

let whatsappWorker: Worker<WhatsAppJobData> | null = null;

async function sendWhatsAppMessage(phone: string, message: string, templateId?: string): Promise<{ messageId: string; provider: string }> {
  const provider = process.env.WHATSAPP_PROVIDER || 'twilio';

  if (process.env.NODE_ENV === 'development') {
    console.log(`[WhatsApp-DEV] To: ${phone}, Message: ${message.substring(0, 100)}...`);
    return { messageId: `dev_wa_${Date.now()}`, provider: 'console' };
  }

  if (provider === 'twilio') {
    const accountSid = process.env.TWILIO_ACCOUNT_SID!;
    const authToken = process.env.TWILIO_AUTH_TOKEN!;
    const fromNumber = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

    const body = new URLSearchParams({
      From: fromNumber,
      To: `whatsapp:${phone}`,
      Body: message,
    });

    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      }
    );

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Twilio WhatsApp error: ${res.status} ${errBody}`);
    }

    const data = await res.json();
    return { messageId: data.sid, provider: 'twilio' };
  }

  if (provider === 'gupshup') {
    const apiKey = process.env.GUPSHUP_API_KEY!;
    const sourcePhone = process.env.GUPSHUP_SOURCE_PHONE!;
    const appName = process.env.GUPSHUP_APP_NAME || 'ResumeBuddy';

    const body = new URLSearchParams({
      channel: 'whatsapp',
      source: sourcePhone,
      destination: phone,
      message: JSON.stringify({ type: 'text', text: message }),
      'src.name': appName,
    });

    const res = await fetch('https://api.gupshup.io/sm/api/v1/msg', {
      method: 'POST',
      headers: {
        apikey: apiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Gupshup error: ${res.status} ${errBody}`);
    }

    const data = await res.json();
    return { messageId: data.messageId || data.id, provider: 'gupshup' };
  }

  throw new Error(`Unknown WhatsApp provider: ${provider}`);
}

export function startWhatsAppWorker(): Worker<WhatsAppJobData> {
  if (whatsappWorker) return whatsappWorker;

  whatsappWorker = new Worker<WhatsAppJobData>(
    'whatsapp',
    async (job: Job<WhatsAppJobData>) => {
      const { phone, message, templateId } = job.data;
      console.log(`[WhatsAppWorker] Processing job ${job.id}: to ${phone}`);

      const result = await sendWhatsAppMessage(phone, message, templateId);

      console.log(`[WhatsAppWorker] Sent to ${phone} via ${result.provider} (${result.messageId})`);
      return { sent: true, phone, provider: result.provider, messageId: result.messageId };
    },
    {
      connection: queueConnection,
      concurrency: 2,
      limiter: {
        max: 30,
        duration: 60_000,
      },
    }
  );

  whatsappWorker.on('completed', (job) => {
    console.log(`[WhatsAppWorker] ✅ Completed: to ${job.data.phone}`);
  });

  whatsappWorker.on('failed', (job, err) => {
    console.error(`[WhatsAppWorker] ❌ Failed: to ${job?.data.phone}:`, err.message);
  });

  whatsappWorker.on('error', (err) => {
    console.error('[WhatsAppWorker] Worker error:', err.message);
  });

  console.log('[WhatsAppWorker] Started with concurrency=2, rate=30/min');
  return whatsappWorker;
}

export function stopWhatsAppWorker(): Promise<void> {
  if (whatsappWorker) {
    const w = whatsappWorker;
    whatsappWorker = null;
    return w.close();
  }
  return Promise.resolve();
}
