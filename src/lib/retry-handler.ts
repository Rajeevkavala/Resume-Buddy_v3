/**
 * Retry Handler with Exponential Backoff
 * Handles rate limit errors and transient failures gracefully
 */

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;      // Base delay in ms
  maxDelay: number;       // Maximum delay in ms
  backoffFactor: number;  // Multiplier for each retry
  jitter: boolean;        // Add randomization to delays
}

const defaultConfig: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,      // 1 second
  maxDelay: 30000,      // 30 seconds
  backoffFactor: 2,
  jitter: true,
};

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if an error is retryable
 * @param error - The error to check
 * @returns Whether the error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Rate limit errors (429)
    if (message.includes('429') || message.includes('rate limit') || message.includes('too many requests')) {
      return true;
    }

    // Server errors (5xx)
    if (message.includes('500') || message.includes('502') || message.includes('503') || message.includes('504')) {
      return true;
    }

    // Network errors
    if (
      message.includes('econnreset') ||
      message.includes('econnrefused') ||
      message.includes('timeout') ||
      message.includes('network') ||
      message.includes('socket')
    ) {
      return true;
    }

    // Temporary API errors
    if (message.includes('temporarily') || message.includes('try again') || message.includes('overloaded')) {
      return true;
    }
  }

  return false;
}

/**
 * Calculate delay for a retry attempt
 * @param attempt - Current attempt number (0-indexed)
 * @param config - Retry configuration
 * @returns Delay in milliseconds
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
  // Exponential backoff: baseDelay * (backoffFactor ^ attempt)
  let delay = config.baseDelay * Math.pow(config.backoffFactor, attempt);

  // Add jitter (0-1000ms) to prevent thundering herd
  if (config.jitter) {
    delay += Math.random() * 1000;
  }

  // Cap at maxDelay
  return Math.min(delay, config.maxDelay);
}

/**
 * Execute a function with automatic retry on failure
 * @param fn - Async function to execute
 * @param config - Retry configuration (optional)
 * @returns Result of the function
 * @throws Last error if all retries fail
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...defaultConfig, ...config };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Check if error is retryable
      if (!isRetryableError(error)) {
        console.log(`❌ Non-retryable error: ${lastError.message}`);
        throw error;
      }

      // Check if we've exhausted retries
      if (attempt === finalConfig.maxRetries) {
        console.log(`❌ All ${finalConfig.maxRetries} retries exhausted`);
        break;
      }

      // Calculate delay and wait
      const delay = calculateDelay(attempt, finalConfig);
      console.log(`⏳ Retry ${attempt + 1}/${finalConfig.maxRetries} after ${Math.round(delay)}ms`);
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Create a retryable version of an async function
 * @param fn - Async function to wrap
 * @param config - Retry configuration
 * @returns Wrapped function with automatic retry
 */
export function makeRetryable<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  config: Partial<RetryConfig> = {}
): T {
  return (async (...args: unknown[]) => {
    return withRetry(() => fn(...args), config);
  }) as T;
}

/**
 * Rate limit specific retry handler
 * Extracts retry-after header if available
 */
export async function withRateLimitRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Check for rate limit error
      if (!lastError.message.includes('429') && !lastError.message.includes('rate limit')) {
        throw error;
      }

      if (attempt === maxRetries) {
        break;
      }

      // Extract retry-after or use exponential backoff
      const retryAfterMatch = lastError.message.match(/retry.?after[:\s]*(\d+)/i);
      const delay = retryAfterMatch
        ? parseInt(retryAfterMatch[1]) * 1000
        : Math.min(1000 * Math.pow(2, attempt), 30000);

      console.log(`🚫 Rate limited. Waiting ${delay}ms before retry ${attempt + 1}/${maxRetries}`);
      await sleep(delay);
    }
  }

  throw lastError;
}
