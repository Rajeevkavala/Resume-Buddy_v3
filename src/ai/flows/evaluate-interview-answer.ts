/**
 * Evaluate Interview Answer
 * 
 * AI-powered evaluation of user answers with scoring and feedback.
 * Supports text, voice transcript, and code answers.
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

export const EvaluateAnswerInputSchema = z.object({
  question: z.string(),
  questionType: z.enum(['dsa', 'behavioral', 'technical', 'system-design']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  userAnswer: z.string(),
  answerMode: z.enum(['text', 'voice', 'code']),
  codeLanguage: z.string().optional(),
  voiceExplanation: z.string().optional(),
  // For MCQ questions
  correctAnswer: z.string().optional(),
  // For DSA questions
  expectedComplexity: z.object({
    time: z.string(),
    space: z.string(),
  }).optional(),
}).superRefine((data, ctx) => {
  // Require codeLanguage when answerMode is 'code'
  if (data.answerMode === 'code' && !data.codeLanguage) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'codeLanguage is required when answerMode is code',
      path: ['codeLanguage'],
    });
  }
});

export type EvaluateAnswerInput = z.infer<typeof EvaluateAnswerInputSchema>;

const EvaluationSchema = z.object({
  score: z.number().min(0).max(100),
  isCorrect: z.boolean(),
  feedback: z.string(),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  codeAnalysis: z.object({
    correctness: z.number().min(0).max(100),
    efficiency: z.number().min(0).max(100),
    readability: z.number().min(0).max(100),
    timeComplexity: z.string(),
    spaceComplexity: z.string(),
    edgeCasesHandled: z.boolean(),
    suggestions: z.array(z.string()),
  }).optional(),
  communicationScore: z.number().min(0).max(100).optional(),
  communicationFeedback: z.string().optional(),
});

export type EvaluateAnswerOutput = z.infer<typeof EvaluationSchema>;

// ============ PROMPTS ============

const SYSTEM_PROMPT = `You are an expert technical interviewer evaluating candidate responses. Be constructive, specific, and fair. Output valid JSON only.`;

export async function evaluateInterviewAnswer(
  input: EvaluateAnswerInput
): Promise<EvaluateAnswerOutput> {
  const trimmedAnswer = truncateToTokens(input.userAnswer, 1500);

  let prompt = `Evaluate this ${input.questionType} interview answer at ${input.difficulty} difficulty.

QUESTION:
${input.question}

CANDIDATE'S ANSWER (${input.answerMode}):
${trimmedAnswer}`;

  // Add MCQ correct answer context
  if (input.correctAnswer) {
    prompt += `\n\nCORRECT ANSWER: ${input.correctAnswer}`;
  }

  // Add code-specific evaluation
  if (input.answerMode === 'code' && input.codeLanguage) {
    prompt += `\n\nLANGUAGE: ${input.codeLanguage}`;
    if (input.expectedComplexity) {
      prompt += `\nEXPECTED COMPLEXITY: Time ${input.expectedComplexity.time}, Space ${input.expectedComplexity.space}`;
    }
    prompt += `\n\nEvaluate code for: correctness, efficiency, readability, edge cases, complexity analysis.`;
  }

  // Add voice explanation evaluation
  if (input.voiceExplanation) {
    const trimmedExplanation = truncateToTokens(input.voiceExplanation, 500);
    prompt += `\n\nVOICE EXPLANATION/APPROACH:\n${trimmedExplanation}\n\nEvaluate communication: Did they articulate their approach clearly? Identify correct data structure/algorithm? Discuss complexity? Mention edge cases?`;
  }

  prompt += `\n\nOUTPUT JSON:
{
  "score": 0-100,
  "isCorrect": true/false,
  "feedback": "Overall assessment",
  "strengths": ["strength1", "strength2"],
  "improvements": ["improvement1", "improvement2"]${input.answerMode === 'code' ? `,
  "codeAnalysis": {
    "correctness": 0-100,
    "efficiency": 0-100,
    "readability": 0-100,
    "timeComplexity": "O(?)",
    "spaceComplexity": "O(?)",
    "edgeCasesHandled": true/false,
    "suggestions": ["suggestion1"]
  }` : ''}${input.voiceExplanation ? `,
  "communicationScore": 0-100,
  "communicationFeedback": "Assessment of verbal explanation"` : ''}
}`;

  const result = await smartGenerate({
    prompt,
    systemPrompt: SYSTEM_PROMPT,
    feature: 'evaluate-answer',
    maxTokens: 2000,
  });

  const parsedResult = parseJsonResponse<EvaluateAnswerOutput>(result.content);
  
  // Validate output against schema at runtime
  const validated = EvaluationSchema.safeParse(parsedResult);
  if (!validated.success) {
    console.error('[evaluateInterviewAnswer] Invalid AI output:', validated.error);
    throw new Error('AI returned invalid evaluation format');
  }
  
  return validated.data;
}
