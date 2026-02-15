/**
 * Multi-Provider AI System with Automatic Fallback
 * 
 * Priority Order:
 * 1. Groq (Primary) - 14,400 requests/day free
 * 2. Gemini (Backup) - 1,500 requests/day free (existing integration)
 * 3. OpenRouter (Tertiary) - Free Llama/Mistral models
 * 
 * Combined Free Tier Capacity: ~16,900 requests/day
 * 
 * Features:
 * - Automatic provider fallback
 * - Response caching (LRU)
 * - Request deduplication
 * - Global rate limiting
 * - Retry with exponential backoff
 * - Usage analytics
 */

import { groqProvider, isGroqAvailable, generateWithGroq } from './providers/groq';
import { geminiProvider, isGeminiAvailable, generateWithGemini } from './providers/gemini';
import { openRouterProvider, isOpenRouterAvailable, generateWithOpenRouter } from './providers/openrouter';
import { getCachedResponse, setCachedResponse } from '@/lib/response-cache';
import { deduplicateRequest, generateRequestKey } from '@/lib/request-deduplicator';
import { canUseProvider as checkProviderLimit, recordProviderUsage } from '@/lib/global-rate-limiter';
import { withRetry, isRetryableError } from '@/lib/retry-handler';
import { trackUsage } from '@/lib/usage-analytics';
import { compressPrompt, estimateTokens } from '@/lib/prompt-optimizer';
import { trackApiUsage } from '@/lib/admin/api-usage-tracking';
import { LRUCache } from 'lru-cache';

// Provider interface
interface Provider {
  name: string;
  priority: number;
  dailyLimit: number;
  rateLimit: number;
  generate: (options: GenerateOptions) => Promise<string>;
  isAvailable: () => boolean;
}

