'use server';

/**
 * @fileOverview Optimized job description structuring flow.
 * Token optimized: ~40% reduction through focused extraction.
 * Uses Smart Router: Routes to Llama 3.1 8B for fast parsing.
 */

import { generate, parseJsonResponse, smartGenerate } from '@/ai';
import { z } from 'zod';

// ============ UTILITY FUNCTIONS ============
function truncateToTokens(text: string, maxTokens: number): string {
  const maxChars = maxTokens * 4;
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + '...';
}

function cleanJobContent(content: string): string {
  // Remove excessive whitespace and common boilerplate
  return content
    .replace(/\s+/g, ' ')
    .replace(/equal opportunity employer[^.]*\./gi, '')
    .replace(/we are committed to[^.]*\./gi, '')
    .replace(/about (the )?company[:\s]*[^.]*\./gi, '')
    .trim();
}

// ============ SCHEMAS ============
const StructureJobDescriptionInputSchema = z.object({
  rawContent: z.string().min(100, 'Content too short'),
  url: z.string().optional(),
  userId: z.string().optional(),
});

const StructureJobDescriptionOutputSchema = z.object({
  jobTitle: z.string(),
  company: z.string().optional(),
  location: z.string().optional(),
  summary: z.string().optional(),
  responsibilities: z.array(z.string()),
  requiredSkills: z.array(z.string()),
  qualifications: z.array(z.string()),
  preferredSkills: z.array(z.string()).optional(),
  benefits: z.array(z.string()).optional(),
  salaryRange: z.string().optional(),
  employmentType: z.string().optional(),
  workMode: z.string().optional(),
  formattedDescription: z.string(),
});

export type StructureJobDescriptionInput = z.infer<typeof StructureJobDescriptionInputSchema>;
export type StructureJobDescriptionOutput = z.infer<typeof StructureJobDescriptionOutputSchema>;

// ============ OPTIMIZED PROMPT ============
const SYSTEM_PROMPT = `You are a professional job description analyst. Extract and structure job posting information comprehensively. Preserve all important details. Output valid JSON only.`;

export async function structureJobDescription(
  input: StructureJobDescriptionInput
): Promise<StructureJobDescriptionOutput> {
  const cleanedContent = cleanJobContent(input.rawContent);
  const trimmedContent = truncateToTokens(cleanedContent, 2500); // Increased for more detail

  const prompt = `Extract and structure this job posting into a COMPREHENSIVE, DETAILED format.

JOB POSTING CONTENT:
${trimmedContent}
${input.url ? `\nSOURCE URL: ${input.url}` : ''}

EXTRACT THE FOLLOWING (be thorough and detailed):

1. jobTitle: Exact job title from posting
2. company: Company name
3. location: Full location details
4. summary: 3-4 sentence overview of the role and what makes it unique

5. responsibilities: Extract ALL job duties and responsibilities (aim for 10-15 items)
   - Include day-to-day tasks
   - Include project-level responsibilities
   - Include collaboration requirements
   - Include any leadership/mentoring duties

6. requiredSkills: List ALL technical and soft skills mentioned as required (15-25 items)
   - Programming languages
   - Frameworks and libraries
   - Tools and platforms
   - Soft skills (communication, leadership, etc.)
   - Domain expertise

7. qualifications: ALL education, experience, and certification requirements (8-12 items)
   - Years of experience
   - Education requirements
   - Certifications
   - Industry experience

8. preferredSkills: Nice-to-have skills and bonus qualifications (5-10 items)

9. benefits: All mentioned benefits and perks

10. salaryRange: If mentioned, include full compensation details

11. employmentType: Full-time/Part-time/Contract/Internship

12. workMode: Remote/Hybrid/On-site with any details

13. formattedDescription: REQUIRED. Create a DETAILED, well-formatted job description text.
    - Combine all the above sections into a cohesive, professional job description.
    - Use markdown-style formatting (headers, bullet points).
    - Ensure it is at least 400 words long.
    - DO NOT return null or empty string.

OUTPUT JSON:
{
  "jobTitle": "string",
  "company": "string or null",
  "location": "string or null",
  "summary": "string or null",
  "responsibilities": ["detailed responsibility 1", "detailed responsibility 2", ...],
  "requiredSkills": ["skill1", "skill2", ...],
  "qualifications": ["qualification1", "qualification2", ...],
  "preferredSkills": ["skill1", "skill2", ...],
  "benefits": ["benefit1", "benefit2", ...],
  "salaryRange": "string or null",
  "employmentType": "string or null",
  "workMode": "string or null",
  "formattedDescription": "FULL JOB DESCRIPTION TEXT HERE (Required)"
}`;

  // Use Smart Router - routes to Llama 3.1 8B for fast JD parsing
  const result = await smartGenerate({
    prompt,
    systemPrompt: SYSTEM_PROMPT,
    feature: 'auto-fill-jd',
    maxTokens: 4000,
    userId: input.userId,
  });

  return parseJsonResponse<StructureJobDescriptionOutput>(result.content);
}
