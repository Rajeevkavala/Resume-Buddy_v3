// ============ Queue Package Bridge ============
// Re-exports from packages/queue/src for @/ alias imports

export {
  emailQueue,
  whatsappQueue,
  smsQueue,
  aiTaskQueue,
  cleanupQueue,
  notificationQueue,
  queueConnection,
  sendEmail,
  getTemplate,
  startAllWorkers,
  stopAllWorkers,
  startEmailWorker,
  stopEmailWorker,
  startWhatsAppWorker,
  stopWhatsAppWorker,
  startSMSWorker,
  stopSMSWorker,
  queueWelcomeEmail,
  queueAnalysisCompleteEmail,
  queueSubscriptionEmail,
  queueExportReadyEmail,
  queueEmail,
} from '../../packages/queue/src';

export type {
  EmailJobData,
  WhatsAppJobData,
  SMSJobData,
  AITaskJobData,
  CleanupJobData,
  NotificationJobData,
  EmailMessage,
  EmailType,
} from '../../packages/queue/src';
