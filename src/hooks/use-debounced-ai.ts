/**
 * Debounced AI Hook
 * Prevents rapid API calls by debouncing user actions
 */
'use client';

import { useCallback, useRef, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';

interface UseDebouncedAIOptions {
  delay?: number;        // Debounce delay in ms (default: 1000)
  maxWait?: number;      // Maximum wait time before forcing execution
  leading?: boolean;     // Execute on leading edge
  trailing?: boolean;    // Execute on trailing edge (default: true)
}

interface UseDebouncedAIReturn<T> {
  execute: (...args: unknown[]) => void;
  result: T | null;
  isLoading: boolean;
  error: Error | null;
  cancel: () => void;
  isPending: () => boolean;
}

/**
 * Hook for debouncing AI function calls
 * Useful for real-time analysis while typing
 * 
 * @param aiFunction - Async function that calls AI
 * @param options - Debounce options
 * @returns Debounced function and state
 * 
 * @example
 * ```tsx
 * const { execute, result, isLoading } = useDebouncedAI(
 *   async (resumeText: string) => {
 *     return await analyzeResume(resumeText);
 *   },
 *   { delay: 2000 }
 * );
 * 
 * // In onChange handler:
 * execute(newText);
 * ```
 */
export function useDebouncedAI<T>(
  aiFunction: (...args: unknown[]) => Promise<T>,
  options: UseDebouncedAIOptions = {}
): UseDebouncedAIReturn<T> {
  const {
    delay = 1000,
    maxWait = 5000,
    leading = false,
    trailing = true,
  } = options;

  const [result, setResult] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const debouncedFn = useDebouncedCallback(
    async (...args: unknown[]) => {
      // Cancel any previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setIsLoading(true);
      setError(null);

      try {
        const response = await aiFunction(...args);
        setResult(response);
      } catch (err) {
        // Ignore abort errors
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    },
    delay,
    { maxWait, leading, trailing }
  );

  const execute = useCallback((...args: unknown[]) => {
    debouncedFn(...args);
  }, [debouncedFn]);

  const cancel = useCallback(() => {
    debouncedFn.cancel();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsLoading(false);
  }, [debouncedFn]);

  const isPending = useCallback(() => {
    return debouncedFn.isPending();
  }, [debouncedFn]);

  return {
    execute,
    result,
    isLoading,
    error,
    cancel,
    isPending,
  };
}

/**
 * Simple debounce utility for one-off use
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * Throttle utility - limits execution frequency
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}
