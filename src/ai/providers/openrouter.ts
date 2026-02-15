/**
 * OpenRouter AI Provider
 * Tertiary fallback with free Llama/Mistral models
 */

// Free models available on OpenRouter
export const OPENROUTER_MODELS = {
  llama: 'meta-llama/llama-3.1-8b-instruct:free',
  mistral: 'mistralai/mistral-7b-instruct:free',
  gemma: 'google/gemma-2-9b-it:free',
  qwen: 'qwen/qwen-2-7b-instruct:free',
} as const;

export type OpenRouterModelType = keyof typeof OPENROUTER_MODELS;

/**
 * Check if OpenRouter provider is available
 */
export function isOpenRouterAvailable(): boolean {
  return !!process.env.OPENROUTER_API_KEY;
}

interface OpenRouterGenerateOptions {
  prompt: string;
  systemPrompt: string;
  model?: OpenRouterModelType;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Generate completion using OpenRouter
 */
export async function generateWithOpenRouter({
  prompt,
  systemPrompt,
  model = 'llama',
  temperature = 0.7,
  maxTokens = 4096,
}: OpenRouterGenerateOptions): Promise<string> {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OpenRouter API key not configured');
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://resumebuddy.app',
      'X-Title': 'Resume Buddy',
    },
    body: JSON.stringify({
      model: OPENROUTER_MODELS[model],
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      max_tokens: maxTokens,
      temperature,
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
 * Provider info for multi-provider system
 */
export const openRouterProvider = {
  name: 'openrouter',
  priority: 3,
  dailyLimit: 1000,
  rateLimit: 20, // RPM (varies by model)
  generate: generateWithOpenRouter,
  isAvailable: isOpenRouterAvailable,
};
