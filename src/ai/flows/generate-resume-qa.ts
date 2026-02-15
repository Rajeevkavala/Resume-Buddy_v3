'use server';

/**
 * @fileOverview Optimized resume Q&A generator using RAG-like approach.
 * Token optimized: ~50% reduction through focused context extraction.
 * Uses Smart Router: Routes to Llama 3.1 8B for cost efficiency.
 */

import { generate, parseJsonResponse, smartGenerate } from '@/ai';
import { z } from 'zod';

// ============ UTILITY FUNCTIONS ============
function truncateToTokens(text: string, maxTokens: number): string {
  const maxChars = maxTokens * 4;
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + '...';
}

function extractTopicContext(text: string, topic: string): string {
  const lines = text.split('\n');
  const topicKeywords: Record<string, string[]> = {
    'General': ['summary', 'profile', 'objective', 'overview'],
    'Technical': ['skill', 'technolog', 'language', 'framework', 'tool', 'software'],
    'Work Experience': ['experience', 'work', 'position', 'role', 'company', 'job'],
    'Projects': ['project', 'built', 'developed', 'created', 'implemented'],
    'Career Goals': ['goal', 'objective', 'aspir', 'seeking', 'looking'],
    'Education': ['education', 'degree', 'university', 'college', 'certif', 'course'],
  };
  
  const keywords = topicKeywords[topic] || [];
  const relevantLines = lines.filter(line => 
    keywords.some(kw => line.toLowerCase().includes(kw)) || line.trim().length > 50
  );
  
  return relevantLines.slice(0, 30).join('\n');
}

// ============ SCHEMAS ============
const GenerateResumeQAInputSchema = z.object({
  resumeText: z.string(),
  topic: z.enum(['General', 'Technical', 'Work Experience', 'Projects', 'Career Goals', 'Education']),
  numQuestions: z.number().min(3).max(10).default(5),
  userId: z.string().optional(),
});
export type GenerateResumeQAInput = z.infer<typeof GenerateResumeQAInputSchema>;

const QAPairSchema = z.object({
  question: z.string(),
  answer: z.string(),
  relatedSections: z.array(z.string()),
  keyPoints: z.array(z.string()),
});

const GenerateResumeQAOutputSchema = z.object({
  qaPairs: z.array(QAPairSchema),
});
export type GenerateResumeQAOutput = z.infer<typeof GenerateResumeQAOutputSchema>;

// ============ OPTIMIZED PROMPT ============
const SYSTEM_PROMPT = `Interview coach. Generate Q&A pairs with STAR-method answers. Output JSON only.`;

export async function generateResumeQA(input: GenerateResumeQAInput): Promise<GenerateResumeQAOutput> {
  // Extract topic-relevant context to reduce input size
  const topicContext = extractTopicContext(input.resumeText, input.topic);
  const trimmedResume = truncateToTokens(topicContext || input.resumeText, 800);

  const prompt = `Generate ${input.numQuestions} Q&A pairs for "${input.topic}" topic.

RESUME CONTEXT:
${trimmedResume}

FOR EACH Q&A:
1. Question: Challenging interviewer question probing the topic
2. Answer: STAR format (Situation→Task→Action→Result) with specific resume references
3. RelatedSections: Resume sections providing evidence
4. KeyPoints: Skills/achievements to emphasize

OUTPUT JSON:
{
  "qaPairs": [
    {
      "question": "string",
      "answer": "STAR-formatted response with specific examples",
      "relatedSections": ["Section 1", "Section 2"],
      "keyPoints": ["Key skill 1", "Achievement 1"]
    }
  ]
}`;

  // Use Smart Router - routes to Llama 3.1 8B for Q&A generation (cost efficient)
  const result = await smartGenerate({
    prompt,
    systemPrompt: SYSTEM_PROMPT,
    feature: 'resume-qa',
    maxTokens: 2500,
    userId: input.userId,
  });

  return parseJsonResponse<GenerateResumeQAOutput>(result.content);
}
