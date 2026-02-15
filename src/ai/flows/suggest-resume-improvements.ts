'use server';

/**
 * @fileOverview Optimized resume improvement flow with impact forecasting.
 * Token optimized: ~45% reduction through smart context extraction and compressed prompts.
 * Uses Smart Router: Routes to Llama 3.3 70B for complex rewriting.
 */

import { generate, parseJsonResponse, smartGenerate } from '@/ai';
import { z } from 'zod';

// ============ UTILITY FUNCTIONS ============
function truncateToTokens(text: string, maxTokens: number): string {
  const maxChars = maxTokens * 4;
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + '...';
}

function extractKeyMetrics(resumeText: string): { bulletCount: number; quantifiedCount: number; actionVerbCount: number } {
  const bullets = resumeText.match(/^[\s]*[-•*]/gm) || [];
  const quantified = resumeText.match(/\d+%|\$[\d,]+|\d+\+?\s*(years?|months?|projects?|users?|clients?|team|people|million|thousand|k\b)/gi) || [];
  const actionVerbs = resumeText.match(/\b(developed|implemented|designed|led|managed|created|built|improved|increased|reduced|achieved|delivered|launched|optimized|architected|engineered|automated|streamlined|spearheaded|orchestrated)\b/gi) || [];
  return { bulletCount: bullets.length, quantifiedCount: quantified.length, actionVerbCount: actionVerbs.length };
}

function extractMissingSkills(jd: string, resume: string): string[] {
  const jdSkills = new Set(
    (jd.match(/\b(javascript|typescript|python|java|react|angular|vue|node|aws|azure|gcp|docker|kubernetes|sql|mongodb|graphql|rest|api|agile|scrum|ci\/cd|git|leadership|communication|problem.?solving)\b/gi) || [])
      .map(s => s.toLowerCase())
  );
  const resumeSkills = new Set(
    (resume.match(/\b(javascript|typescript|python|java|react|angular|vue|node|aws|azure|gcp|docker|kubernetes|sql|mongodb|graphql|rest|api|agile|scrum|ci\/cd|git|leadership|communication|problem.?solving)\b/gi) || [])
      .map(s => s.toLowerCase())
  );
  return Array.from(jdSkills).filter(s => !resumeSkills.has(s));
}

// ============ SCHEMAS ============
const ImpactForecastSchema = z.object({
  before: z.number(),
  after: z.number(),
});

const ResumeDataSchema = z.object({
  personalInfo: z.object({
    fullName: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    location: z.string().optional(),
    linkedin: z.string().optional(),
    github: z.string().optional(),
    portfolio: z.string().optional(),
    website: z.string().optional(),
  }),
  summary: z.string().optional(),
  skills: z.array(z.object({
    category: z.string(),
    items: z.array(z.string()),
  })),
  experience: z.array(z.object({
    title: z.string(),
    company: z.string(),
    location: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    current: z.boolean().optional(),
    achievements: z.array(z.string()),
  })),
  projects: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    technologies: z.array(z.string()).optional(),
    link: z.string().optional(),
    githubUrl: z.string().optional(),
    liveDemoUrl: z.string().optional(),
    achievements: z.array(z.string()),
  })),
  education: z.array(z.object({
    degree: z.string(),
    institution: z.string(),
    location: z.string().optional(),
    graduationDate: z.string().optional(),
    gpa: z.string().optional(),
    major: z.string().optional(),
    minor: z.string().optional(),
    honors: z.array(z.string()).optional(),
    relevantCoursework: z.array(z.string()).optional(),
  })),
  certifications: z.array(z.object({
    name: z.string(),
    issuer: z.string(),
    date: z.string(),
    expirationDate: z.string().optional(),
    credentialId: z.string().optional(),
    url: z.string().optional(),
  })).optional(),
  awards: z.array(z.object({
    title: z.string(),
    issuer: z.string(),
    date: z.string().optional(),
    description: z.string().optional(),
  })).optional(),
});

const SuggestResumeImprovementsInputSchema = z.object({
  resumeText: z.string(),
  jobDescription: z.string().optional(),
  previousAnalysis: z.object({
    atsScore: z.number().optional(),
    keywordAnalysis: z.object({
      presentKeywords: z.array(z.string()).optional(),
      missingKeywords: z.array(z.object({ skill: z.string(), criticality: z.string() })).optional(),
    }).optional(),
  }).optional(),
  userId: z.string().optional(),
});
export type SuggestResumeImprovementsInput = z.infer<typeof SuggestResumeImprovementsInputSchema>;

