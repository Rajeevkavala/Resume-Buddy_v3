/**
 * Generate DSA Questions
 * 
 * Creates data structures & algorithms questions with problem descriptions,
 * code templates, expected complexity, and hints.
 * Uses Smart Router: groq-llama-70b → groq-llama-8b → gemini
 */

import { smartGenerate, parseJsonResponse } from '@/ai';
import { z } from 'zod';

// ============ SCHEMAS ============

export const DSAQuestionInputSchema = z.object({
  difficulty: z.enum(['easy', 'medium', 'hard']),
  categories: z.array(z.string()).optional(),
  count: z.number().min(1).max(10).default(5),
  codeLanguage: z.enum(['javascript', 'python', 'java', 'cpp']).default('javascript'),
  resumeText: z.string().optional(),
});

export type DSAQuestionInput = z.infer<typeof DSAQuestionInputSchema>;

const DSAQuestionSchema = z.object({
  question: z.string(),
  category: z.string(),
  difficulty: z.string(),
  constraints: z.array(z.string()),
  examples: z.array(z.object({
    input: z.string(),
    output: z.string(),
    explanation: z.string().optional(),
  })),
  codeTemplate: z.string(),
  expectedComplexity: z.object({
    time: z.string(),
    space: z.string(),
  }),
  hints: z.array(z.string()),
});

const DSAOutputSchema = z.object({
  questions: z.array(DSAQuestionSchema),
});

export type DSAQuestionOutput = z.infer<typeof DSAOutputSchema>;

// ============ PROMPTS ============

const SYSTEM_PROMPT = `You are an expert coding interview coach. Generate algorithmic coding problems similar to LeetCode. Output valid JSON only.`;

const LANGUAGE_TEMPLATES: Record<string, string> = {
  javascript: `function solution(input) {\n  // Your code here\n}`,
  python: `def solution(input):\n    # Your code here\n    pass`,
  java: `class Solution {\n    public int solution(int[] input) {\n        // Your code here\n        return 0;\n    }\n}`,
  cpp: `class Solution {\npublic:\n    int solution(vector<int>& input) {\n        // Your code here\n        return 0;\n    }\n};`,
};

export async function generateDSAQuestions(
  input: DSAQuestionInput
): Promise<DSAQuestionOutput> {
  const categoryFilter = input.categories?.length
    ? `Focus on these categories: ${input.categories.join(', ')}`
    : 'Cover a variety of data structure and algorithm topics';

  const prompt = `Generate ${input.count} coding interview problems at ${input.difficulty} difficulty.

${categoryFilter}

REQUIREMENTS:
- Each problem should have clear input/output format
- Include 1-2 examples with explanations
- Provide a ${input.codeLanguage} code template (function signature only)
- Include time/space complexity expectations
- Include 2-3 progressive hints
- Make problems practical and interview-relevant

TEMPLATE STYLE:
${LANGUAGE_TEMPLATES[input.codeLanguage]}

OUTPUT JSON:
{
  "questions": [
    {
      "question": "Problem description",
      "category": "arrays|strings|trees|dynamic-programming|etc",
      "difficulty": "${input.difficulty}",
      "constraints": ["1 <= n <= 10^5", "etc"],
      "examples": [{"input": "...", "output": "...", "explanation": "..."}],
      "codeTemplate": "function signature with comments",
      "expectedComplexity": {"time": "O(n)", "space": "O(1)"},
      "hints": ["Hint 1", "Hint 2", "Hint 3"]
    }
  ]
}`;

  const result = await smartGenerate({
    prompt,
    systemPrompt: SYSTEM_PROMPT,
    feature: 'dsa-questions',
    maxTokens: 3500,
  });

  return parseJsonResponse<DSAQuestionOutput>(result.content);
}
