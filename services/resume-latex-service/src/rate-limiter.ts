/**
 * IP-based Rate Limiter for LaTeX Service
 * Protects against abuse while allowing legitimate usage
 */

interface RateLimitEntry {
  count: number;
  firstRequest: number;
  lastRequest: number;
}

interface RateLimitConfig {
  windowMs: number;      // Time window in ms
  maxRequests: number;   // Max requests per window
  blockDurationMs: number; // How long to block after exceeding limit
}

export class RateLimiter {
  private limits = new Map<string, RateLimitEntry>();
  private blocked = new Map<string, number>(); // IP -> unblock timestamp
  private readonly config: RateLimitConfig;

  // Stats for monitoring
  private totalAllowed = 0;
  private totalBlocked = 0;

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = {
      windowMs: config.windowMs ?? 60_000,        // 1 minute window
      maxRequests: config.maxRequests ?? 10,      // 10 requests per minute
      blockDurationMs: config.blockDurationMs ?? 60_000, // Block for 1 minute
    };

    // Cleanup old entries every minute
    setInterval(() => this.cleanup(), 60_000);
  }

  /**
   * Check if request should be allowed
   * Returns { allowed, retryAfter, remaining }
   */
  check(identifier: string): { allowed: boolean; retryAfter?: number; remaining: number } {
    const now = Date.now();

    // Check if blocked
    const blockedUntil = this.blocked.get(identifier);
    if (blockedUntil && now < blockedUntil) {
      this.totalBlocked++;
      return {
        allowed: false,
        retryAfter: Math.ceil((blockedUntil - now) / 1000),
        remaining: 0,
      };
    }

    // Clear block if expired
    if (blockedUntil) {
      this.blocked.delete(identifier);
    }

    // Get or create entry
    let entry = this.limits.get(identifier);
    
    if (!entry) {
      entry = { count: 0, firstRequest: now, lastRequest: now };
      this.limits.set(identifier, entry);
    }

    // Reset window if expired
    if (now - entry.firstRequest > this.config.windowMs) {
      entry.count = 0;
      entry.firstRequest = now;
    }

    // Check limit
    if (entry.count >= this.config.maxRequests) {
      // Block the IP
      this.blocked.set(identifier, now + this.config.blockDurationMs);
      this.totalBlocked++;
      return {
        allowed: false,
        retryAfter: Math.ceil(this.config.blockDurationMs / 1000),
        remaining: 0,
      };
    }

    // Allow request
    entry.count++;
    entry.lastRequest = now;
    this.totalAllowed++;

    return {
      allowed: true,
      remaining: this.config.maxRequests - entry.count,
    };
  }

  /**
   * Get rate limit stats
   */
  get stats() {
    return {
      activeClients: this.limits.size,
      blockedClients: this.blocked.size,
      totalAllowed: this.totalAllowed,
      totalBlocked: this.totalBlocked,
      config: this.config,
    };
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    
    // Remove expired limit entries
    for (const [key, entry] of this.limits) {
      if (now - entry.lastRequest > this.config.windowMs * 2) {
        this.limits.delete(key);
      }
    }

    // Remove expired blocks
    for (const [key, blockedUntil] of this.blocked) {
      if (now >= blockedUntil) {
        this.blocked.delete(key);
      }
    }

    // Memory protection: limit max entries to prevent unbounded growth
    const MAX_ENTRIES = 10000;
    if (this.limits.size > MAX_ENTRIES) {
      // Keep most recent half
      const entries = Array.from(this.limits.entries())
        .sort((a, b) => b[1].lastRequest - a[1].lastRequest)
        .slice(0, MAX_ENTRIES / 2);
      this.limits.clear();
      entries.forEach(([k, v]) => this.limits.set(k, v));
    }
  }

  /**
   * Reset stats (useful for testing)
   */
  resetStats(): void {
    this.totalAllowed = 0;
    this.totalBlocked = 0;
  }

  /**
   * Clear all entries (graceful shutdown)
   */
  clear(): void {
    this.limits.clear();
    this.blocked.clear();
  }
}

// Singleton instance with conservative limits for 500 users
export const rateLimiter = new RateLimiter({
  windowMs: 60_000,       // 1 minute window
  maxRequests: 10,        // 10 PDFs per minute per IP
  blockDurationMs: 60_000, // Block for 1 minute after exceeding
});