const SuggestResumeImprovementsOutputSchema = z.object({
  improvedResumeText: z.string(),
  structuredResumeData: ResumeDataSchema.optional(),
  improvementsSummary: z.string(),
  impactForecast: z.object({
    atsScore: ImpactForecastSchema,
    skillsMatch: ImpactForecastSchema,
    quantifiedAchievements: ImpactForecastSchema,
  }),
  quantifiedAchievements: z.array(z.object({
    original: z.string().optional(),
    improved: z.string(),
    section: z.string(),
  })),
  integratedSkills: z.array(z.object({
    skill: z.string(),
    integrationPoint: z.string(),
  })),
});
export type SuggestResumeImprovementsOutput = z.infer<typeof SuggestResumeImprovementsOutputSchema>;

// ============ OPTIMIZED PROMPT - FAANG RESUME REVIEWER ============
const SYSTEM_PROMPT = `You are a senior FAANG resume reviewer and ATS optimization expert with experience screening resumes at Google, Amazon, Meta, Apple, and Netflix. You have reviewed 10,000+ resumes and understand exactly what gets candidates past ATS systems and catches recruiter attention in 6-8 seconds. Transform resumes to be highly ATS-friendly (90+ score), suitable for Full Stack / SDE-1 roles, with quantified impact-driven bullets. Always use === section markers for clear structure. Content MUST fit on ONE A4 page. Output valid JSON only.

CRITICAL: You must return BOTH a text version ("improvedResumeText") AND a structured JSON version ("structuredResumeData"). The structured data must be complete and NOT contain placeholders.`;

