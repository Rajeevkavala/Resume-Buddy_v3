/**
 * Evaluate Code Solution
 * 
 * AI-powered static analysis of code submissions for DSA questions.
 * No execution — AI analyzes correctness, efficiency, and style.
 * Uses Smart Router: groq-llama-70b → groq-llama-8b → gemini
 */

import { smartGenerate, parseJsonResponse } from '@/ai';
import { z } from 'zod';

function truncateToTokens(text: string, maxTokens: number): string {
  const maxChars = maxTokens * 4;
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + '...';
}

// ============ SCHEMAS ============

export const EvaluateCodeInputSchema = z.object({
  question: z.string(),
  code: z.string(),
  language: z.enum(['javascript', 'python', 'java', 'cpp']),
  expectedComplexity: z.object({
    time: z.string(),
    space: z.string(),
  }).optional(),
  voiceExplanation: z.string().optional(),
});

export type EvaluateCodeInput = z.infer<typeof EvaluateCodeInputSchema>;

const CodeEvaluationSchema = z.object({
  score: z.number().min(0).max(100),
  isCorrect: z.boolean(),
  feedback: z.string(),
  correctness: z.number().min(0).max(100),
  efficiency: z.number().min(0).max(100),
  readability: z.number().min(0).max(100),
  timeComplexity: z.string(),
  spaceComplexity: z.string(),
  edgeCasesHandled: z.boolean(),
  strengths: z.array(z.string()),
  issues: z.array(z.string()),
  suggestions: z.array(z.string()),
  communicationScore: z.number().min(0).max(100).optional(),
  communicationFeedback: z.string().optional(),
});

export type EvaluateCodeOutput = z.infer<typeof CodeEvaluationSchema>;

// ============ IMPLEMENTATION ============

const SYSTEM_PROMPT = `You are an expert code reviewer evaluating interview coding solutions. Analyze code statically (no execution). Be thorough and constructive. Output valid JSON only.`;

export async function evaluateCodeSolution(
  input: EvaluateCodeInput
): Promise<EvaluateCodeOutput> {
  const trimmedCode = truncateToTokens(input.code, 1500);

  let prompt = `Evaluate this ${input.language} solution for the coding problem below.

PROBLEM:
${truncateToTokens(input.question, 800)}

CODE SOLUTION:
\`\`\`${input.language}
${trimmedCode}
\`\`\``;

  if (input.expectedComplexity) {
    prompt += `\n\nEXPECTED: Time ${input.expectedComplexity.time}, Space ${input.expectedComplexity.space}`;
  }

  if (input.voiceExplanation) {
    const trimmedExplanation = truncateToTokens(input.voiceExplanation, 500);
    prompt += `\n\nCANDIDATE'S VERBAL EXPLANATION:\n${trimmedExplanation}

Evaluate their communication:
- Did they clearly explain their approach?
- Did they identify the right algorithm/data structure?
- Did they discuss trade-offs and complexity?
- Did they consider edge cases verbally?`;
  }

  prompt += `\n\nANALYZE FOR:
1. Correctness: Does the logic solve the problem? Edge cases?
2. Efficiency: Time/space complexity. Optimal solution?
3. Readability: Clean code, naming, structure
4. Common bugs: Off-by-one, null checks, overflow

OUTPUT JSON:
{
  "score": 0-100,
  "isCorrect": true/false,
  "feedback": "Overall assessment",
  "correctness": 0-100,
  "efficiency": 0-100,
  "readability": 0-100,
  "timeComplexity": "O(?)",
  "spaceComplexity": "O(?)",
  "edgeCasesHandled": true/false,
  "strengths": ["strength1"],
  "issues": ["issue1"],
  "suggestions": ["suggestion1"]${input.voiceExplanation ? `,
  "communicationScore": 0-100,
  "communicationFeedback": "Assessment of verbal explanation"` : ''}
}`;

  const result = await smartGenerate({
    prompt,
    systemPrompt: SYSTEM_PROMPT,
    feature: 'evaluate-code',
    maxTokens: 2000,
  });

  return parseJsonResponse<EvaluateCodeOutput>(result.content);
}
