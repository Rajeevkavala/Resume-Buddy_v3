/**
 * Smart Model Router (Production-Ready)
 * 
 * Routes AI requests to appropriate models based on task complexity
 * to optimize cost while maintaining quality.
 * 
 * Routing Strategy:
 * - Primary: Groq (fast, reliable, cost-effective)
 * - Fallback: Groq (different model tier)
 * - Last Resort: Gemini
 * 
 * Features:
 * - 3-tier fallback for reliability
 * - Token limit enforcement (abuse prevention)
 * - Accurate cost tracking
 * - Realistic output token estimation
 * 
 * Cost Savings: ~40-60% compared to using 70B for everything
 */

import { generateWithGemini } from './providers/gemini';
import { estimateTokens } from '@/lib/prompt-optimizer';
import { trackUsage } from '@/lib/usage-analytics';
import { trackApiUsage } from '@/lib/admin/api-usage-tracking';

// Feature types that can be routed
export type AIFeature = 
  | 'resume-qa'
  | 'auto-fill-resume'
  | 'auto-fill-jd'
  | 'resume-analysis'
  | 'resume-improvement'
  | 'interview-questions'
  | 'cover-letter'
  | 'interview-session'
  | 'dsa-questions'
  | 'evaluate-answer'
  | 'follow-up-question'
  | 'evaluate-code';

// Model tiers based on capability
export type ModelTier = 'fast' | 'balanced' | 'powerful';

// Model configuration for each provider
interface ModelConfig {
  tier: ModelTier;
  provider: 'groq' | 'gemini' | 'openrouter';
  model: string;           // Actual model name for API calls
  tokensPerSecond: number;
  costPer1MInput: number;  // $ per 1M input tokens
  costPer1MOutput: number; // $ per 1M output tokens
}

// Available models configuration (using REAL model names)
export const MODEL_CONFIGS: Record<string, ModelConfig> = {
  // Groq Models (Primary) - Using actual Groq model names
  'groq-llama-8b': {
    tier: 'fast',
    provider: 'groq',
    model: 'llama-3.1-8b-instant',
    tokensPerSecond: 840,  // Groq is faster than initially estimated
    costPer1MInput: 0.05,
    costPer1MOutput: 0.08,
  },
  'groq-llama-70b': {
    tier: 'powerful',
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
    tokensPerSecond: 394,
    costPer1MInput: 0.59,
    costPer1MOutput: 0.79,
  },
  // Gemini (Last Resort Fallback)
  'gemini': {
    tier: 'balanced',
    provider: 'gemini',
    model: 'gemini-1.5-flash',
    tokensPerSecond: 400,
    costPer1MInput: 0.075,
    costPer1MOutput: 0.30,
  },
};

// ============================================
// TOKEN LIMITS PER FEATURE (Abuse Prevention)
// ============================================
export const FEATURE_TOKEN_LIMITS: Record<AIFeature, number> = {
  'resume-qa': 3000,
  'auto-fill-resume': 4000,
  'auto-fill-jd': 5000,
  'resume-analysis': 6000,      // Resume + JD combined
  'resume-improvement': 8000,   // Needs full context
  'interview-questions': 4000,
  'cover-letter': 5000,         // Resume + JD for personalization
  'interview-session': 5000,    // Session generation with context
  'dsa-questions': 5000,        // DSA problem generation
  'evaluate-answer': 4000,      // Answer evaluation
  'follow-up-question': 3000,   // Quick follow-up
  'evaluate-code': 5000,        // Code analysis
};

// Realistic output token estimates per feature (for cost calculation)
export const FEATURE_OUTPUT_TOKENS: Record<AIFeature, number> = {
  'resume-qa': 400,
  'auto-fill-resume': 600,
  'auto-fill-jd': 500,
  'resume-analysis': 700,
  'resume-improvement': 1200,
  'interview-questions': 900,
  'cover-letter': 800,          // ~400 word letter
  'interview-session': 1200,    // Multiple questions
  'dsa-questions': 1500,        // Detailed problems + templates
  'evaluate-answer': 800,       // Scored feedback
  'follow-up-question': 400,    // Single follow-up
  'evaluate-code': 1000,        // Detailed code analysis
};

