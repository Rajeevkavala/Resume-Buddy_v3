/**
 * Generate Follow-Up Question
 * 
 * Creates contextual follow-up questions based on previous answer.
 * Mimics real interview flow where interviewers dig deeper.
 * Uses Smart Router: groq-llama-8b (fast response) → groq-llama-70b → gemini
 */

import { smartGenerate, parseJsonResponse } from '@/ai';
import { z } from 'zod';

function truncateToTokens(text: string, maxTokens: number): string {
  const maxChars = maxTokens * 4;
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + '...';
}

// ============ SCHEMAS ============

export const FollowUpInputSchema = z.object({
  originalQuestion: z.string(),
  userAnswer: z.string(),
  questionType: z.enum(['dsa', 'behavioral', 'technical', 'system-design']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  evaluationScore: z.number().optional(),
});

export type FollowUpInput = z.infer<typeof FollowUpInputSchema>;

const FollowUpOutputSchema = z.object({
  followUpQuestion: z.string(),
  category: z.string(),
  purpose: z.string(),
  hints: z.array(z.string()).optional(),
});

export type FollowUpOutput = z.infer<typeof FollowUpOutputSchema>;

// ============ IMPLEMENTATION ============

const SYSTEM_PROMPT = `You are a skilled interviewer. Generate one natural follow-up question. Output valid JSON only.`;

export async function generateFollowUpQuestion(
  input: FollowUpInput
): Promise<FollowUpOutput> {
  const trimmedAnswer = truncateToTokens(input.userAnswer, 600);

  const scoreContext = input.evaluationScore != null
    ? `\nThe candidate scored ${input.evaluationScore}/100 on the previous answer.`
    : '';

  const prompt = `Based on the interview exchange below, ask a follow-up question that digs deeper.

ORIGINAL QUESTION:
${input.originalQuestion}

CANDIDATE'S ANSWER:
${trimmedAnswer}
${scoreContext}

QUESTION TYPE: ${input.questionType}
DIFFICULTY: ${input.difficulty}

FOLLOW-UP STRATEGY:
- If score was high: Ask a harder related question
- If score was low: Probe the gap or give them a simpler variant
- For DSA: Ask about optimization or edge cases
- For behavioral: Ask for specific examples or metrics

OUTPUT JSON:
{
  "followUpQuestion": "The follow-up question text",
  "category": "Category name",
  "purpose": "Why this follow-up matters",
  "hints": ["Optional hint 1"]
}`;

  const result = await smartGenerate({
    prompt,
    systemPrompt: SYSTEM_PROMPT,
    feature: 'follow-up-question',
    maxTokens: 1000,
  });

  return parseJsonResponse<FollowUpOutput>(result.content);
}
