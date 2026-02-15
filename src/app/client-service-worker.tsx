'use client';

import { useServiceWorker } from '@/hooks/use-service-worker';

export default function ClientServiceWorker() {
  useServiceWorker();
  return null;
}