// Smart routing configuration
// Maps features to recommended models
// Strategy: Primary → Groq | Fallback → Groq (smaller) | Last Resort → Gemini
export const FEATURE_MODEL_ROUTING: Record<AIFeature, {
  primary: string;
  fallback: string;
  lastResort: string;
  reason: string;
}> = {
  'resume-qa': {
    primary: 'groq-llama-8b',
    fallback: 'groq-llama-70b',   // Upgrade on failure for reliability
    lastResort: 'gemini',
    reason: 'Simple Q&A - 8B handles well, 70B if needed',
  },
  'auto-fill-resume': {
    primary: 'groq-llama-8b',
    fallback: 'groq-llama-70b',
    lastResort: 'gemini',
    reason: 'Structured extraction - 8B efficient, 70B backup',
  },
  'auto-fill-jd': {
    primary: 'groq-llama-8b',
    fallback: 'groq-llama-70b',
    lastResort: 'gemini',
    reason: 'JD parsing - fast structured task',
  },
  'resume-analysis': {
    primary: 'groq-llama-70b',     // Analysis needs more intelligence
    fallback: 'groq-llama-8b',     // Downgrade if rate limited
    lastResort: 'gemini',
    reason: 'Analysis needs 70B accuracy, 8B acceptable fallback',
  },
  'resume-improvement': {
    primary: 'groq-llama-70b',
    fallback: 'groq-llama-8b',     // Downgrade on failure
    lastResort: 'gemini',
    reason: 'Complex rewriting - 70B preferred, 8B acceptable',
  },
  'interview-questions': {
    primary: 'groq-llama-70b',
    fallback: 'groq-llama-8b',
    lastResort: 'gemini',
    reason: 'Quality MCQs - 70B preferred, 8B acceptable',
  },
  'cover-letter': {
    primary: 'groq-llama-70b',     // Quality writing needs 70B
    fallback: 'groq-llama-8b',     // Downgrade if rate limited
    lastResort: 'gemini',
    reason: 'Creative writing - 70B for quality, 8B acceptable',
  },
  'interview-session': {
    primary: 'groq-llama-70b',
    fallback: 'groq-llama-8b',
    lastResort: 'gemini',
    reason: 'Quality interview questions need 70B intelligence',
  },
  'dsa-questions': {
    primary: 'groq-llama-70b',
    fallback: 'groq-llama-8b',
    lastResort: 'gemini',
    reason: 'DSA problems need 70B for correct complexity analysis',
  },
  'evaluate-answer': {
    primary: 'groq-llama-8b',      // Use faster 8B model for cost efficiency
    fallback: 'groq-llama-70b',
    lastResort: 'gemini',
    reason: 'Cost-optimized evaluation - 8B sufficient for scoring',
  },
  'follow-up-question': {
    primary: 'groq-llama-8b',      // Fast response for conversational flow
    fallback: 'groq-llama-70b',
    lastResort: 'gemini',
    reason: 'Quick follow-up - 8B is fast enough',
  },
  'evaluate-code': {
    primary: 'groq-llama-8b',      // Use faster 8B model for cost efficiency
    fallback: 'groq-llama-70b',
    lastResort: 'gemini',
    reason: 'Cost-optimized evaluation - 8B sufficient for code review',
  },
};

export interface SmartGenerateOptions {
  prompt: string;
  systemPrompt: string;
  feature: AIFeature;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  userId?: string;
}

export interface SmartGenerateResult {
  content: string;
  model: string;
  provider: string;
  tier: ModelTier;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  estimatedCost: number;
}

/**
 * Generate AI response using smart model routing
 * Automatically selects the optimal model based on the feature
 * Includes: Token limit enforcement, 3-tier fallback, retry logic
 */
