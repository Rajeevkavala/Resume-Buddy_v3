// ============ Worker Orchestrator ============
// Start/stop all BullMQ workers from a single entrypoint

import { startEmailWorker, stopEmailWorker } from './email.worker';
import { startWhatsAppWorker, stopWhatsAppWorker } from './whatsapp.worker';
import { startSMSWorker, stopSMSWorker } from './sms.worker';

export { startEmailWorker, stopEmailWorker } from './email.worker';
export { startWhatsAppWorker, stopWhatsAppWorker } from './whatsapp.worker';
export { startSMSWorker, stopSMSWorker } from './sms.worker';

export function startAllWorkers() {
  console.log('[Workers] Starting all notification workers...');
  const email = startEmailWorker();
  const whatsapp = startWhatsAppWorker();
  const sms = startSMSWorker();
  console.log('[Workers] All notification workers started.');
  return { email, whatsapp, sms };
}

export async function stopAllWorkers() {
  console.log('[Workers] Stopping all notification workers...');
  await Promise.all([
    stopEmailWorker(),
    stopWhatsAppWorker(),
    stopSMSWorker(),
  ]);
  console.log('[Workers] All notification workers stopped.');
}
