/**
 * Request Queue System for High-Traffic Handling
 * Manages concurrent AI requests to prevent overload
 * Optimized for 250+ concurrent users
 */

interface QueuedRequest<T> {
  id: string;
  execute: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
  priority: number;
  timestamp: number;
  userId: string;
  operation: string;
}

interface QueueConfig {
  maxConcurrent: number;
  maxQueueSize: number;
  requestTimeout: number;
  priorityBoost: number;
}

// Queue configuration optimized for 250+ users with AI provider limits
const QUEUE_CONFIG: QueueConfig = {
  maxConcurrent: 15,        // Max concurrent AI requests (respects provider limits)
  maxQueueSize: 500,        // Max queued requests (250 users × 2 requests buffer)
  requestTimeout: 60000,    // 60 second timeout per request
  priorityBoost: 1000,      // Priority boost per waiting second
};

// Operation-specific concurrency limits
const OPERATION_LIMITS: Record<string, number> = {
  'analyze-resume': 5,      // Expensive operation
  'improve-resume': 5,      // Expensive operation  
  'generate-questions': 4,  // Medium complexity
  'generate-qa': 4,         // Medium complexity
  'parse-resume': 8,        // Fast operation
  'default': 10,
};

class RequestQueue {
  private queue: QueuedRequest<unknown>[] = [];
  private activeRequests = new Map<string, number>(); // operation -> count
  private totalActive = 0;
  private stats = {
    totalProcessed: 0,
    totalQueued: 0,
    totalRejected: 0,
    averageWaitTime: 0,
    peakConcurrency: 0,
  };

  /**
   * Add request to queue with priority handling
   */
  async enqueue<T>(
    userId: string,
    operation: string,
    execute: () => Promise<T>,
    priority: number = 0
  ): Promise<T> {
    // Check queue capacity
    if (this.queue.length >= QUEUE_CONFIG.maxQueueSize) {
      this.stats.totalRejected++;
      throw new Error('Service temporarily at capacity. Please try again in a few moments.');
    }

    return new Promise<T>((resolve, reject) => {
      const request: QueuedRequest<T> = {
        id: `${userId}-${operation}-${Date.now()}`,
        execute,
        resolve: resolve as (value: unknown) => void,
        reject,
        priority,
        timestamp: Date.now(),
        userId,
        operation,
      };

      this.queue.push(request as QueuedRequest<unknown>);
      this.stats.totalQueued++;
      this.sortQueue();
      this.processQueue();
    });
  }

  /**
   * Sort queue by priority (higher first) and age (older first)
   */
  private sortQueue(): void {
    const now = Date.now();
    this.queue.sort((a, b) => {
      // Calculate effective priority (base priority + time waiting bonus)
      const aPriority = a.priority + Math.floor((now - a.timestamp) / 1000) * QUEUE_CONFIG.priorityBoost;
      const bPriority = b.priority + Math.floor((now - b.timestamp) / 1000) * QUEUE_CONFIG.priorityBoost;
      return bPriority - aPriority; // Higher priority first
    });
  }

  /**
   * Process queued requests
   */
  private async processQueue(): Promise<void> {
    while (this.queue.length > 0 && this.canProcessMore()) {
      const request = this.findNextRequest();
      if (!request) break;

      // Remove from queue and process
      const index = this.queue.indexOf(request);
      if (index > -1) {
        this.queue.splice(index, 1);
      }

      this.startRequest(request);
      this.executeRequest(request);
    }
  }

  /**
   * Check if we can process more requests
   */
  private canProcessMore(): boolean {
    return this.totalActive < QUEUE_CONFIG.maxConcurrent;
  }

  /**
   * Find next request that can be processed (respects operation limits)
   */
  private findNextRequest(): QueuedRequest<unknown> | null {
    for (const request of this.queue) {
      const operationLimit = OPERATION_LIMITS[request.operation] || OPERATION_LIMITS.default;
      const currentOperationCount = this.activeRequests.get(request.operation) || 0;
      
      if (currentOperationCount < operationLimit) {
        return request;
      }
    }
    return null;
  }

