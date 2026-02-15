'use server';

/**
 * @fileOverview Optimized resume analysis against job description.
 * Token optimized: ~50% reduction through compressed prompts and smart text extraction.
 * Uses Smart Router: Routes to GPT-OSS 20B / Gemini for balanced accuracy.
 */

import { generate, parseJsonResponse, smartGenerate } from '@/ai';
import { z } from 'zod';

// ============ UTILITY FUNCTIONS ============
function truncateToTokens(text: string, maxTokens: number): string {
  const maxChars = maxTokens * 4;
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + '...';
}

function extractKeywords(text: string): string[] {
  const techKeywords = [
    'javascript', 'typescript', 'python', 'java', 'react', 'node', 'sql', 'aws', 
    'docker', 'kubernetes', 'git', 'api', 'rest', 'graphql', 'mongodb', 'postgresql',
    'redis', 'linux', 'ci/cd', 'agile', 'scrum', 'machine learning', 'ai'
  ];
  const lowerText = text.toLowerCase();
  return techKeywords.filter(kw => lowerText.includes(kw));
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

// ============ SCHEMAS ============
const AnalyzeResumeContentInputSchema = z.object({
  resumeText: z.string(),
  jobDescription: z.string(),
  userId: z.string().optional(),
});
export type AnalyzeResumeContentInput = z.infer<typeof AnalyzeResumeContentInputSchema>;

const AnalyzeResumeContentOutputSchema = z.object({
  atsScore: z.number().min(0).max(100),
  contentCoveragePercentage: z.number().min(0).max(100),
  summary: z.string(),
  keywordAnalysis: z.object({
    presentKeywords: z.array(z.string()),
    missingKeywords: z.array(z.object({
      skill: z.string(),
      criticality: z.enum(["Critical", "High", "Medium", "Low"])
    })),
  }),
  actionVerbFeedback: z.string(),
  quantifiableResultsFeedback: z.string(),
  qualityMetrics: z.object({
    lengthScore: z.number().min(0).max(100),
    structureScore: z.number().min(0).max(100),
    readabilityScore: z.number().min(0).max(100),
    wordCount: z.number(),
  }),
  industryCompatibility: z.array(z.object({
    industry: z.string(),
    score: z.number().min(0).max(100),
    status: z.enum(["High", "Good", "Fair", "Low"]),
  })),
});
export type AnalyzeResumeContentOutput = z.infer<typeof AnalyzeResumeContentOutputSchema>;

// ============ OPTIMIZED PROMPTS ============
const SYSTEM_PROMPT = `You are an expert ATS (Applicant Tracking System) analyst and career coach. Provide thorough, accurate, and actionable resume analysis. Be specific and detailed in your feedback. Output valid JSON only.`;

export async function analyzeResumeContent(
  input: AnalyzeResumeContentInput
): Promise<AnalyzeResumeContentOutput> {
  // Pre-calculate metrics to reduce AI workload
  const wordCount = countWords(input.resumeText);
  const detectedKeywords = extractKeywords(input.resumeText);
  const jdKeywords = extractKeywords(input.jobDescription);
  
  // Truncate inputs to control token usage but keep enough for accuracy
  const trimmedResume = truncateToTokens(input.resumeText, 1500); // Increased for better analysis
  const trimmedJD = truncateToTokens(input.jobDescription, 800); // Increased for better matching

  const prompt = `Perform a THOROUGH and ACCURATE analysis of this resume against the job description.

RESUME (${wordCount} words):
${trimmedResume}

JOB DESCRIPTION:
${trimmedJD}

Pre-detected technical skills in resume: ${detectedKeywords.join(', ')}
Pre-detected technical skills in JD: ${jdKeywords.join(', ')}

ANALYZE CAREFULLY AND PROVIDE:

1. atsScore (0-100): Calculate ATS compatibility score based on:
   - Keyword matching with job description (40%)
   - Proper formatting and structure (20%)
   - Use of action verbs (15%)
   - Quantified achievements (15%)
   - Contact information completeness (10%)
   Be ACCURATE - don't inflate scores.

2. contentCoveragePercentage (0-100): What percentage of JD requirements does the resume address?
   - Count specific requirements mentioned in JD
   - Check how many are addressed in resume
   - Be precise in calculation

3. summary: Write 3-4 sentences covering:
   - Top 2 strengths of this resume for this role
   - Top 2 gaps or areas for improvement
   - Overall assessment

4. keywordAnalysis:
   - presentKeywords: List ALL relevant skills/keywords from JD that ARE in the resume
   - missingKeywords: List ALL important skills/keywords from JD that are MISSING from resume
     - Mark as "Critical" if it's in job title or first 3 requirements
     - Mark as "High" if mentioned multiple times in JD
     - Mark as "Medium" if mentioned once as requirement
     - Mark as "Low" if mentioned as preferred/nice-to-have

5. actionVerbFeedback: Analyze the action verbs used. Are they strong? (Developed, Led, Architected, Implemented) or weak? (Helped, Worked on, Was responsible for). Provide specific examples.

6. quantifiableResultsFeedback: Evaluate use of metrics and numbers. Count how many bullet points have quantified results (%, $, numbers). Suggest specific improvements.

7. qualityMetrics - CALCULATE BASED ON ACTUAL RESUME CONTENT:
   - lengthScore (0-100): 
     * Analyze actual word count: ${wordCount} words
     * Score 90-100 if optimal (400-700 words for 1 page, 700-1200 for 2 pages)
     * Score 70-89 if slightly long/short
     * Score 50-69 if too long (>1500) or too short (<300)
     * Score below 50 if severely inappropriate length
   - structureScore (0-100):
     * Check for clear sections (Education, Experience, Skills, etc.)
     * Verify consistent formatting and bullet points
     * Score based on how well organized the content is
   - readabilityScore (0-100):
     * Assess sentence clarity and professional language
     * Check for jargon overload or unclear descriptions
     * Evaluate if bullet points are concise and scannable
   - wordCount: ${wordCount}

8. industryCompatibility - ANALYZE BASED ON JOB DESCRIPTION AND RESUME:
   - First, identify the PRIMARY INDUSTRY from the job description (e.g., "Software/Technology", "Finance", "Healthcare", "E-commerce", "Consulting", etc.)
   - Then identify 2-3 RELATED industries where this candidate's skills would transfer
   - For EACH industry, calculate score based on:
     * Relevant experience mentioned in resume
     * Matching skills and technologies
     * Industry-specific terminology used
     * Domain knowledge demonstrated
   - Score meanings:
     * 85-100: High - Direct industry experience or perfect skill match
     * 70-84: Good - Strong transferable skills, some relevant experience
     * 55-69: Fair - Basic relevant skills, limited industry exposure
     * Below 55: Low - Minimal relevance to this industry
   - The PRIMARY industry from JD should typically score highest if resume matches well

IMPORTANT: Generate DYNAMIC values based on THIS SPECIFIC resume and job description. Do NOT use generic or placeholder values.

JSON OUTPUT (be thorough and accurate):
{
  "atsScore": number,
  "contentCoveragePercentage": number,
  "summary": "detailed 3-4 sentence summary",
  "keywordAnalysis": {
    "presentKeywords": ["all matching keywords"],
    "missingKeywords": [{"skill": "missing skill", "criticality": "Critical|High|Medium|Low"}]
  },
  "actionVerbFeedback": "detailed feedback with examples",
  "quantifiableResultsFeedback": "detailed feedback with suggestions",
  "qualityMetrics": {"lengthScore": number, "structureScore": number, "readabilityScore": number, "wordCount": ${wordCount}},
  "industryCompatibility": [{"industry": "Primary Industry from JD", "score": number, "status": "High|Good|Fair|Low"}, {"industry": "Related Industry 1", "score": number, "status": "High|Good|Fair|Low"}, {"industry": "Related Industry 2", "score": number, "status": "High|Good|Fair|Low"}]
}`;

  // Use Smart Router - routes to Gemini/GPT-OSS 20B for balanced accuracy in analysis
  const result = await smartGenerate({
    prompt,
    systemPrompt: SYSTEM_PROMPT,
    feature: 'resume-analysis',
    maxTokens: 3000,
    userId: input.userId,
  });

  return parseJsonResponse<AnalyzeResumeContentOutput>(result.content);
}
