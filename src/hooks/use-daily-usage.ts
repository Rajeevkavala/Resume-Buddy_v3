/**
 * Hook to track and display daily AI request usage
 * Updates in real-time as requests are made
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/auth-context';

interface DailyUsageState {
  used: number;
  remaining: number;
  limit: number;
  resetAt: Date | null;
  loading: boolean;
  error: string | null;
}

const STORAGE_KEY = 'daily_usage_cache';
const CACHE_DURATION = 10000; // 10 seconds cache (reduced for more accurate data)

interface CachedUsage {
  data: Omit<DailyUsageState, 'loading' | 'error'>;
  timestamp: number;
  date: string; // YYYY-MM-DD to detect day change
}

/**
 * Get current local date string for cache validation
 */
function getCurrentDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getNextMidnightLocal(): Date {
  const next = new Date();
  next.setDate(next.getDate() + 1);
  next.setHours(0, 0, 0, 0);
  return next;
}

/**
 * Get cached usage from localStorage
 */
function getCachedUsage(userId: string): CachedUsage | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const cached = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
    if (!cached) return null;
    
    const parsed = JSON.parse(cached) as CachedUsage;
    
    // CRITICAL: Invalidate cache if it's from a different day (limits reset at midnight)
    const today = getCurrentDateString();
    if (parsed.date && parsed.date !== today) {
      // It's a new day - clear the stale cache
      localStorage.removeItem(`${STORAGE_KEY}_${userId}`);
      return null;
    }
    
    // Check if cache is still valid (within time window)
    if (Date.now() - parsed.timestamp < CACHE_DURATION) {
      return parsed;
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Save usage to localStorage cache
 */
function setCachedUsage(userId: string, data: Omit<DailyUsageState, 'loading' | 'error'>): void {
  if (typeof window === 'undefined') return;
  
  try {
    const cache: CachedUsage = {
      data,
      timestamp: Date.now(),
      date: getCurrentDateString(), // Store current date for day-change detection
    };
    localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(cache));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Clear cached usage to force a fresh fetch
 */
function clearCachedUsage(userId: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(`${STORAGE_KEY}_${userId}`);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Hook to track daily AI request usage
 */
export function useDailyUsage() {
  const { user } = useAuth();
  const [state, setState] = useState<DailyUsageState>({
    used: 0,
    remaining: 10,
    limit: 10,
    resetAt: null,
    loading: true,
    error: null,
  });

  // Prevent duplicate concurrent fetches (React dev strict mode + multiple triggers)
  const inFlightFetchRef = useRef<Promise<void> | null>(null);
  const usageEventDebounceRef = useRef<number | null>(null);
  const midnightTimerRef = useRef<number | null>(null);

  /**
   * Fetch usage from API
   */
  const fetchUsage = useCallback(async (forceRefresh = false) => {
    if (!user?.uid) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    // If a fetch is already in progress, reuse it to avoid request storms.
    if (inFlightFetchRef.current) {
      await inFlightFetchRef.current;
      return;
    }

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = getCachedUsage(user.uid);
      if (cached) {
        setState({
          ...cached.data,
          resetAt: cached.data.resetAt ? new Date(cached.data.resetAt) : null,
          loading: false,
          error: null,
        });
        return;
      }
    }

    const doFetch = (async () => {
      try {
        const cacheBust = Date.now();
        const response = await fetch(`/api/rate-limit/status?userId=${user.uid}&t=${cacheBust}`, {
          cache: 'no-store',
        });

      let data: any = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      // Fail-soft: if backend returns non-200 or success:false, keep UI stable.
      if (!response.ok || data?.success === false) {
        const now = new Date();
        const resetAt = new Date(now);
        resetAt.setHours(24, 0, 0, 0);

        const fallbackState = {
          used: 0,
          remaining: 10,
          limit: 10,
          resetAt,
        };

        // Cache fallback briefly to avoid spamming the endpoint.
        setCachedUsage(user.uid, fallbackState);

        setState({
          ...fallbackState,
          loading: false,
          error: null,
        });

        return;
      }

        const newState = {
          used: data.daily?.used ?? 0,
          remaining: data.daily?.remaining ?? 10,
          limit: data.daily?.limit ?? 10,
          resetAt: data.daily?.resetAt ? new Date(data.daily.resetAt) : null,
        };
      
      // Cache the result
      setCachedUsage(user.uid, newState);
      
        setState({
          ...newState,
          loading: false,
          error: null,
        });
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Daily usage fetch failed; using fallback.', error);
        }
        const now = new Date();
        const resetAt = new Date(now);
        resetAt.setHours(24, 0, 0, 0);
        setState({
          used: 0,
          remaining: 10,
          limit: 10,
          resetAt,
          loading: false,
          error: null,
        });
      }
    })();

    inFlightFetchRef.current = doFetch;
    try {
      await doFetch;
    } finally {
      inFlightFetchRef.current = null;
    }
  }, [user?.uid]);

  /**
   * Decrement remaining count (call after making an AI request)
   */
  const decrementUsage = useCallback(() => {
    setState(prev => {
      const newUsed = prev.used + 1;
      const newRemaining = Math.max(0, prev.remaining - 1);
      
      // Update cache
      if (user?.uid) {
        setCachedUsage(user.uid, {
          used: newUsed,
          remaining: newRemaining,
          limit: prev.limit,
          resetAt: prev.resetAt,
        });
      }
      
      return {
        ...prev,
        used: newUsed,
        remaining: newRemaining,
      };
    });
  }, [user?.uid]);

  /**
   * Refresh usage data
   */
  const refresh = useCallback(() => {
    fetchUsage(true);
  }, [fetchUsage]);

  // Fetch on mount and when user changes - always fetch fresh data on mount
  useEffect(() => {
    // Clear cache on mount to ensure fresh data
    if (user?.uid) {
      clearCachedUsage(user.uid);
    }
    fetchUsage(true); // Force refresh on mount
  }, [fetchUsage, user?.uid]);

  // Listen for usage events from other components
  useEffect(() => {
    const handleUsageEvent = () => {
      // Clear the cache to ensure fresh data
      if (user?.uid) {
        clearCachedUsage(user.uid);
      }
      // Immediately decrement for instant UI feedback
      decrementUsage();

      // Debounce the follow-up fetch to prevent multiple back-to-back requests
      // (e.g. quick successive AI operations or strict-mode effect replays).
      if (usageEventDebounceRef.current) {
        window.clearTimeout(usageEventDebounceRef.current);
      }
      usageEventDebounceRef.current = window.setTimeout(() => {
        fetchUsage(true);
      }, 700);
    };

    window.addEventListener('ai-request-made', handleUsageEvent);
    
    return () => {
      window.removeEventListener('ai-request-made', handleUsageEvent);
    };
  }, [decrementUsage, fetchUsage, user?.uid]);

  // Schedule a single refresh at local midnight (no polling).
  useEffect(() => {
    if (!user?.uid) return;

    if (midnightTimerRef.current) {
      window.clearTimeout(midnightTimerRef.current);
      midnightTimerRef.current = null;
    }

    const schedule = () => {
      const nextMidnight = getNextMidnightLocal();
      const msUntil = Math.max(0, nextMidnight.getTime() - Date.now()) + 250;

      midnightTimerRef.current = window.setTimeout(() => {
        clearCachedUsage(user.uid);
        setState(prev => ({
          ...prev,
          used: 0,
          remaining: prev.limit,
          resetAt: nextMidnight,
        }));
        fetchUsage(true);
        schedule();
      }, msUntil);
    };

    schedule();

    return () => {
      if (midnightTimerRef.current) {
        window.clearTimeout(midnightTimerRef.current);
        midnightTimerRef.current = null;
      }
    };
  }, [fetchUsage, user?.uid]);

  return {
    ...state,
    refresh,
    decrementUsage,
  };
}

/**
 * Dispatch event when an AI request is made
 * Call this from AI request functions to update the navbar
 */
export function notifyAIRequestMade(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ai-request-made'));
  }
}
