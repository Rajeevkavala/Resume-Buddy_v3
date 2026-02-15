'use server';

/**
 * @fileOverview AI-powered cover letter generation based on resume and job description.
 * Generates personalized, professional cover letters tailored to specific job applications.
 * Uses Smart Router: Routes to appropriate model based on complexity.
 */

import { smartGenerate, parseJsonResponse } from '@/ai';
import { z } from 'zod';

// ============ UTILITY FUNCTIONS ============
function truncateToTokens(text: string, maxTokens: number): string {
  const maxChars = maxTokens * 4;
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + '...';
}

function extractKeyInfo(resumeText: string): {
  name: string;
  email: string;
  phone: string;
  experience: string[];
  skills: string[];
} {
  const lines = resumeText.split('\n').filter(l => l.trim());
  
  // Try to extract name (usually first non-empty line)
  const name = lines[0]?.trim() || '';
  
  // Extract email
  const emailMatch = resumeText.match(/[\w.-]+@[\w.-]+\.\w+/);
  const email = emailMatch?.[0] || '';
  
  // Extract phone
  const phoneMatch = resumeText.match(/[\+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}/);
  const phone = phoneMatch?.[0] || '';
  
  // Extract experience keywords
  const experienceKeywords = resumeText.match(/(\d+\+?\s*years?|\d+\s*months?)/gi) || [];
  
  // Extract technical skills
  const techKeywords = [
    'javascript', 'typescript', 'python', 'java', 'react', 'node', 'sql', 'aws', 
    'docker', 'kubernetes', 'git', 'api', 'rest', 'graphql', 'mongodb', 'postgresql',
    'redis', 'linux', 'ci/cd', 'agile', 'scrum', 'machine learning', 'ai', 'c++', 'c#',
    'ruby', 'go', 'rust', 'swift', 'kotlin', 'flutter', 'angular', 'vue', 'next.js'
  ];
  const lowerText = resumeText.toLowerCase();
  const skills = techKeywords.filter(kw => lowerText.includes(kw));
  
  return {
    name,
    email,
    phone,
    experience: experienceKeywords.slice(0, 3),
    skills: skills.slice(0, 10),
  };
}

// ============ SCHEMAS (not exported - 'use server' files can only export async functions) ============
const GenerateCoverLetterInputSchema = z.object({
  resumeText: z.string().min(100, 'Resume text is too short'),
  jobDescription: z.string().min(50, 'Job description is too short'),
  companyName: z.string().optional(),
  hiringManagerName: z.string().optional(),
  tone: z.enum(['professional', 'enthusiastic', 'confident', 'conversational']).optional().default('professional'),
  userId: z.string().optional(),
});

const GenerateCoverLetterOutputSchema = z.object({
  coverLetter: z.string(),
  openingParagraph: z.string(),
  bodyParagraphs: z.array(z.string()),
  closingParagraph: z.string(),
  keyHighlights: z.array(z.string()),
  matchedSkills: z.array(z.string()),
  wordCount: z.number(),
  estimatedReadTime: z.string(),
});

// Types can be exported from 'use server' files (only runtime values like objects/functions are restricted)
export type GenerateCoverLetterInput = z.infer<typeof GenerateCoverLetterInputSchema>;
export type GenerateCoverLetterOutput = z.infer<typeof GenerateCoverLetterOutputSchema>;

// ============ OPTIMIZED PROMPTS ============
const SYSTEM_PROMPT = `You are an expert career coach and professional writer specializing in compelling cover letters that get interviews.

Your cover letters:
- Sound natural and human, NOT robotic or AI-generated
- Tell a story connecting the candidate's background to the role
- Use specific examples from the resume, not generic statements
- Are concise (250-400 words) but impactful
- Follow standard business letter format
- Avoid clichés like "I am writing to apply" or "I believe I am the perfect candidate"
- Start with a hook that grabs attention
- Show genuine enthusiasm without being over-the-top

Output valid JSON only.`;

export async function generateCoverLetter(
  input: GenerateCoverLetterInput
): Promise<GenerateCoverLetterOutput> {
  // Extract key info from resume to help personalize
  const keyInfo = extractKeyInfo(input.resumeText);
  
  // Truncate inputs to control token usage
  const trimmedResume = truncateToTokens(input.resumeText, 1200);
  const trimmedJD = truncateToTokens(input.jobDescription, 800);
  
  const companyName = input.companyName || 'the company';
  const hiringManager = input.hiringManagerName || 'Hiring Manager';
  const tone = input.tone || 'professional';

  const prompt = `Generate a compelling, human-sounding cover letter for this job application.

CANDIDATE RESUME:
${trimmedResume}

JOB DESCRIPTION:
${trimmedJD}

DETECTED INFO:
- Candidate Name: ${keyInfo.name || '[Name from resume]'}
- Key Skills: ${keyInfo.skills.join(', ') || 'Various technical skills'}
- Experience: ${keyInfo.experience.join(', ') || 'Multiple years'}

CUSTOMIZATION:
- Company Name: ${companyName}
- Hiring Manager: ${hiringManager}
- Tone: ${tone}

WRITING GUIDELINES:
1. Opening (2-3 sentences): Start with something interesting - a shared value, recent company news connection, or a brief story. Avoid "I am writing to apply..."

2. Body (2-3 paragraphs): 
   - Connect 2-3 specific achievements from the resume to job requirements
   - Use concrete numbers and results when available
   - Show you understand the company's challenges and can solve them
   - Demonstrate genuine interest in THIS specific role

3. Closing (2-3 sentences): Clear call to action, express enthusiasm for discussing further, professional sign-off

TONE GUIDANCE for "${tone}":
${tone === 'professional' ? '- Polished, formal but warm, focus on qualifications and fit' : ''}
${tone === 'enthusiastic' ? '- Energetic, passionate, shows excitement about the opportunity' : ''}
${tone === 'confident' ? '- Assertive, direct, highlights accomplishments boldly' : ''}
${tone === 'conversational' ? '- Friendly, approachable, like talking to a colleague' : ''}

OUTPUT FORMAT (JSON):
{
  "coverLetter": "Full cover letter text with proper formatting and line breaks",
  "openingParagraph": "Just the opening paragraph",
  "bodyParagraphs": ["First body paragraph", "Second body paragraph", "Optional third"],
  "closingParagraph": "Just the closing paragraph",
  "keyHighlights": ["3-5 key points the letter emphasizes"],
  "matchedSkills": ["Skills from JD that are addressed in the letter"],
  "wordCount": 300,
  "estimatedReadTime": "1-2 minutes"
}

IMPORTANT: The cover letter should feel like it was written by the candidate themselves, not by AI. Use natural language, varied sentence structure, and specific details.`;

  const result = await smartGenerate({
    feature: 'cover-letter',
    prompt,
    systemPrompt: SYSTEM_PROMPT,
    jsonMode: true,
  });

  const parsed = parseJsonResponse<GenerateCoverLetterOutput>(result.content);
  
  // Validate the response
  return GenerateCoverLetterOutputSchema.parse(parsed);
}
