/**
 * Request Queue with Concurrency Control
 * Handles up to 500 users with controlled resource usage
 */

type QueuedTask<T> = {
  task: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
  addedAt: number;
};

export class RequestQueue {
  private queue: QueuedTask<unknown>[] = [];
  private activeCount = 0;
  private readonly maxConcurrent: number;
  private readonly maxQueueSize: number;
  private readonly queueTimeoutMs: number;
  private isShuttingDown = false;

  // Stats for monitoring
  private totalProcessed = 0;
  private totalRejected = 0;
  private totalTimedOut = 0;

  constructor(opts?: { maxConcurrent?: number; maxQueueSize?: number; queueTimeoutMs?: number }) {
    // Tune for 1GB RAM droplet - limit concurrent tectonic processes
    this.maxConcurrent = opts?.maxConcurrent ?? 3;
    // Queue up to 50 requests - reject if exceeded (back-pressure)
    this.maxQueueSize = opts?.maxQueueSize ?? 50;
    // Max 30s wait in queue before timeout
    this.queueTimeoutMs = opts?.queueTimeoutMs ?? 30_000;
  }

  get stats() {
    return {
      active: this.activeCount,
      queued: this.queue.length,
      totalProcessed: this.totalProcessed,
      totalRejected: this.totalRejected,
      totalTimedOut: this.totalTimedOut,
      maxConcurrent: this.maxConcurrent,
      maxQueueSize: this.maxQueueSize,
    };
  }

  async enqueue<T>(task: () => Promise<T>): Promise<T> {
    // Reject if shutting down
    if (this.isShuttingDown) {
      this.totalRejected++;
      const err = new Error('Service is shutting down. Please try again.');
      (err as any).code = 'SERVICE_UNAVAILABLE';
      throw err;
    }

    // Reject immediately if queue is full
    if (this.queue.length >= this.maxQueueSize) {
      this.totalRejected++;
      const err = new Error(`Queue full (${this.maxQueueSize} pending). Try again later.`);
      (err as any).code = 'QUEUE_FULL';
      throw err;
    }

    return new Promise<T>((resolve, reject) => {
      const item: QueuedTask<T> = {
        task,
        resolve,
        reject,
        addedAt: Date.now(),
      };

      this.queue.push(item as QueuedTask<unknown>);
      this.processNext();
    });
  }

  private async processNext(): Promise<void> {
    if (this.activeCount >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    const item = this.queue.shift();
    if (!item) return;

    // Check if request timed out while waiting in queue
    const waitTime = Date.now() - item.addedAt;
    if (waitTime > this.queueTimeoutMs) {
      this.totalTimedOut++;
      const err = new Error(`Request timed out after ${waitTime}ms in queue`);
      (err as any).code = 'QUEUE_TIMEOUT';
      item.reject(err);
      // Process next item
      setImmediate(() => this.processNext());
      return;
    }

    this.activeCount++;

    try {
      const result = await item.task();
      this.totalProcessed++;
      item.resolve(result);
    } catch (err) {
      item.reject(err);
    } finally {
      this.activeCount--;
      // Process next item in queue
      setImmediate(() => this.processNext());
    }
  }

  /**
   * Get queue statistics
   */
  getStats() {
    return {
      active: this.activeCount,
      queued: this.queue.length,
      totalProcessed: this.totalProcessed,
      totalRejected: this.totalRejected,
      totalTimedOut: this.totalTimedOut,
      isShuttingDown: this.isShuttingDown,
    };
  }

  /**
   * Graceful shutdown - drain queue and reject new requests
   */
  async shutdown(): Promise<void> {
    this.isShuttingDown = true;
    
    // Reject all queued items
    while (this.queue.length > 0) {
      const item = this.queue.shift();
      if (item) {
        const err = new Error('Service is shutting down');
        (err as any).code = 'SERVICE_UNAVAILABLE';
        item.reject(err);
      }
    }

    // Wait for active tasks to complete (with timeout)
    const maxWait = 30_000;
    const start = Date.now();
    while (this.activeCount > 0 && Date.now() - start < maxWait) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Reset shutdown state (for testing)
   */
  reset(): void {
    this.isShuttingDown = false;
  }
}

// Singleton instance for the service
export const compileQueue = new RequestQueue({
  // Conservative concurrency for 1GB RAM
  // Each tectonic process can use 100-300MB
  maxConcurrent: 3,
  // Allow 50 queued requests (~15s each = ~250s max wait)
  maxQueueSize: 50,
  // Timeout after 30s in queue
  queueTimeoutMs: 30_000,
});
