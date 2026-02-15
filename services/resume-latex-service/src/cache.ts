/**
 * Simple LRU Cache for compiled PDFs
 * Reduces redundant compilations for identical inputs
 */

import { createHash } from 'node:crypto';

type CacheEntry = {
  pdfBase64: string;
  latexSource: string;
  createdAt: number;
  hits: number;
};

export class PDFCache {
  private cache = new Map<string, CacheEntry>();
  private readonly maxSize: number;
  private readonly ttlMs: number;

  // Stats
  private hits = 0;
  private misses = 0;

  constructor(opts?: { maxSize?: number; ttlMs?: number }) {
    // Keep up to 100 compiled PDFs in memory (~50MB max at 500KB each)
    this.maxSize = opts?.maxSize ?? 100;
    // Cache for 1 hour
    this.ttlMs = opts?.ttlMs ?? 60 * 60 * 1000;
  }

  get stats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hits + this.misses > 0 
        ? ((this.hits / (this.hits + this.misses)) * 100).toFixed(1) + '%'
        : '0%',
    };
  }

  /**
   * Generate cache key from input parameters
   */
  static generateKey(input: {
    source: string;
    templateId: string;
    resumeText?: string;
    resumeData?: unknown;
  }): string {
    const data = JSON.stringify({
      source: input.source,
      templateId: input.templateId,
      resumeText: input.resumeText,
      resumeData: input.resumeData,
    });
    return createHash('sha256').update(data).digest('hex').slice(0, 32);
  }

  get(key: string): CacheEntry | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.misses++;
      return undefined;
    }

    // Check TTL
    if (Date.now() - entry.createdAt > this.ttlMs) {
      this.cache.delete(key);
      this.misses++;
      return undefined;
    }

    // Update stats and move to end (LRU)
    entry.hits++;
    this.hits++;
    
    // Move to end for LRU
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry;
  }

  set(key: string, value: { pdfBase64: string; latexSource: string }): void {
    // Evict oldest entries if at capacity
    while (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      ...value,
      createdAt: Date.now(),
      hits: 0,
    });
  }

  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Remove expired entries (call periodically)
   */
  cleanup(): number {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache) {
      if (now - entry.createdAt > this.ttlMs) {
        this.cache.delete(key);
        removed++;
      }
    }

    return removed;
  }
}

// Singleton instance
export const pdfCache = new PDFCache({
  maxSize: 100,
  ttlMs: 60 * 60 * 1000, // 1 hour
});

// Cleanup expired entries every 10 minutes
setInterval(() => {
  pdfCache.cleanup();
}, 10 * 60 * 1000);
