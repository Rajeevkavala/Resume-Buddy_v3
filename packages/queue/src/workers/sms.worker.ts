// ============ SMS Worker ============
// Processes SMS notification jobs from the BullMQ queue

import { Worker, Job } from 'bullmq';
import type { SMSJobData } from '../types';
import { queueConnection } from '../queues';

let smsWorker: Worker<SMSJobData> | null = null;

async function sendSMS(phone: string, message: string): Promise<{ messageId: string; provider: string }> {
  const provider = process.env.SMS_PROVIDER || 'twilio';

  if (process.env.NODE_ENV === 'development') {
    console.log(`[SMS-DEV] To: ${phone}, Message: ${message}`);
    return { messageId: `dev_sms_${Date.now()}`, provider: 'console' };
  }

  if (provider === 'twilio') {
    const accountSid = process.env.TWILIO_ACCOUNT_SID!;
    const authToken = process.env.TWILIO_AUTH_TOKEN!;
    const fromNumber = process.env.TWILIO_SMS_FROM || process.env.TWILIO_PHONE_NUMBER!;

    const body = new URLSearchParams({
      From: fromNumber,
      To: phone,
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
      throw new Error(`Twilio SMS error: ${res.status} ${errBody}`);
    }

    const data = await res.json();
    return { messageId: data.sid, provider: 'twilio' };
  }

  if (provider === 'msg91') {
    const authKey = process.env.MSG91_AUTH_KEY!;
    const senderId = process.env.MSG91_SENDER_ID || 'RBUDDY';
    const templateId = process.env.MSG91_TEMPLATE_ID!;

    const res = await fetch('https://control.msg91.com/api/v5/flow/', {
      method: 'POST',
      headers: {
        authkey: authKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        template_id: templateId,
        sender: senderId,
        short_url: '0',
        mobiles: phone.replace('+', ''),
        message: message,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`MSG91 error: ${res.status} ${errBody}`);
    }

    const data = await res.json();
    return { messageId: data.request_id || data.message, provider: 'msg91' };
  }

  throw new Error(`Unknown SMS provider: ${provider}`);
}

export function startSMSWorker(): Worker<SMSJobData> {
  if (smsWorker) return smsWorker;

  smsWorker = new Worker<SMSJobData>(
    'sms',
    async (job: Job<SMSJobData>) => {
      const { phone, message } = job.data;
      console.log(`[SMSWorker] Processing job ${job.id}: to ${phone}`);

      const result = await sendSMS(phone, message);

      console.log(`[SMSWorker] Sent to ${phone} via ${result.provider} (${result.messageId})`);
      return { sent: true, phone, provider: result.provider, messageId: result.messageId };
    },
    {
      connection: queueConnection,
      concurrency: 2,
      limiter: {
        max: 50,
        duration: 60_000,
      },
    }
  );

  smsWorker.on('completed', (job) => {
    console.log(`[SMSWorker] ✅ Completed: to ${job.data.phone}`);
  });

  smsWorker.on('failed', (job, err) => {
    console.error(`[SMSWorker] ❌ Failed: to ${job?.data.phone}:`, err.message);
  });

  smsWorker.on('error', (err) => {
    console.error('[SMSWorker] Worker error:', err.message);
  });

  console.log('[SMSWorker] Started with concurrency=2, rate=50/min');
  return smsWorker;
}

export function stopSMSWorker(): Promise<void> {
  if (smsWorker) {
    const w = smsWorker;
    smsWorker = null;
    return w.close();
  }
  return Promise.resolve();
}