export async function smartGenerate(options: SmartGenerateOptions): Promise<SmartGenerateResult> {
  const { feature, prompt, systemPrompt, temperature = 0.7, maxTokens = 4096, jsonMode = true, userId } = options;
  const startTime = Date.now();
  
  // Get routing configuration for this feature
  const routing = FEATURE_MODEL_ROUTING[feature];
  const primaryConfig = MODEL_CONFIGS[routing.primary];
  const fallbackConfig = MODEL_CONFIGS[routing.fallback];
  const lastResortConfig = MODEL_CONFIGS[routing.lastResort];

  // Estimate input tokens
  const inputTokens = estimateTokens(prompt + systemPrompt);
  
  // ⚠️ ENFORCE TOKEN LIMITS (Abuse Prevention)
  const tokenLimit = FEATURE_TOKEN_LIMITS[feature];
  if (inputTokens > tokenLimit) {
    console.error(`❌ Token limit exceeded for ${feature}: ${inputTokens} > ${tokenLimit}`);
    throw new Error(`Input too long. Maximum ${tokenLimit} tokens allowed for ${feature}. Please shorten your input.`);
  }
  
  console.log(`🎯 Smart Router: ${feature} → ${routing.primary} (${routing.reason})`);

  // Helper to attempt generation with a model
  const attemptGeneration = async (config: ModelConfig, attempt: string): Promise<SmartGenerateResult> => {
    const content = await generateWithModel(config, {
      prompt,
      systemPrompt,
      temperature,
      maxTokens,
      jsonMode,
    });

    const latencyMs = Date.now() - startTime;
    const outputTokens = estimateTokens(content);
    const estimatedCost = calculateCost(config, inputTokens, outputTokens);
    const totalTokens = inputTokens + outputTokens;

    if (userId && userId !== 'anonymous') {
      await trackApiUsage(
        userId,
        config.provider,
        feature,
        totalTokens,
        { latencyMs, success: true },
      );
    }

    trackSmartRouterUsage(feature, config, inputTokens, outputTokens, latencyMs, true, userId);
    console.log(`✅ ${attempt} succeeded: ${config.model} (${latencyMs}ms)`);

    return {
      content,
      model: config.model,
      provider: config.provider,
      tier: config.tier,
      inputTokens,
      outputTokens,
      latencyMs,
      estimatedCost,
    };
  };

  // 3-TIER FALLBACK STRATEGY: Primary → Fallback → Last Resort
  const attempts = [
    { config: primaryConfig, name: 'Primary', key: routing.primary },
    { config: fallbackConfig, name: 'Fallback', key: routing.fallback },
    { config: lastResortConfig, name: 'Last Resort', key: routing.lastResort },
  ];

  let lastError: Error | null = null;

  for (const { config, name, key } of attempts) {
    try {
      return await attemptGeneration(config, name);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`⚠️ ${name} (${key}) failed: ${lastError.message}`);

      if (userId && userId !== 'anonymous') {
        const failureLatency = Date.now() - startTime;
        await trackApiUsage(
          userId,
          config.provider,
          feature,
          inputTokens,
          { latencyMs: failureLatency, success: false, error: lastError.message },
        );
      }
      
      // If not the last attempt, continue to next
      if (name !== 'Last Resort') {
        console.log(`🔄 Retrying with next model...`);
      }
    }
  }

  // All attempts failed
  console.error(`❌ All 3 models failed for ${feature}`);
  throw new Error(`Smart routing failed for ${feature}: ${lastError?.message || 'Unknown error'}`);
}

/**
 * Generate with a specific model configuration
 * Uses the ACTUAL model name from config (no abstraction)
 */
async function generateWithModel(
  config: ModelConfig,
  options: {
    prompt: string;
    systemPrompt: string;
    temperature: number;
    maxTokens: number;
    jsonMode: boolean;
  }
): Promise<string> {
  switch (config.provider) {
    case 'groq':
      // Pass the REAL model name directly to Groq API
      return generateWithGroqDirect({
        ...options,
        model: config.model, // e.g., 'llama-3.1-8b-instant' or 'llama-3.3-70b-versatile'
      });
    
    case 'gemini':
      return generateWithGemini(options);
    
    default:
      throw new Error(`Unknown provider: ${config.provider}`);
  }
}

/**
 * Direct Groq API call with actual model name
 * (Bypasses the 'fast'|'balanced' abstraction in groq.ts)
 */
async function generateWithGroqDirect(options: {
  prompt: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  jsonMode?: boolean;
  model: string;
}): Promise<string> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('Groq API key not configured');
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: options.model,
      messages: [
        { role: 'system', content: options.systemPrompt },
        { role: 'user', content: options.prompt },
      ],
      max_tokens: options.maxTokens,
      temperature: options.temperature,
      response_format: options.jsonMode ? { type: 'json_object' } : undefined,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${error}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('No response from Groq');
  }

  return content;
}

/**
 * Calculate estimated cost for a request
 */
function calculateCost(config: ModelConfig, inputTokens: number, outputTokens: number): number {
  const inputCost = (inputTokens / 1_000_000) * config.costPer1MInput;
  const outputCost = (outputTokens / 1_000_000) * config.costPer1MOutput;
  return inputCost + outputCost;
}

/**
 * Track smart router usage for analytics
 */
function trackSmartRouterUsage(
  feature: AIFeature,
  config: ModelConfig,
  inputTokens: number,
  outputTokens: number,
  latencyMs: number,
  success: boolean,
  userId?: string
): void {
  trackUsage({
    userId: userId || 'anonymous',
    operation: feature,
    provider: `smart-router:${config.provider}:${config.model}`,
    tokensUsed: inputTokens + outputTokens,
    latencyMs,
    cached: false,
    success,
  });
}