  /**
   * Mark request as started
   */
  private startRequest(request: QueuedRequest<unknown>): void {
    this.totalActive++;
    const current = this.activeRequests.get(request.operation) || 0;
    this.activeRequests.set(request.operation, current + 1);
    
    // Track peak concurrency
    if (this.totalActive > this.stats.peakConcurrency) {
      this.stats.peakConcurrency = this.totalActive;
    }
  }

  /**
   * Mark request as completed
   */
  private completeRequest(request: QueuedRequest<unknown>): void {
    this.totalActive--;
    const current = this.activeRequests.get(request.operation) || 1;
    this.activeRequests.set(request.operation, Math.max(0, current - 1));
    this.stats.totalProcessed++;
    
    // Update average wait time
    const waitTime = Date.now() - request.timestamp;
    this.stats.averageWaitTime = 
      (this.stats.averageWaitTime * (this.stats.totalProcessed - 1) + waitTime) / 
      this.stats.totalProcessed;
  }

  /**
   * Execute a request with timeout handling
   */
  private async executeRequest(request: QueuedRequest<unknown>): Promise<void> {
    const timeoutId = setTimeout(() => {
      request.reject(new Error('Request timed out. Please try again.'));
      this.completeRequest(request);
      this.processQueue();
    }, QUEUE_CONFIG.requestTimeout);

    try {
      const result = await request.execute();
      clearTimeout(timeoutId);
      request.resolve(result);
    } catch (error) {
      clearTimeout(timeoutId);
      request.reject(error instanceof Error ? error : new Error(String(error)));
    } finally {
      this.completeRequest(request);
      // Process next items in queue
      setTimeout(() => this.processQueue(), 0);
    }
  }

  /**
   * Get current queue statistics
   */
  getStats() {
    return {
      ...this.stats,
      currentQueueLength: this.queue.length,
      currentActive: this.totalActive,
      activeByOperation: Object.fromEntries(this.activeRequests),
    };
  }

  /**
   * Get estimated wait time for new request
   */
  getEstimatedWaitTime(operation: string): number {
    if (this.canProcessMore()) return 0;
    
    const operationLimit = OPERATION_LIMITS[operation] || OPERATION_LIMITS.default;
    const currentOperationCount = this.activeRequests.get(operation) || 0;
    
    if (currentOperationCount < operationLimit && this.totalActive < QUEUE_CONFIG.maxConcurrent) {
      return 0;
    }
    
    // Estimate based on average processing time
    const averageProcessingTime = 5000; // 5 seconds average
    const position = this.queue.length;
    return Math.ceil((position / QUEUE_CONFIG.maxConcurrent) * averageProcessingTime);
  }

  /**
   * Check if queue is healthy
   */
  isHealthy(): boolean {
    return this.queue.length < QUEUE_CONFIG.maxQueueSize * 0.8;
  }

  /**
   * Clear expired requests from queue
   */
  cleanup(): void {
    const now = Date.now();
    const expiredRequests = this.queue.filter(
      req => now - req.timestamp > QUEUE_CONFIG.requestTimeout
    );
    
    for (const request of expiredRequests) {
      request.reject(new Error('Request expired while waiting in queue.'));
      const index = this.queue.indexOf(request);
      if (index > -1) {
        this.queue.splice(index, 1);
      }
    }
  }
}

// Singleton instance
export const requestQueue = new RequestQueue();

// Cleanup expired requests every 30 seconds
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    requestQueue.cleanup();
  }, 30000);
}

/**
 * Wrapper function for queueing AI requests
 */
export async function queueAIRequest<T>(
  userId: string,
  operation: string,
  execute: () => Promise<T>,
  priority: number = 0
): Promise<T> {
  return requestQueue.enqueue(userId, operation, execute, priority);
}

/**
 * Get queue health status
 */
export function getQueueHealth() {
  const stats = requestQueue.getStats();
  return {
    healthy: requestQueue.isHealthy(),
    ...stats,
  };
}
