/**
 * Unified AI Module
 * 
 * Main entry point for AI generation with multi-provider fallback support.
 * Supports Groq (primary), Gemini (backup), and OpenRouter (tertiary).
 * 
 * Features:
 * - Multi-provider fallback (Groq → Gemini → OpenRouter)
 * - Response caching (LRU with 1hr TTL)
 * - Request deduplication
 * - Global rate limiting
 * - Retry with exponential backoff
 * - Usage analytics
 * - Prompt optimization
 * 
 * @example
 * ```typescript
 * import { generate, parseJsonResponse } from '@/ai';
 * 
 * const response = await generate({
 *   prompt: 'Analyze this resume...',
 *   systemPrompt: 'You are an expert resume analyst...',
 *   jsonMode: true,
 * });
 * 
 * const result = parseJsonResponse<MyType>(response);
 * ```
 */

import { generateWithFallback, getProviderStatus, getPrimaryProvider, getTotalRemainingCapacity } from './multi-provider';
import type { GenerateOptions } from './multi-provider';

// Smart Router exports
export {
  smartGenerate,
  getRecommendedModel,
  getCostComparison,
  getRoutingTable,
  validateTokenLimit,
  FEATURE_MODEL_ROUTING,
  MODEL_CONFIGS,
  FEATURE_TOKEN_LIMITS,
  FEATURE_OUTPUT_TOKENS,
  type AIFeature,
  type SmartGenerateOptions,
  type SmartGenerateResult,
} from './smart-router';

// Re-export types
export type { GenerateOptions };

// Re-export provider utilities
export { getProviderStatus, getPrimaryProvider, getTotalRemainingCapacity };

// Re-export optimization utilities
export { compressPrompt, estimateTokens, truncateResume, extractRelevantJobContext, optimizePrompt } from '@/lib/prompt-optimizer';
export { getCachedResponse, setCachedResponse, clearAllCache, getCacheStats } from '@/lib/response-cache';
export { checkRateLimit, getRateLimitStatus, resetRateLimit } from '@/lib/rate-limiter';
export { getUsageStats, getUserUsageStats, checkAlerts, exportAnalytics } from '@/lib/usage-analytics';
export { getProvidersStatus, getBestAvailableProvider } from '@/lib/global-rate-limiter';
export { 
  getCachedResumeAnalysis, cacheResumeAnalysis,
  getCachedInterviewQuestions, cacheInterviewQuestions,
  getCachedImprovements, cacheImprovements,
  getCachedParsedResume, cacheParsedResume,
  clearUserCache, getUserCacheStats 
} from '@/lib/user-cache';

/**
 * Generate AI response using the multi-provider system
 * 
 * @param options - Generation options
 * @param options.prompt - The user prompt/query
 * @param options.systemPrompt - The system prompt defining AI behavior
 * @param options.temperature - Creativity level (0-1, default: 0.7)
 * @param options.maxTokens - Maximum tokens in response (default: 4096)
 * @param options.jsonMode - Whether to enforce JSON output (default: true)
 * @param useCache - Whether to use response caching (default: true)
 * @param userId - User ID for tracking API usage (optional)
 * @returns The generated response string
 */
export async function generate(
  options: GenerateOptions,
  useCache: boolean = true,
  userId?: string
): Promise<string> {
  const { content } = await generateWithFallback(options, useCache, userId || 'anonymous');
  return content;
}

/**
 * Generate AI response with provider info
 * 
 * @param options - Generation options
 * @param useCache - Whether to use response caching (default: true)
 * @param userId - User ID for tracking API usage (optional)
 * @returns Object containing content and provider name
 */
export async function generateWithInfo(
  options: GenerateOptions,
  useCache: boolean = true,
  userId?: string
): Promise<{ content: string; provider: string }> {
  return generateWithFallback(options, useCache, userId || 'anonymous');
}

/**
 * Safely parse JSON response from AI
 * 
 * @param response - The AI response string
 * @returns Parsed JSON object
 * @throws Error if response is not valid JSON
 */
export function parseJsonResponse<T>(response: string): T {
  try {
    // Handle potential markdown code blocks
    let cleaned = response.trim();
    
    // Remove markdown code blocks if present
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.slice(7);
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.slice(3);
    }
    
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.slice(0, -3);
    }
    
    cleaned = cleaned.trim();
    
    return JSON.parse(cleaned) as T;
  } catch (error) {
    console.error('Failed to parse AI response as JSON:', response.substring(0, 200));
    throw new Error('Failed to parse AI response as JSON');
  }
}

/**
 * Validate that a response matches expected schema (basic check)
 * 
 * @param response - Parsed response object
 * @param requiredFields - Array of required field names
 * @returns True if all required fields exist
 */
export function validateResponse(
  response: Record<string, unknown>,
  requiredFields: string[]
): boolean {
  return requiredFields.every((field) => field in response);
}