// Generate options interface
export interface GenerateOptions {
  prompt: string;
  systemPrompt: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

// All providers sorted by priority
const providers: Provider[] = [
  {
    ...groqProvider,
    generate: (opts: GenerateOptions) => generateWithGroq({ ...opts, model: 'balanced' }),
  },
  {
    ...geminiProvider,
    generate: (opts: GenerateOptions) => generateWithGemini(opts),
  },
  {
    ...openRouterProvider,
    generate: (opts: GenerateOptions) => generateWithOpenRouter({ ...opts, model: 'llama' }),
  },
].sort((a, b) => a.priority - b.priority);

// Track daily usage per provider
interface UsageInfo {
  count: number;
  resetAt: Date;
}

const usageTracker = new LRUCache<string, UsageInfo>({
  max: 10,
  ttl: 24 * 60 * 60 * 1000, // 24 hours
});

/**
 * Check if a provider can be used based on daily limits
 */
function canUseProvider(provider: Provider): boolean {
  const usage = usageTracker.get(provider.name);
  const now = new Date();

  if (!usage || usage.resetAt < now) {
    // Reset usage for new day
    const resetAt = new Date(now);
    resetAt.setHours(24, 0, 0, 0);
    usageTracker.set(provider.name, { count: 0, resetAt });
    return true;
  }

  return usage.count < provider.dailyLimit;
}

/**
 * Increment usage counter for a provider
 */
function incrementUsage(providerName: string): void {
  const usage = usageTracker.get(providerName);
  if (usage) {
    usage.count++;
    usageTracker.set(providerName, usage);
  }
}

/**
 * Internal generation function with retry logic
 */
async function executeGeneration(
  provider: Provider,
  options: GenerateOptions
): Promise<string> {
  return withRetry(
    () => provider.generate(options),
    {
      maxRetries: 2,
      baseDelay: 1000,
      maxDelay: 5000,
    }
  );
}

/**
 * Generate AI response with automatic fallback between providers
 * Features: caching, deduplication, rate limiting, retry, analytics
 * 
 * @param options - Generation options including prompt and system prompt
 * @param useCache - Whether to use response caching (default: true)
 * @param userId - Optional user ID for analytics (default: 'anonymous')
 * @returns Generated content and provider name
 */
export async function generateWithFallback(
  options: GenerateOptions,
  useCache: boolean = true,
  userId: string = 'anonymous'
): Promise<{ content: string; provider: string }> {
  const { prompt, systemPrompt } = options;
  const startTime = Date.now();
  const estimatedTokens = estimateTokens(prompt + (systemPrompt || ''));

  // Compress prompts for efficiency
  const compressedPrompt = compressPrompt(prompt);
  const compressedSystemPrompt = systemPrompt ? compressPrompt(systemPrompt) : systemPrompt;
  const optimizedOptions = { ...options, prompt: compressedPrompt, systemPrompt: compressedSystemPrompt };

  // Check cache first
  if (useCache) {
    const cached = getCachedResponse(compressedPrompt, compressedSystemPrompt);
    if (cached) {
      // Track cached request
      trackUsage({
        userId,
        operation: 'generate',
        provider: cached.provider,
        tokensUsed: 0,
        latencyMs: Date.now() - startTime,
        cached: true,
        success: true,
      });
      return cached;
    }
  }

  // Generate request key for deduplication
  const requestKey = generateRequestKey('generate', { prompt: compressedPrompt, systemPrompt: compressedSystemPrompt });

  // Use deduplication to prevent concurrent duplicate requests
  return deduplicateRequest(requestKey, async () => {
    // Try each provider in priority order
    for (const provider of providers) {
      if (!provider.isAvailable()) {
        console.log(`⏭️ Provider ${provider.name} not available (no API key)`);
        continue;
      }

      // Check local usage tracker
      if (!canUseProvider(provider)) {
        console.log(`⏭️ Provider ${provider.name} daily limit reached (local)`);
        continue;
      }

      // Check global rate limiter
      const globalLimit = checkProviderLimit(provider.name, estimatedTokens);
      if (!globalLimit.allowed) {
        console.log(`⏭️ Provider ${provider.name} rate limited: ${globalLimit.reason}`);
        continue;
      }

      try {
        console.log(`🔄 Trying provider: ${provider.name}`);
        const content = await executeGeneration(provider, optimizedOptions);
        
        // Update usage trackers
        incrementUsage(provider.name);
        recordProviderUsage(provider.name, estimatedTokens);
        
        console.log(`✅ Request handled by ${provider.name}`);

        // Cache the successful response
        if (useCache) {
          setCachedResponse(compressedPrompt, content, provider.name, compressedSystemPrompt);
        }

        // Track successful request in analytics
        trackUsage({
          userId,
          operation: 'generate',
          provider: provider.name,
          tokensUsed: estimatedTokens,
          latencyMs: Date.now() - startTime,
          cached: false,
          success: true,
        });

        // Track API usage in Firestore for the user (non-blocking)
        if (userId && userId !== 'anonymous') {
          trackApiUsage(
            userId, 
            provider.name as 'groq' | 'gemini' | 'openrouter',
            'generate',
            estimatedTokens
          ).catch(err => console.warn('Failed to track API usage:', err));
        }

        return { content, provider: provider.name };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.warn(`⚠️ Provider ${provider.name} failed:`, errorMessage);

        // Track failed request
        trackUsage({
          userId,
          operation: 'generate',
          provider: provider.name,
          tokensUsed: 0,
          latencyMs: Date.now() - startTime,
          cached: false,
          success: false,
          error: errorMessage,
        });

        continue;
      }
    }

    throw new Error('All AI providers failed or are rate limited');
  });
}

/**
 * Get current status of all providers
 */
export function getProviderStatus(): {
  name: string;
  available: boolean;
  usage: number;
  limit: number;
  remaining: number;
}[] {
  return providers.map((p) => {
    const usage = usageTracker.get(p.name);
    const usageCount = usage?.count || 0;
    return {
      name: p.name,
      available: p.isAvailable(),
      usage: usageCount,
      limit: p.dailyLimit,
      remaining: p.dailyLimit - usageCount,
    };
  });
}

/**
 * Get the name of the currently primary available provider
 */
export function getPrimaryProvider(): string | null {
  for (const provider of providers) {
    if (provider.isAvailable() && canUseProvider(provider)) {
      return provider.name;
    }
  }
  return null;
}

/**
 * Estimate total remaining capacity across all providers
 */
export function getTotalRemainingCapacity(): number {
  return providers.reduce((total, provider) => {
    if (!provider.isAvailable()) return total;
    const usage = usageTracker.get(provider.name);
    const usageCount = usage?.count || 0;
    return total + (provider.dailyLimit - usageCount);
  }, 0);
}
