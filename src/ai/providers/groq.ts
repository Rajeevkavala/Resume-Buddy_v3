/**
 * Groq AI Provider
 * Primary provider with highest free tier (14,400 requests/day)
 */
import Groq from 'groq-sdk';

// Model selection based on task complexity
// Updated December 2025 - Using current Groq production models
export const GROQ_MODELS = {
  fast: 'llama-3.1-8b-instant', // Fast model (560 tps)
  balanced: 'llama-3.3-70b-versatile', // Best for complex analysis (280 tps)
  code: 'llama-3.3-70b-versatile', // Code-related tasks
} as const;

export type GroqModelType = keyof typeof GROQ_MODELS;

let groqClient: Groq | null = null;

/**
 * Get or create Groq client instance
 */
function getGroqClient(): Groq | null {
  if (!process.env.GROQ_API_KEY) {
    return null;
  }

  if (!groqClient) {
    groqClient = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }

  return groqClient;
}

/**
 * Check if Groq provider is available
 */
export function isGroqAvailable(): boolean {
  return !!process.env.GROQ_API_KEY;
}

interface GroqGenerateOptions {
  prompt: string;
  systemPrompt: string;
  model?: GroqModelType;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

/**
 * Generate completion using Groq
 */
export async function generateWithGroq({
  prompt,
  systemPrompt,
  model = 'balanced',
  temperature = 0.7,
  maxTokens = 4096,
  jsonMode = true,
}: GroqGenerateOptions): Promise<string> {
  const client = getGroqClient();

  if (!client) {
    throw new Error('Groq API key not configured');
  }

  const completion = await client.chat.completions.create({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    model: GROQ_MODELS[model],
    temperature,
    max_tokens: maxTokens,
    response_format: jsonMode ? { type: 'json_object' } : undefined,
  });

  const content = completion.choices[0]?.message?.content;

  if (!content) {
    throw new Error('No response from Groq');
  }

  return content;
}

/**
 * Provider info for multi-provider system
 */
export const groqProvider = {
  name: 'groq',
  priority: 1,
  dailyLimit: 14400,
  rateLimit: 30, // RPM
  generate: generateWithGroq,
  isAvailable: isGroqAvailable,
};
