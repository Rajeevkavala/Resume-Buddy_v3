/**
 * Request Deduplication System
 * Prevents duplicate concurrent requests for the same operation
 * Includes a safety timeout to prevent memory leaks from hung requests.
 */

// Track in-flight requests
const inFlightRequests = new Map<string, Promise<unknown>>();

// Maximum time an in-flight request can live before being cleaned up (2 minutes)
const MAX_IN_FLIGHT_MS = 120_000;

/**
 * Deduplicate concurrent requests with the same key
 * If a request with the same key is already in flight, wait for it instead of making a new request
 * 
 * @param key - Unique identifier for the request
 * @param requestFn - Function that makes the actual request
 * @returns Result of the request
 */
export async function deduplicateRequest<T>(
  key: string,
  requestFn: () => Promise<T>
): Promise<T> {
  // Check if request is already in flight
  const existing = inFlightRequests.get(key);
  if (existing) {
    return existing as Promise<T>;
  }

  // Create new request with cleanup on completion
  const promise = requestFn().finally(() => {
    inFlightRequests.delete(key);
  });

  // Safety timeout: auto-cleanup if the request hangs forever
  const safetyTimeout = setTimeout(() => {
    if (inFlightRequests.has(key)) {
      inFlightRequests.delete(key);
      console.warn(`[Deduplicator] Cleaned up stale request: ${key.substring(0, 16)}...`);
    }
  }, MAX_IN_FLIGHT_MS);

  // Ensure the safety timeout doesn't prevent Node.js from exiting
  if (safetyTimeout.unref) safetyTimeout.unref();

  // Clear safety timeout when request completes normally
  promise.finally(() => clearTimeout(safetyTimeout));

  inFlightRequests.set(key, promise);
  
  return promise;
}

/**
 * Generate a unique key for a request based on operation and inputs
 * @param operation - Name of the operation (e.g., 'analyze-resume')
 * @param inputs - Input parameters for the operation
 * @returns Unique key string
 */
export function generateRequestKey(
  operation: string,
  inputs: Record<string, unknown>
): string {
  const normalized = JSON.stringify(inputs, Object.keys(inputs).sort());
  // Simple hash for the key
  let hash = 0;
  const combined = `${operation}:${normalized}`;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `${operation}:${Math.abs(hash).toString(16)}`;
}

/**
 * Get the number of in-flight requests
 */
export function getInFlightCount(): number {
  return inFlightRequests.size;
}

/**
 * Check if a request is currently in flight
 */
export function isRequestInFlight(key: string): boolean {
  return inFlightRequests.has(key);
}
