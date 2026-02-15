// ============ Email Worker ============
// Processes email jobs from the BullMQ email queue

import { Worker, Job } from 'bullmq';
import { sendEmail } from '../services/email.service';
import { getTemplate, type EmailType } from '../templates';
import type { EmailJobData } from '../types';
import { queueConnection } from '../queues';

let emailWorker: Worker<EmailJobData> | null = null;

export function startEmailWorker(): Worker<EmailJobData> {
  if (emailWorker) return emailWorker;

  emailWorker = new Worker<EmailJobData>(
    'email',
    async (job: Job<EmailJobData>) => {
      const { type, to, data } = job.data;

      console.log(`[EmailWorker] Processing job ${job.id}: ${type} to ${to}`);

      // Get template by type
      const template = getTemplate(type as EmailType, data);

      // Send email
      const result = await sendEmail({
        to,
        subject: job.data.subject || template.subject,
        html: template.html,
        text: template.text,
        tags: [
          { name: 'type', value: type },
          { name: 'jobId', value: job.id || 'unknown' },
        ],
      });

      console.log(`[EmailWorker] Sent ${type} to ${to} via ${result.provider} (${result.messageId})`);
      return { sent: true, to, type, provider: result.provider, messageId: result.messageId };
    },
    {
      connection: queueConnection,
      concurrency: 5,
      limiter: {
        max: 100,
        duration: 60_000,
      },
    }
  );

  emailWorker.on('completed', (job) => {
    console.log(`[EmailWorker] ✅ Completed: ${job.data.type} to ${job.data.to}`);
  });

  emailWorker.on('failed', (job, err) => {
    console.error(`[EmailWorker] ❌ Failed: ${job?.data.type} to ${job?.data.to}:`, err.message);
  });

  emailWorker.on('error', (err) => {
    console.error('[EmailWorker] Worker error:', err.message);
  });

  console.log('[EmailWorker] Started with concurrency=5, rate=100/min');
  return emailWorker;
}

export function stopEmailWorker(): Promise<void> {
  if (emailWorker) {
    const w = emailWorker;
    emailWorker = null;
    return w.close();
  }
  return Promise.resolve();
}