export async function suggestResumeImprovements(
  input: SuggestResumeImprovementsInput
): Promise<SuggestResumeImprovementsOutput> {
  // Pre-calculate metrics to reduce AI workload
  const metrics = extractKeyMetrics(input.resumeText);
  const missingSkills = input.jobDescription 
    ? extractMissingSkills(input.jobDescription, input.resumeText) 
    : [];
  
  const prevAts = input.previousAnalysis?.atsScore || 65;
  const prevSkillsMatch = input.previousAnalysis?.keywordAnalysis?.presentKeywords?.length 
    ? Math.round((input.previousAnalysis.keywordAnalysis.presentKeywords.length / 
        (input.previousAnalysis.keywordAnalysis.presentKeywords.length + 
         (input.previousAnalysis.keywordAnalysis.missingKeywords?.length || 0))) * 100)
    : 60;

  // Truncate inputs - increased for better quality
  const trimmedResume = truncateToTokens(input.resumeText, 2000);
  const trimmedJD = input.jobDescription ? truncateToTokens(input.jobDescription, 800) : '';

  const prompt = `You are a senior FAANG resume reviewer and ATS optimization expert.

TASK:
Analyze and rewrite the following resume to make it:
1) Highly ATS-friendly (ATS score 90+)
2) Suitable for Full Stack / SDE-1 roles
3) Quantified, impact-driven, and concise
4) Free from buzzwords, fluff, and redundancy
5) Optimized for recruiters scanning in 6–8 seconds

ORIGINAL RESUME:
${trimmedResume}

${trimmedJD ? `TARGET JOB DESCRIPTION:\n${trimmedJD}\n` : ''}
SKILLS TO INTEGRATE (missing from resume): ${missingSkills.join(', ') || 'None identified'}

CURRENT METRICS: ATS=${prevAts}, Skills Match=${prevSkillsMatch}%, Bullet Points=${metrics.bulletCount}, Quantified Statements=${metrics.quantifiedCount}, Action Verbs=${metrics.actionVerbCount}

INSTRUCTIONS:
- Rewrite the Professional Summary to be sharp, role-focused, and metric-driven (2–3 lines max, 50-75 words)
- Improve all bullet points using the formula: Action Verb + What You Built + Tech Used + Measurable Impact
- Remove unrealistic or generic claims (e.g., 99.9% uptime unless justified)
- Ensure consistency in tense, formatting, and metrics
- Reduce over-listing of tools; prioritize relevance
- Highlight problem-solving, scalability, and ownership
- Keep resume to ONE PAGE (critical for ATS and recruiters)
- Do NOT invent experience; only rephrase and optimize existing content
- Use strong action verbs and numbers wherever possible
- Optimize keywords for ATS systems (LinkedIn, Greenhouse, Lever)

CREATE COMPLETE RESUME using this EXACT format:

=== [FULL NAME] ===
[Email] | [Phone] | [Location]
[LinkedIn URL] | [GitHub URL]

=== PROFESSIONAL SUMMARY ===
[2-3 lines ONLY. Format: "X years of experience in [core skills]. Built [specific achievement with metric]. Expertise in [2-3 key technologies]." NO buzzwords like "passionate", "dedicated", "team player".]

=== TECHNICAL SKILLS ===
Languages: [Python, JavaScript, TypeScript, Java, etc.]
Frontend: [React, Next.js, Angular, Vue.js, HTML/CSS]
Backend: [Node.js, Express, Django, Spring Boot, REST APIs, GraphQL]
Databases: [PostgreSQL, MongoDB, MySQL, Redis]
Cloud & DevOps: [AWS, GCP, Azure, Docker, Kubernetes, CI/CD]
Tools: [Git, JIRA, Figma, etc.]

=== PROFESSIONAL EXPERIENCE ===
[JOB TITLE] | [COMPANY] | [LOCATION] | [MMM YYYY – MMM YYYY or Present]
• [ACTION VERB] + [what you built/did] + [tech stack] + [quantified impact: X% improvement, $XK saved, X users served]
• [ACTION VERB] + [problem solved] + [approach used] + [measurable outcome]
• [ACTION VERB] + [scale/scope: led team of X, handled X requests/day] + [result]
[Maximum 3-4 bullets per role, 1-2 lines each]

=== PROJECTS ===
[PROJECT NAME] | Technologies: [React, Node.js, MongoDB, etc.]
• Description: [ONE line what it does + who it serves]
• Achievement: [Key achievement/feature #1 with metric if possible]
• Achievement: [Key achievement/feature #2 with metric if possible]
• GitHub: [URL if available] | Live: [URL if available]
[Maximum 2-3 projects]

=== EDUCATION ===
[DEGREE] in [MAJOR] | [UNIVERSITY] | [CITY, STATE/COUNTRY] | [Expected/Graduated: MMM YYYY]
[Only include: GPA if >3.5, Relevant Coursework, Honors/Awards]

=== CERTIFICATIONS ===
• [Certification Name] – [Issuing Organization] – [Year]

STRICT RULES:
1. EVERY bullet MUST start with a power verb: Architected, Engineered, Developed, Implemented, Optimized, Automated, Deployed, Scaled, Reduced, Increased, Led, Designed, Built, Integrated, Migrated, Streamlined
2. QUANTIFY 80%+ of bullets with specific metrics: %, $, users, requests/sec, latency reduction, time saved
3. NO filler words: "successfully", "effectively", "various", "responsible for", "helped with"
4. NO generic claims without proof: "improved performance" → "Reduced API latency by 40% from 200ms to 120ms"
5. Use consistent tense: Past tense for previous roles, present for current
6. Keep technical terms ATS-friendly: "React.js" not "ReactJS", "Node.js" not "nodejs"
7. Prioritize FAANG-valued skills: System Design, Scalability, Performance, Data Structures, Algorithms
8. Maximum ONE PAGE - cut less impactful content if needed
9. For EACH project: include 1 Description line + 2 Achievement lines. If a GitHub/Live URL is not present in the source resume, omit that URL (do NOT fabricate links).

OUTPUT JSON:
{
  "improvedResumeText": "COMPLETE rewritten resume with ALL sections using === headers",
  "structuredResumeData": {
    "personalInfo": { "fullName": "...", "email": "...", "phone": "...", "location": "...", "linkedin": "...", "github": "..." },
    "summary": "...",
    "skills": [{ "category": "Languages", "items": ["Java", "Python"] }],
    "experience": [{ "title": "...", "company": "...", "location": "...", "startDate": "...", "endDate": "...", "current": false, "achievements": ["..."] }],
    "projects": [{ "name": "...", "description": "...", "technologies": ["..."], "githubUrl": "...", "liveDemoUrl": "...", "achievements": ["..."] }],
    "education": [{ "degree": "...", "institution": "...", "location": "...", "graduationDate": "...", "gpa": "...", "major": "...", "relevantCoursework": ["..."] }],
    "certifications": [{ "name": "...", "issuer": "...", "date": "...", "expirationDate": "...", "credentialId": "...", "url": "..." }]
  },
  "improvementsSummary": "4-5 sentences explaining: (1) key improvements made, (2) ATS optimizations, (3) quantification additions, (4) removed fluff/redundancy",
  "impactForecast": {
    "atsScore": {"before": ${prevAts}, "after": [projected score 85-95]},
    "skillsMatch": {"before": ${prevSkillsMatch}, "after": [projected match %]},
    "quantifiedAchievements": {"before": ${metrics.quantifiedCount}, "after": [new count]}
  },
  "quantifiedAchievements": [{"original": "vague statement", "improved": "quantified version", "section": "Experience/Projects"}],
  "integratedSkills": [{"skill": "missing skill added", "integrationPoint": "where it was added naturally"}]
}`;

  // Use Smart Router - routes to Llama 3.3 70B for complex resume rewriting
  const result = await smartGenerate({
    prompt,
    systemPrompt: SYSTEM_PROMPT,
    feature: 'resume-improvement',
    maxTokens: 7000,
    userId: input.userId,
  });

  return parseJsonResponse<SuggestResumeImprovementsOutput>(result.content);
}
