/**
 * Gemini AI Provider (via existing Genkit integration)
 * Backup provider with 1,500 requests/day free tier
 */
import { ai } from '../genkit';

/**
 * Check if Gemini provider is available
 */
export function isGeminiAvailable(): boolean {
  return !!process.env.GOOGLE_API_KEY;
}

interface GeminiGenerateOptions {
  prompt: string;
  systemPrompt: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

/**
 * Generate completion using Gemini via Genkit
 */
export async function generateWithGemini({
  prompt,
  systemPrompt,
  temperature = 0.7,
  maxTokens = 4096,
}: GeminiGenerateOptions): Promise<string> {
  if (!isGeminiAvailable()) {
    throw new Error('Google API key not configured');
  }

  const fullPrompt = `${systemPrompt}\n\n${prompt}`;

  const response = await ai.generate({
    prompt: fullPrompt,
    config: {
      temperature,
      maxOutputTokens: maxTokens,
    },
  });

  const content = response.text;

  if (!content) {
    throw new Error('No response from Gemini');
  }

  return content;
}

/**
 * Provider info for multi-provider system
 */
export const geminiProvider = {
  name: 'gemini',
  priority: 2,
  dailyLimit: 1500,
  rateLimit: 15, // RPM
  generate: generateWithGemini,
  isAvailable: isGeminiAvailable,
};