/**
 * Get recommended model for a feature
 */
export function getRecommendedModel(feature: AIFeature): {
  model: string;
  provider: string;
  tier: ModelTier;
  reason: string;
} {
  const routing = FEATURE_MODEL_ROUTING[feature];
  const config = MODEL_CONFIGS[routing.primary];
  
  return {
    model: config.model,
    provider: config.provider,
    tier: config.tier,
    reason: routing.reason,
  };
}

// Realistic INPUT token estimates per feature
const FEATURE_INPUT_TOKENS: Record<AIFeature, number> = {
  'resume-qa': 1100,
  'auto-fill-resume': 1200,
  'auto-fill-jd': 1500,
  'resume-analysis': 2000,
  'resume-improvement': 2500,
  'interview-questions': 1800,
  'cover-letter': 1800,
  'interview-session': 2000,
  'dsa-questions': 1500,
  'evaluate-answer': 2000,
  'follow-up-question': 1000,
  'evaluate-code': 2500,
};

/**
 * Get cost comparison between using smart routing vs 70B for all
 * Uses REALISTIC feature-weighted token estimates
 */
export function getCostComparison(): {
  smartRoutingCost: number;
  allPowerfulCost: number;
  savings: number;
  savingsPercent: number;
  breakdown: Array<{ feature: string; model: string; cost: number }>;
} {
  // Features and their approximate usage distribution
  const featureUsage: Record<AIFeature, number> = {
    'resume-qa': 0.10,
    'auto-fill-resume': 0.13,
    'auto-fill-jd': 0.10,
    'resume-analysis': 0.13,
    'resume-improvement': 0.10,
    'interview-questions': 0.10,
    'cover-letter': 0.10,
    'interview-session': 0.06,
    'dsa-questions': 0.04,
    'evaluate-answer': 0.06,
    'follow-up-question': 0.04,
    'evaluate-code': 0.04,
  };

  let smartRoutingCost = 0;
  let allPowerfulCost = 0;
  const breakdown: Array<{ feature: string; model: string; cost: number }> = [];
  const powerful = MODEL_CONFIGS['groq-llama-70b'];

  for (const [feature, weight] of Object.entries(featureUsage)) {
    const f = feature as AIFeature;
    const inputTokens = FEATURE_INPUT_TOKENS[f];
    const outputTokens = FEATURE_OUTPUT_TOKENS[f];
    
    // Smart routing cost (using optimal model)
    const routing = FEATURE_MODEL_ROUTING[f];
    const config = MODEL_CONFIGS[routing.primary];
    const featureCost = calculateCost(config, inputTokens, outputTokens);
    smartRoutingCost += featureCost * weight;
    
    // 70B for everything cost
    allPowerfulCost += calculateCost(powerful, inputTokens, outputTokens) * weight;
    
    breakdown.push({
      feature,
      model: routing.primary,
      cost: featureCost,
    });
  }

  const savings = allPowerfulCost - smartRoutingCost;
  const savingsPercent = allPowerfulCost > 0 ? (savings / allPowerfulCost) * 100 : 0;

  return {
    smartRoutingCost,
    allPowerfulCost,
    savings,
    savingsPercent: Math.round(savingsPercent),
    breakdown,
  };
}

/**
 * Get all routing configurations for display/debugging
 */
export function getRoutingTable(): Array<{
  feature: AIFeature;
  primaryModel: string;
  fallbackModel: string;
  lastResort: string;
  tier: ModelTier;
  tokenLimit: number;
  reason: string;
}> {
  return Object.entries(FEATURE_MODEL_ROUTING).map(([feature, routing]) => {
    const f = feature as AIFeature;
    const config = MODEL_CONFIGS[routing.primary];
    return {
      feature: f,
      primaryModel: routing.primary,
      fallbackModel: routing.fallback,
      lastResort: routing.lastResort,
      tier: config.tier,
      tokenLimit: FEATURE_TOKEN_LIMITS[f],
      reason: routing.reason,
    };
  });
}

/**
 * Check if a user's input is within token limits for a feature
 */
export function validateTokenLimit(feature: AIFeature, inputText: string): {
  valid: boolean;
  tokens: number;
  limit: number;
  message?: string;
} {
  const tokens = estimateTokens(inputText);
  const limit = FEATURE_TOKEN_LIMITS[feature];
  const valid = tokens <= limit;
  
  return {
    valid,
    tokens,
    limit,
    message: valid ? undefined : `Input exceeds limit: ${tokens}/${limit} tokens`,
  };
}
