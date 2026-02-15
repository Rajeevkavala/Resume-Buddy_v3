// ============ BullMQ Queue Definitions ============
import { Queue } from 'bullmq';
import type { EmailJobData, WhatsAppJobData, SMSJobData, AITaskJobData, CleanupJobData, NotificationJobData } from './types';

// ============ Redis Connection ============

function getConnection() {
  const host = process.env.REDIS_HOST || 'localhost';
  const port = parseInt(process.env.REDIS_PORT || '6379', 10);
  const password = process.env.REDIS_PASSWORD || undefined;

  // Parse from REDIS_URL if available
  if (process.env.REDIS_URL) {
    try {
      const url = new URL(process.env.REDIS_URL);
      return {
        host: url.hostname,
        port: parseInt(url.port || '6379', 10),
        password: url.password || undefined,
      };
    } catch {
      // Fallback to individual vars
    }
  }

  return { host, port, password };
}

const connection = getConnection();

// ============ Queue Definitions ============

export const emailQueue = new Queue<EmailJobData>('email', {
  connection,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
  },
});

export const whatsappQueue = new Queue<WhatsAppJobData>('whatsapp', {
  connection,
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 50,
    attempts: 2,
    backoff: { type: 'exponential', delay: 5000 },
  },
});

export const smsQueue = new Queue<SMSJobData>('sms', {
  connection,
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 50,
    attempts: 2,
    backoff: { type: 'exponential', delay: 5000 },
  },
});

export const aiTaskQueue = new Queue<AITaskJobData>('ai-tasks', {
  connection,
  defaultJobOptions: {
    removeOnComplete: 200,
    removeOnFail: 100,
    attempts: 2,
    backoff: { type: 'exponential', delay: 10000 },
  },
});

export const cleanupQueue = new Queue<CleanupJobData>('cleanup', {
  connection,
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 5,
  },
});

export const notificationQueue = new Queue<NotificationJobData>('notifications', {
  connection,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
  },
});

// ============ Helper: Get Connection Config ============

export { connection as queueConnection };
