/**
 * Generate Interview Session Questions
 * 
 * Creates a set of interview questions for a session based on type,
 * difficulty, and optional resume/JD context.
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

export const GenerateInterviewSessionInputSchema = z.object({
  type: z.enum(['dsa', 'behavioral', 'technical', 'system-design']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  questionCount: z.number().min(3).max(15).default(5),
  answerFormat: z.enum(['mcq', 'text', 'voice', 'code']).default('text'),
  resumeText: z.string().optional(),
  jobDescription: z.string().optional(),
});

export type GenerateInterviewSessionInput = z.infer<typeof GenerateInterviewSessionInputSchema>;

const QuestionSchema = z.object({
  question: z.string(),
  category: z.string(),
  hints: z.array(z.string()).optional(),
  // MCQ fields (behavioral/technical)
  options: z.array(z.string()).optional(),
  correctAnswerIndex: z.number().optional(),
});

const OutputSchema = z.object({
  questions: z.array(QuestionSchema),
});

export type GenerateInterviewSessionOutput = z.infer<typeof OutputSchema>;

// ============ PROMPTS ============

const SYSTEM_PROMPT = `You are a professional interview coach. Generate high-quality interview questions. Output valid JSON only.`;

const TYPE_INSTRUCTIONS: Record<string, string> = {
  dsa: 'Generate algorithmic/data structure questions. Include problem description, input/output format, and constraints. Do NOT include code templates.',
  behavioral: 'Generate behavioral interview questions using STAR format scenarios. Include 4 answer options with 1 correct answer. Focus on teamwork, conflict resolution, leadership.',
  technical: 'Generate technical knowledge questions. Include 4 answer options with 1 correct answer. Focus on system design, architecture, best practices.',
  'system-design': 'Generate system design questions. Ask about designing scalable systems, API design, database schema. Include hints for approach.',
};

export async function generateInterviewSession(
  input: GenerateInterviewSessionInput
): Promise<GenerateInterviewSessionOutput> {
  const trimmedResume = input.resumeText
    ? truncateToTokens(input.resumeText, 400)
    : '';
  const trimmedJD = input.jobDescription
    ? truncateToTokens(input.jobDescription, 300)
    : '';

  const contextSection = trimmedResume || trimmedJD
    ? `\nCANDIDATE CONTEXT:\n${trimmedResume ? `Resume: ${trimmedResume}\n` : ''}${trimmedJD ? `Job: ${trimmedJD}\n` : ''}`
    : '';

  const shouldGenerateMCQ = input.answerFormat === 'mcq';

  const prompt = `Generate ${input.questionCount} ${input.type} interview questions at ${input.difficulty} difficulty.

${TYPE_INSTRUCTIONS[input.type]}
${contextSection}

OUTPUT JSON:
{
  "questions": [
    {
      "question": "Full question text",
      "category": "Category name"${shouldGenerateMCQ ? `,
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswerIndex": 0` : `,
      "hints": ["Hint 1", "Hint 2"]`}
    }
  ]
}`;

  const result = await smartGenerate({
    prompt,
    systemPrompt: SYSTEM_PROMPT,
    feature: 'interview-session',
    maxTokens: 3000,
  });

  return parseJsonResponse<GenerateInterviewSessionOutput>(result.content);
}
