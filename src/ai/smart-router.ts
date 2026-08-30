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
import { generateWithSarvam, isSarvamAvailable } from './providers/sarvam';
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
  | 'evaluate-code'
  | 'live-interview-respond'
  | 'live-interview-start'
  | 'live-interview-evaluate';

// Model tiers based on capability
export type ModelTier = 'fast' | 'balanced' | 'powerful';

// Model configuration for each provider
interface ModelConfig {
  tier: ModelTier;
  provider: 'groq' | 'gemini' | 'openrouter' | 'sarvam';
  model: string;           // Actual model name for API calls
  tokensPerSecond: number;
  costPer1MInput: number;  // $ per 1M input tokens
  costPer1MOutput: number; // $ per 1M output tokens
}

// Available models configuration (using REAL model names)
export const MODEL_CONFIGS: Record<string, ModelConfig> = {
  // GPT-OSS Models (OpenAI OSS / Groq / OpenRouter)
  'gpt-oss-20b': {
    tier: 'fast',
    provider: 'groq',
    model: 'openai/gpt-oss-20b',
    tokensPerSecond: 600,
    costPer1MInput: 0.10,
    costPer1MOutput: 0.15,
  },
  'gpt-oss-120b': {
    tier: 'powerful',
    provider: 'groq',
    model: 'openai/gpt-oss-120b',
    tokensPerSecond: 300,
    costPer1MInput: 0.40,
    costPer1MOutput: 0.60,
  },
  // Qwen Code / DSA Model
  'qwen-3.6-27b': {
    tier: 'balanced',
    provider: 'openrouter',
    model: 'qwen/qwen-2.5-72b-instruct',
    tokensPerSecond: 450,
    costPer1MInput: 0.20,
    costPer1MOutput: 0.30,
  },
  // Gemini (Last Resort Fallback)
  'gemini-2.5-flash': {
    tier: 'balanced',
    provider: 'gemini',
    model: 'gemini-2.5-flash',
    tokensPerSecond: 400,
    costPer1MInput: 0.075,
    costPer1MOutput: 0.30,
  },
  'gemini': {
    tier: 'balanced',
    provider: 'gemini',
    model: 'gemini-2.5-flash',
    tokensPerSecond: 400,
    costPer1MInput: 0.075,
    costPer1MOutput: 0.30,
  },
  // Sarvam-M LLM (optimized for Indian English interviews)
  'sarvam-m': {
    tier: 'balanced',
    provider: 'sarvam',
    model: 'sarvam-m',
    tokensPerSecond: 300,
    costPer1MInput: 0.10,
    costPer1MOutput: 0.15,
  },
  // Legacy aliases
  'groq-llama-8b': {
    tier: 'fast',
    provider: 'groq',
    model: 'openai/gpt-oss-20b',
    tokensPerSecond: 600,
    costPer1MInput: 0.10,
    costPer1MOutput: 0.15,
  },
  'groq-llama-70b': {
    tier: 'powerful',
    provider: 'groq',
    model: 'openai/gpt-oss-120b',
    tokensPerSecond: 300,
    costPer1MInput: 0.40,
    costPer1MOutput: 0.60,
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
  'live-interview-respond': 4000, // Live interview conversational response
  'live-interview-start': 5000,   // Live interview session start
  'live-interview-evaluate': 6000, // Live interview full evaluation
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
  'live-interview-respond': 500,  // Quick conversational response
  'live-interview-start': 800,    // Interview opening + first question
  'live-interview-evaluate': 1500, // Comprehensive evaluation
};

// Smart routing configuration
// Maps features to recommended models based on accuracy, speed and cost
export const FEATURE_MODEL_ROUTING: Record<AIFeature, {
  primary: string;
  fallback: string;
  lastResort: string;
  reason: string;
}> = {
  'resume-qa': {
    primary: 'gpt-oss-20b',
    fallback: 'gpt-oss-120b',
    lastResort: 'gemini-2.5-flash',
    reason: 'Fast conversational reasoning',
  },
  'auto-fill-resume': {
    primary: 'gpt-oss-20b',
    fallback: 'gpt-oss-120b',
    lastResort: 'gemini-2.5-flash',
    reason: 'Structured extraction',
  },
  'auto-fill-jd': {
    primary: 'gpt-oss-20b',
    fallback: 'gpt-oss-120b',
    lastResort: 'gemini-2.5-flash',
    reason: 'Parsing & JSON output',
  },
  'resume-analysis': {
    primary: 'gpt-oss-120b',
    fallback: 'gpt-oss-20b',
    lastResort: 'gemini-2.5-flash',
    reason: 'Deep reasoning',
  },
  'resume-improvement': {
    primary: 'gpt-oss-120b',
    fallback: 'gpt-oss-20b',
    lastResort: 'gemini-2.5-flash',
    reason: 'Best rewriting quality',
  },
  'cover-letter': {
    primary: 'gpt-oss-120b',
    fallback: 'gpt-oss-20b',
    lastResort: 'gemini-2.5-flash',
    reason: 'High-quality writing',
  },
  'interview-questions': {
    primary: 'gpt-oss-120b',
    fallback: 'gpt-oss-20b',
    lastResort: 'gemini-2.5-flash',
    reason: 'Better question generation',
  },
  'interview-session': {
    primary: 'gpt-oss-120b',
    fallback: 'gpt-oss-20b',
    lastResort: 'gemini-2.5-flash',
    reason: 'Multi-turn reasoning',
  },
  'dsa-questions': {
    primary: 'qwen-3.6-27b',
    fallback: 'gpt-oss-120b',
    lastResort: 'gemini-2.5-flash',
    reason: 'Strong coding/problem generation',
  },
  'evaluate-answer': {
    primary: 'gpt-oss-20b',
    fallback: 'gpt-oss-120b',
    lastResort: 'gemini-2.5-flash',
    reason: 'Fast scoring & feedback',
  },
  'follow-up-question': {
    primary: 'gpt-oss-20b',
    fallback: 'gpt-oss-120b',
    lastResort: 'gemini-2.5-flash',
    reason: 'Low latency',
  },
  'evaluate-code': {
    primary: 'qwen-3.6-27b',
    fallback: 'gpt-oss-120b',
    lastResort: 'gemini-2.5-flash',
    reason: 'Better code understanding',
  },
  'live-interview-respond': {
    primary: 'gpt-oss-20b',
    fallback: 'gpt-oss-120b',
    lastResort: 'gemini-2.5-flash',
    reason: 'Low-latency conversation',
  },
  'live-interview-start': {
    primary: 'gpt-oss-120b',
    fallback: 'gpt-oss-20b',
    lastResort: 'gemini-2.5-flash',
    reason: 'Better interview setup',
  },
  'live-interview-evaluate': {
    primary: 'gpt-oss-120b',
    fallback: 'gpt-oss-20b',
    lastResort: 'gemini-2.5-flash',
    reason: 'Comprehensive evaluation',
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
      if (process.env.GROQ_API_KEY) {
        try {
          return await generateWithGroqDirect({
            ...options,
            model: config.model,
          });
        } catch (err: any) {
          if (process.env.OPENROUTER_API_KEY) {
            console.warn(`[SmartRouter] Groq failed, attempting OpenRouter with ${config.model}:`, err?.message || err);
            return await generateWithOpenRouterDirect({
              ...options,
              model: config.model,
            });
          }
          throw err;
        }
      } else if (process.env.OPENROUTER_API_KEY) {
        return await generateWithOpenRouterDirect({
          ...options,
          model: config.model,
        });
      }
      throw new Error('Neither GROQ_API_KEY nor OPENROUTER_API_KEY is configured');

    case 'openrouter':
      return generateWithOpenRouterDirect({
        ...options,
        model: config.model,
      });

    case 'gemini':
      return generateWithGemini(options);

    case 'sarvam':
      if (!isSarvamAvailable()) {
        throw new Error('Sarvam AI not configured (SARVAM_API_KEY missing)');
      }
      return generateWithSarvam({
        prompt: options.prompt,
        systemPrompt: options.systemPrompt,
        temperature: options.temperature,
        maxTokens: options.maxTokens,
        jsonMode: options.jsonMode,
      });

    default:
      throw new Error(`Unknown provider: ${config.provider}`);
  }
}

/**
 * Direct Groq API call with actual model name
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
 * Direct OpenRouter API call with actual model name
 */
async function generateWithOpenRouterDirect(options: {
  prompt: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  jsonMode?: boolean;
  model: string;
}): Promise<string> {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OpenRouter API key not configured');
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://www.resume-buddy.tech',
      'X-Title': 'Resume Buddy',
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
    throw new Error(`OpenRouter API error: ${error}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('No response from OpenRouter');
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
  'live-interview-respond': 2000,  // Real-time conversation
  'live-interview-start': 2500,
  'live-interview-evaluate': 3000,
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
    'live-interview-respond': 0.04,
    'live-interview-start': 0.02,
    'live-interview-evaluate': 0.02,
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
