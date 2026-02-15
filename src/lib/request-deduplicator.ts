/**
 * Request Deduplication System
 * Prevents duplicate concurrent requests for the same operation
 */

// Track in-flight requests
const inFlightRequests = new Map<string, Promise<unknown>>();

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
    console.log(`⏳ Waiting for in-flight request: ${key.substring(0, 16)}...`);
    return existing as Promise<T>;
  }

  // Create new request with cleanup on completion
  const promise = requestFn().finally(() => {
    inFlightRequests.delete(key);
  });

  inFlightRequests.set(key, promise);
  console.log(`🚀 New request started: ${key.substring(0, 16)}...`);
  
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
