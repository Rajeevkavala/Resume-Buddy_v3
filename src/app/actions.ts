
'use server';

import {z} from 'zod';
import {analyzeResumeContent} from '@/ai/flows/analyze-resume-content';
import type { GenerateInterviewQuestionsInput } from '@/ai/flows/generate-interview-questions';
import {generateInterviewQuestions} from '@/ai/flows/generate-interview-questions';
import {generateResumeQA} from '@/ai/flows/generate-resume-qa';
import {suggestResumeImprovements} from '@/ai/flows/suggest-resume-improvements';
import {structureJobDescription} from '@/ai/flows/structure-job-description';
import {parseResumeIntelligently} from '@/ai/flows/parse-resume-intelligently';
import {generateCoverLetter} from '@/ai/flows/generate-cover-letter';
import type { GenerateCoverLetterOutput } from '@/ai/flows/generate-cover-letter';
import {generateInterviewSession} from '@/ai/flows/generate-interview-session';
import type {GenerateInterviewSessionInput} from '@/ai/flows/generate-interview-session';
import {generateDSAQuestions} from '@/ai/flows/generate-dsa-questions';
import type {DSAQuestionInput} from '@/ai/flows/generate-dsa-questions';
import {evaluateInterviewAnswer} from '@/ai/flows/evaluate-interview-answer';
import type {EvaluateAnswerInput} from '@/ai/flows/evaluate-interview-answer';
import {generateFollowUpQuestion} from '@/ai/flows/generate-follow-up-question';
import type {FollowUpInput} from '@/ai/flows/generate-follow-up-question';
import {evaluateCodeSolution} from '@/ai/flows/evaluate-code-solution';
import type {EvaluateCodeInput} from '@/ai/flows/evaluate-code-solution';
import {Packer, Document, Paragraph, TextRun, HeadingLevel} from 'docx';
import mammoth from 'mammoth';
import pdf from 'pdf-parse-fork';
import { saveData as saveToDb, clearData as clearFromDb, loadData as loadFromDb, updateUserProfileInDb } from '@/lib/data-persistence';
import type { AnalysisResult, JobRole } from '@/lib/types';
import type { AnalyzeResumeContentOutput } from '@/ai/flows/analyze-resume-content';
// Firebase Storage import removed — profile photos use Supabase (client-side)
import axios from 'axios';
import * as cheerio from 'cheerio';
import { getJobDescriptionForRole, shouldUsePreset } from '@/lib/job-description-presets';
import { enforceRateLimitAsync } from '@/lib/rate-limiter';
import { prisma } from '@/lib/db';
import { uploadFile } from '@/lib/storage';
import { 
  assertFeatureAllowed, 
  enforceExportLimit, 
  getSubscriptionState,
  checkExportLimit,
} from '@/lib/subscription-service';
import {
  createInterviewSession,
  saveSessionQuestions,
  saveSessionAnswer,
  updateInterviewSession,
} from '@/lib/interview-service';
import type {
  InterviewSession,
  InterviewQuestion,
  InterviewAnswer,
} from '@/lib/types/interview';
import type { SubscriptionState } from '@/lib/types/subscription';

const baseSchema = z.object({
  userId: z.string().min(1, 'User ID is required.'),
  resumeText: z
    .string()
    .min(100, 'Resume text is too short. Please provide a more detailed resume.'),
  jobDescription: z
    .string()
    .optional(),
  jobRole: z.string().optional(),
});

// ============ Timeout Utility for AI Calls ============
const AI_CALL_TIMEOUT_MS = 60_000; // 60 seconds max for any AI call

function withTimeout<T>(promise: Promise<T>, timeoutMs = AI_CALL_TIMEOUT_MS, label = 'AI call'): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs / 1000}s. Please try again.`)), timeoutMs)
    ),
  ]);
}

const qaSchema = baseSchema.extend({
    topic: z.enum([
    "General",
    "Technical",
    "Work Experience",
    "Projects",
    "Career Goals",
    "Education",
  ]),
  numQuestions: z.number().min(3).max(10),
})

const interviewSchema = baseSchema.extend({
  interviewType: z.enum(["Technical", "Behavioral", "Leadership", "General"]),
  difficultyLevel: z.enum(["Entry", "Mid", "Senior", "Executive"]),
  numQuestions: z.number().min(3).max(15),
});

export async function extractText(
  formData: FormData
): Promise<{text?: string; error?: string}> {
  const file = formData.get('resume') as File | null;

  if (!file) {
    return {error: 'No file uploaded.'};
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    if (file.type === 'application/pdf') {
      const data = await pdf(buffer);
      return {text: data.text};
    } else if (
      file.type ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      const result = await mammoth.extractRawText({buffer});
      return {text: result.value};
    } else if (file.type === 'text/plain') {
      return {text: buffer.toString('utf8')};
    } else {
      return {
        error:
          'Unsupported file type. Please upload a PDF, DOCX, or TXT file.',
      };
    }
  } catch (error) {
    return {error: 'Failed to extract text from the file.'};
  }
}

export async function saveData(
  userId: string,
  data: Partial<AnalysisResult>
) {
  return saveToDb(userId, data);
}

export async function clearData(userId: string) {
  return clearFromDb(userId);
}

/**
 * Load resume data from PostgreSQL for a user.
 * Called when user logs in and localStorage cache is empty.
 */
export async function loadResumeDataAction(userId: string): Promise<AnalysisResult | null> {
  if (!userId) return null;
  try {
    return await loadFromDb(userId);
  } catch (error) {
    console.error('Error loading resume data:', error);
    return null;
  }
}

export async function runAnalysisAction(input: {
  userId: string;
  resumeText: string;
  jobDescription?: string;
  jobRole?: JobRole | '';
  jobUrl?: string;
}) {
  const validatedFields = baseSchema.safeParse(input);
  if (!validatedFields.success) {
    throw new Error(validatedFields.error.errors.map(e => e.message).join(', '));
  }
  
  // Check rate limit before proceeding (includes daily limit check - persisted in Firestore)
  await enforceRateLimitAsync(input.userId, 'analyze-resume');
  
  // Determine the job description to use
  let finalJobDescription = input.jobDescription || '';
  const jobRoleValue = (input.jobRole && input.jobRole.length > 0 ? input.jobRole : undefined) as JobRole | undefined;
  
  // Use preset if job description is missing or too short and a role is selected
  if (shouldUsePreset(finalJobDescription, jobRoleValue)) {
    if (jobRoleValue) {
      finalJobDescription = getJobDescriptionForRole(jobRoleValue);
    } else {
      throw new Error('Please provide either a job description or select a target role.');
    }
  }
  
  const analysis = await withTimeout(
    analyzeResumeContent({
      resumeText: validatedFields.data.resumeText,
      jobDescription: finalJobDescription,
      userId: input.userId,
    }),
    AI_CALL_TIMEOUT_MS,
    'Resume analysis'
  );
  
  // Prepare data for saving - exclude undefined values
  const dataToSave: any = { 
    analysis, 
    resumeText: input.resumeText, 
    jobDescription: finalJobDescription,
  };
  
  if (jobRoleValue) {
    dataToSave.jobRole = jobRoleValue;
  }
  
  if (input.jobUrl) {
    dataToSave.jobUrl = input.jobUrl;
  }
  
  await saveToDb(input.userId, dataToSave);
  return analysis;
}

export async function runQAGenerationAction(input: {
  userId: string;
  resumeText: string;
  jobDescription?: string;
  topic: "General" | "Technical" | "Work Experience" | "Projects" | "Career Goals" | "Education";
  numQuestions: number;
  jobRole?: JobRole | '';
  jobUrl?: string;
}) {
  const validatedFields = qaSchema.safeParse(input);
  if (!validatedFields.success) {
    throw new Error(validatedFields.error.errors.map(e => e.message).join(', '));
  }
  
  // Check feature access - Q&A is Pro only
  await assertFeatureAllowed(input.userId, 'generate-qa');
  
  // Check rate limit before proceeding (includes daily limit check - persisted in Firestore)
  await enforceRateLimitAsync(input.userId, 'generate-qa');
  
  // Determine the job description to use
  let finalJobDescription = input.jobDescription || '';
  const jobRoleValue = (input.jobRole && input.jobRole.length > 0 ? input.jobRole : undefined) as JobRole | undefined;
  
  // Use preset if job description is missing or too short and a role is selected
  if (shouldUsePreset(finalJobDescription, jobRoleValue)) {
    if (jobRoleValue) {
      finalJobDescription = getJobDescriptionForRole(jobRoleValue);
    }
  }
  
  const qaResult = await withTimeout(
    generateResumeQA({
      resumeText: validatedFields.data.resumeText,
      topic: validatedFields.data.topic,
      numQuestions: validatedFields.data.numQuestions,
      userId: input.userId,
    }),
    AI_CALL_TIMEOUT_MS,
    'QA generation'
  );

  // Prepare data for saving - exclude undefined values
  const dataToSave: any = {
      [`qa.${input.topic}`]: qaResult,
      resumeText: input.resumeText,
      jobDescription: finalJobDescription,
  };
  
  if (jobRoleValue) {
    dataToSave.jobRole = jobRoleValue;
  }
  
  if (input.jobUrl) {
    dataToSave.jobUrl = input.jobUrl;
  }

  await saveToDb(input.userId, dataToSave);
  return qaResult;
}

export async function runInterviewGenerationAction(input: GenerateInterviewQuestionsInput & { userId: string; jobRole?: JobRole | ''; jobUrl?: string; jobDescription?: string }) {
  const validatedFields = interviewSchema.safeParse(input);
  if (!validatedFields.success) {
    throw new Error(validatedFields.error.errors.map(e => e.message).join(', '));
  }
  
  // Check feature access - Interview Questions is Pro only
  await assertFeatureAllowed(input.userId, 'generate-questions');
  
  // Check rate limit before proceeding (includes daily limit check - persisted in Firestore)
  await enforceRateLimitAsync(input.userId, 'generate-questions');
  
  // Determine the job description to use
  let finalJobDescription = input.jobDescription || '';
  const jobRoleValue = (input.jobRole && input.jobRole.length > 0 ? input.jobRole : undefined) as JobRole | undefined;
  
  // Use preset if job description is missing or too short and a role is selected
  if (shouldUsePreset(finalJobDescription, jobRoleValue)) {
    if (jobRoleValue) {
      finalJobDescription = getJobDescriptionForRole(jobRoleValue);
    } else {
      throw new Error('Please provide either a job description or select a target role.');
    }
  }
  
  const interview = await withTimeout(
    generateInterviewQuestions({
      resumeText: validatedFields.data.resumeText,
      jobDescription: finalJobDescription,
      numQuestions: validatedFields.data.numQuestions,
      interviewType: validatedFields.data.interviewType,
      difficultyLevel: validatedFields.data.difficultyLevel,
      userId: input.userId,
    }),
    AI_CALL_TIMEOUT_MS,
    'Interview question generation'
  );
  
  // Prepare data for saving - exclude undefined values
  const dataToSave: any = { 
    interview, 
    resumeText: input.resumeText, 
    jobDescription: finalJobDescription,
  };
  
  if (jobRoleValue) {
    dataToSave.jobRole = jobRoleValue;
  }
  
  if (input.jobUrl) {
    dataToSave.jobUrl = input.jobUrl;
  }
  
  await saveToDb(input.userId, dataToSave);
  return interview;
}

// ============ ENHANCED INTERVIEW SESSION ACTIONS ============

const startInterviewSessionSchema = z.object({
  userId: z.string().min(1),
  type: z.enum(['dsa', 'behavioral', 'technical', 'system-design']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  questionCount: z.number().int().min(1).max(20),
  answerFormat: z.enum(['mcq', 'text', 'voice', 'code']).optional(),
  codeLanguage: z.string().optional(),
  dsaCategories: z.array(z.string()).optional(),
  resumeText: z.string().optional(),
  jobDescription: z.string().optional(),
});

export async function startInterviewSessionAction(input: {
  userId: string;
  type: 'dsa' | 'behavioral' | 'technical' | 'system-design';
  difficulty: 'easy' | 'medium' | 'hard';
  questionCount: number;
  answerFormat?: 'mcq' | 'text' | 'voice' | 'code';
  codeLanguage?: string;
  dsaCategories?: string[];
  resumeText?: string;
  jobDescription?: string;
}) {
  // Runtime validation
  const validated = startInterviewSessionSchema.safeParse(input);
  if (!validated.success) {
    throw new Error(validated.error.errors.map(e => e.message).join(', '));
  }
  
  // Check feature access
  await assertFeatureAllowed(input.userId, 'generate-questions');
  await enforceRateLimitAsync(input.userId, 'interview-session');

  if (input.type === 'dsa') {
    return generateDSAQuestions({
      difficulty: input.difficulty,
      categories: input.dsaCategories,
      count: input.questionCount,
      codeLanguage: (input.codeLanguage as 'javascript' | 'python' | 'java' | 'cpp') || 'javascript',
      resumeText: input.resumeText,
    });
  }

  return generateInterviewSession({
    type: input.type,
    difficulty: input.difficulty,
    questionCount: input.questionCount,
    answerFormat: input.answerFormat || 'text',
    resumeText: input.resumeText,
    jobDescription: input.jobDescription,
  });
}

export async function evaluateAnswerAction(input: EvaluateAnswerInput & { userId: string }) {
  await enforceRateLimitAsync(input.userId, 'evaluate-answer');

  const { userId, ...evaluateInput } = input;
  return evaluateInterviewAnswer(evaluateInput);
}

export async function evaluateCodeAction(input: EvaluateCodeInput & { userId: string }) {
  await enforceRateLimitAsync(input.userId, 'evaluate-code');

  const { userId, ...codeInput } = input;
  return evaluateCodeSolution(codeInput);
}

export async function getFollowUpAction(input: FollowUpInput & { userId: string }) {
  await enforceRateLimitAsync(input.userId, 'follow-up-question');

  const { userId, ...followUpInput } = input;
  return generateFollowUpQuestion(followUpInput);
}

// --- Interview persistence (server-side) ---

export async function persistInterviewSessionAction(input: {
  userId: string;
  session: InterviewSession;
}) {
  await enforceRateLimitAsync(input.userId, 'interview-session');
  await createInterviewSession(input.session);
  return { ok: true };
}

export async function persistInterviewQuestionsAction(input: {
  userId: string;
  sessionId: string;
  questions: InterviewQuestion[];
}) {
  await enforceRateLimitAsync(input.userId, 'interview-session');
  await saveSessionQuestions(input.sessionId, input.questions);
  return { ok: true };
}

export async function persistInterviewAnswerAction(input: {
  userId: string;
  sessionId: string;
  answer: InterviewAnswer;
}) {
  await enforceRateLimitAsync(input.userId, 'interview-session');
  await saveSessionAnswer(input.sessionId, input.answer);
  return { ok: true };
}

export async function persistInterviewSessionUpdateAction(input: {
  userId: string;
  sessionId: string;
  updates: Partial<Pick<InterviewSession, 'status' | 'progress' | 'timing' | 'difficulty'>>;
}) {
  await enforceRateLimitAsync(input.userId, 'interview-session');
  await updateInterviewSession(input.sessionId, input.updates);
  return { ok: true };
}

export async function runImprovementsGenerationAction(input: {
  userId: string;
  resumeText: string;
  jobDescription?: string;
  previousAnalysis?: AnalyzeResumeContentOutput | null;
  jobRole?: JobRole | '';
  jobUrl?: string;
}) {
  const validatedFields = baseSchema.safeParse(input);
  if (!validatedFields.success) {
    throw new Error(validatedFields.error.errors.map(e => e.message).join(', '));
  }
  
  // Check rate limit before proceeding (includes daily limit check - persisted in Firestore)
  await enforceRateLimitAsync(input.userId, 'improve-resume');
  
  // Determine the job description to use
  let finalJobDescription = input.jobDescription || '';
  const jobRoleValue = (input.jobRole && input.jobRole.length > 0 ? input.jobRole : undefined) as JobRole | undefined;
  
  // Use preset if job description is missing or too short and a role is selected
  if (shouldUsePreset(finalJobDescription, jobRoleValue)) {
    if (jobRoleValue) {
      finalJobDescription = getJobDescriptionForRole(jobRoleValue);
    } else {
      throw new Error('Please provide either a job description or select a target role.');
    }
  }
  
  const improvements = await withTimeout(
    suggestResumeImprovements({
      resumeText: validatedFields.data.resumeText,
      jobDescription: finalJobDescription,
      previousAnalysis: input.previousAnalysis || undefined,
      userId: input.userId,
    }),
    AI_CALL_TIMEOUT_MS,
    'Improvement suggestions'
  );
  
  // Prepare data for saving - exclude undefined values
  const dataToSave: any = { 
    improvements, 
    resumeText: input.resumeText, 
    jobDescription: finalJobDescription,
  };
  
  if (jobRoleValue) {
    dataToSave.jobRole = jobRoleValue;
  }
  
  if (input.jobUrl) {
    dataToSave.jobUrl = input.jobUrl;
  }
  
  await saveToDb(input.userId, dataToSave);

  const maybeImprovedText =
    improvements && typeof improvements === 'object' && 'improvedResumeText' in improvements
      ? (improvements as { improvedResumeText?: unknown }).improvedResumeText
      : null;

  if (typeof maybeImprovedText === 'string' && maybeImprovedText.trim().length > 0) {
    try {
      const activeResume = await prisma.resumeData.findFirst({
        where: { userId: input.userId, isActive: true },
        orderBy: { updatedAt: 'desc' },
        select: { id: true },
      });

      if (activeResume) {
        const improvedFilename = `improved-resume-${Date.now()}.txt`;
        const improvedBuffer = Buffer.from(maybeImprovedText, 'utf-8');
        const uploadResult = await uploadFile(
          input.userId,
          improvedBuffer,
          improvedFilename,
          'text/plain',
          'generated',
        );

        await prisma.storedFile.deleteMany({
          where: {
            userId: input.userId,
            resumeDataId: activeResume.id,
            filename: { startsWith: 'improved-resume-' },
          },
        });

        await prisma.storedFile.create({
          data: {
            userId: input.userId,
            resumeDataId: activeResume.id,
            filename: improvedFilename,
            originalName: 'improved-resume.txt',
            mimeType: 'text/plain',
            size: improvedBuffer.length,
            bucket: uploadResult.bucket,
            objectKey: uploadResult.objectKey,
            metadata: {
              kind: 'improved-resume-text',
              source: 'runImprovementsGenerationAction',
            },
          },
        });
      }
    } catch (storageError) {
      console.error('Failed to persist improved resume text file:', storageError);
    }
  }

  return improvements;
}

// Cover letter schema
const coverLetterSchema = z.object({
  userId: z.string().min(1, 'User ID is required.'),
  resumeText: z.string().min(100, 'Resume text is too short.'),
  jobDescription: z.string().min(50, 'Job description is too short.'),
  companyName: z.string().optional(),
  hiringManagerName: z.string().optional(),
  tone: z.enum(['professional', 'enthusiastic', 'confident', 'conversational']).optional(),
  jobRole: z.string().optional(),
});

export async function runCoverLetterGenerationAction(input: {
  userId: string;
  resumeText: string;
  jobDescription: string;
  companyName?: string;
  hiringManagerName?: string;
  tone?: 'professional' | 'enthusiastic' | 'confident' | 'conversational';
  jobRole?: JobRole | '';
}): Promise<GenerateCoverLetterOutput> {
  const validatedFields = coverLetterSchema.safeParse(input);
  if (!validatedFields.success) {
    throw new Error(validatedFields.error.errors.map(e => e.message).join(', '));
  }
  
  // Check rate limit before proceeding (includes daily limit check - persisted in Firestore)
  await enforceRateLimitAsync(input.userId, 'generate-cover-letter');
  
  // Determine the job description to use
  let finalJobDescription = input.jobDescription || '';
  const jobRoleValue = (input.jobRole && input.jobRole.length > 0 ? input.jobRole : undefined) as JobRole | undefined;
  
  // Use preset if job description is missing or too short and a role is selected
  if (shouldUsePreset(finalJobDescription, jobRoleValue)) {
    if (jobRoleValue) {
      finalJobDescription = getJobDescriptionForRole(jobRoleValue);
    } else {
      throw new Error('Please provide either a job description or select a target role.');
    }
  }
  
  const coverLetter = await withTimeout(
    generateCoverLetter({
      resumeText: validatedFields.data.resumeText,
      jobDescription: finalJobDescription,
      companyName: input.companyName,
      hiringManagerName: input.hiringManagerName,
      tone: input.tone || 'professional',
      userId: input.userId,
    }),
    AI_CALL_TIMEOUT_MS,
    'Cover letter generation'
  );
  
  // Save to database
  const dataToSave: any = { 
    coverLetter, 
    resumeText: input.resumeText, 
    jobDescription: finalJobDescription,
  };
  
  if (jobRoleValue) {
    dataToSave.jobRole = jobRoleValue;
  }
  
  await saveToDb(input.userId, dataToSave);
  return coverLetter;
}

export async function updateUserProfile(userId: string, formData: FormData): Promise<{ displayName: string; photoURL?: string }> {
  const displayName = formData.get('displayName') as string;
  const photoURL = formData.get('photoURL') as string | null; // Now expecting the URL from client-side Supabase upload

  if (!userId) {
    throw new Error('User ID is required.');
  }

  const profileData: { displayName?: string; photoURL?: string } = {};
  if (displayName) {
    profileData.displayName = displayName;
  }
  if (photoURL) {
    profileData.photoURL = photoURL;
  }
  
  if (Object.keys(profileData).length > 0) {
    await updateUserProfileInDb(userId, profileData);
  }

  return {
    displayName: displayName,
    photoURL: photoURL || undefined,
  };
}

export async function exportDocx(text: string) {
  if (!text || text.trim().length === 0) {
    throw new Error('Resume text is empty');
  }

  // Parse the text into sections and format accordingly
  const sections = text.split('\n\n');
  const paragraphs: Paragraph[] = [];

  for (const section of sections) {
    const lines = section.split('\n').filter(line => line.trim());
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Detect headers (all caps, ends with colon, or starts with ###)
      const isHeader = line === line.toUpperCase() || 
                      line.endsWith(':') || 
                      line.startsWith('#');
      
      // Clean markdown
      const cleanLine = line.replace(/^#+\s*/, '').replace(/\*\*/g, '');
      
      if (isHeader) {
        // Create header paragraph
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: cleanLine,
                bold: true,
                size: 28, // 14pt
                color: '1a1a1a',
              })
            ],
            spacing: {
              before: i === 0 ? 0 : 200, // Extra space before headers (except first)
              after: 100,
            },
            heading: HeadingLevel.HEADING_2,
          })
        );
      } else {
        // Regular paragraph with better formatting
        // Check if it's a bullet point
        const isBullet = line.startsWith('•') || line.startsWith('-') || line.startsWith('*');
        const displayText = isBullet ? cleanLine.replace(/^[•\-*]\s*/, '') : cleanLine;
        
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: displayText,
                size: 22, // 11pt
                color: '333333',
              })
            ],
            spacing: {
              before: 40,
              after: 40,
            },
            bullet: isBullet ? { level: 0 } : undefined,
          })
        );
      }
    }
    
    // Add spacing between sections
    if (sections.indexOf(section) < sections.length - 1) {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun('')],
          spacing: { before: 100, after: 100 },
        })
      );
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,    // 0.5 inch
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
        },
        children: paragraphs,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer.toString('base64');
}

const latexCompileFromResumeDataInputSchema = z.object({
  userId: z.string().min(1, 'User ID is required.'),
  templateId: z.string().min(1, 'Template ID is required.'),
  resumeData: z.unknown(),
});

const latexCompileFromResumeTextInputSchema = z.object({
  userId: z.string().min(1, 'User ID is required.'),
  templateId: z.string().min(1, 'Template ID is required.'),
  resumeText: z.string().min(1, 'Resume text is required.'),
});

const latexCompileServiceSuccessSchema = z
  .object({
    latexSource: z.string().min(1),
    pdfBase64: z.string().min(1),
    warnings: z.array(z.string()).optional(),
  })
  .passthrough();

const latexCompileServiceErrorSchema = z
  .union([
    // Current service shape
    z
      .object({
        ok: z.literal(false).optional(),
        error: z.string().min(1),
        message: z.string().min(1).optional(),
        details: z.unknown().optional(),
      })
      .passthrough(),
    // Legacy/alternate shape
    z
      .object({
        error: z
          .object({
            code: z.string().optional(),
            message: z.string().optional(),
            details: z.unknown().optional(),
          })
          .passthrough(),
      })
      .passthrough(),
  ])
  ;

function getLatexServiceUrl(): string {
  const url = process.env.LATEX_SERVICE_URL;
  if (!url || url.trim().length === 0) {
    throw new Error(
      'LATEX_SERVICE_URL is not configured. Set LATEX_SERVICE_URL in the server environment to enable LaTeX export.'
    );
  }
  return url.replace(/\/+$/, '');
}

function sanitizeLatexFileBaseName(input: string | undefined | null): string {
  const fallback = 'Resume';
  if (!input) return fallback;

  const normalized = input
    .normalize('NFKD')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .replace(/[\\/]/g, '-')
    .replace(/[:*?"<>|]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const safe = normalized.length > 0 ? normalized : fallback;
  return safe.slice(0, 80);
}

function tryDeriveFileBaseNameFromResumeData(resumeData: unknown): string | undefined {
  if (!resumeData || typeof resumeData !== 'object') return undefined;
  const maybeAny = resumeData as any;
  const fullName = maybeAny?.personalInfo?.fullName;
  if (typeof fullName === 'string' && fullName.trim().length > 0) {
    return `${fullName.trim()}-Resume`;
  }
  return undefined;
}

async function callLatexCompileService(payload: unknown): Promise<{ latexSource: string; pdfBase64: string }> {
  const baseUrl = getLatexServiceUrl();
  const endpoint = `${baseUrl}/v1/resume/latex/compile`;

  // Create abort controller for request timeout (2 minutes - matches backend timeout)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120_000);

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timeoutId);
    // Handle abort/timeout specifically
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[latex-compile] Request timed out', { endpoint });
      throw new Error('LaTeX export timed out. The server may be overloaded. Please try again in a moment.');
    }
    console.error('[latex-compile] Network error calling LaTeX service', { endpoint, error });
    throw new Error('LaTeX export is temporarily unavailable. Please try again later.');
  } finally {
    clearTimeout(timeoutId);
  }

  const responseText = await response.text();
  let responseJson: unknown = undefined;
  try {
    responseJson = responseText.length ? JSON.parse(responseText) : undefined;
  } catch {
    responseJson = undefined;
  }

  if (!response.ok) {
    const parsedError = latexCompileServiceErrorSchema.safeParse(responseJson);
    console.error('[latex-compile] LaTeX service returned error', {
      endpoint,
      status: response.status,
      statusText: response.statusText,
      body: responseJson ?? responseText,
    });

    // Handle rate limiting (429)
    if (response.status === 429) {
      const retryAfter = (parsedError.success && (parsedError.data as any)?.details?.retryAfter) || 60;
      throw new Error(`Rate limit exceeded. Please wait ${retryAfter} seconds before trying again.`);
    }

    // Handle service busy (503)
    if (response.status === 503) {
      const retryAfter = (parsedError.success && (parsedError.data as any)?.details?.retryAfter) || 5;
      throw new Error(`Service is busy. Please try again in ${retryAfter} seconds.`);
    }

    const serviceMessage = parsedError.success
      ? (typeof (parsedError.data as any)?.message === 'string'
          ? (parsedError.data as any).message
          : (parsedError.data as any)?.error?.message)
      : undefined;

    throw new Error(serviceMessage || 'LaTeX export failed. Please try again later.');
  }

  const parsedSuccess = latexCompileServiceSuccessSchema.safeParse(responseJson);
  if (!parsedSuccess.success) {
    console.error('[latex-compile] Unexpected LaTeX service response shape', {
      endpoint,
      body: responseJson ?? responseText,
      zodError: parsedSuccess.error?.errors,
    });
    throw new Error('LaTeX export returned an invalid response. Please try again later.');
  }

  if (parsedSuccess.data.warnings && parsedSuccess.data.warnings.length > 0) {
    console.warn('[latex-compile] LaTeX service warnings', {
      endpoint,
      warnings: parsedSuccess.data.warnings,
    });
  }

  return {
    latexSource: parsedSuccess.data.latexSource,
    pdfBase64: parsedSuccess.data.pdfBase64,
  };
}

export async function compileLatexFromResumeDataAction(input: {
  userId: string;
  templateId: string;
  resumeData: unknown;
}): Promise<{ latexSource: string; pdfBase64: string }> {
  const validated = latexCompileFromResumeDataInputSchema.safeParse(input);
  if (!validated.success) {
    throw new Error(validated.error.errors.map(e => e.message).join(', '));
  }

  // Enforce daily export limit (Free: 2/day, Pro: unlimited)
  await enforceExportLimit(validated.data.userId);

  const fileBaseName = sanitizeLatexFileBaseName(
    tryDeriveFileBaseNameFromResumeData(validated.data.resumeData) || 'Resume'
  );

  return callLatexCompileService({
    source: 'resumeData',
    templateId: validated.data.templateId,
    resumeData: validated.data.resumeData,
    options: {
      engine: 'tectonic',
      return: ['latex', 'pdf'],
      fileBaseName,
    },
  });
}

export async function compileLatexFromResumeTextAction(input: {
  userId: string;
  templateId: string;
  resumeText: string;
}): Promise<{ latexSource: string; pdfBase64: string }> {
  const validated = latexCompileFromResumeTextInputSchema.safeParse(input);
  if (!validated.success) {
    throw new Error(validated.error.errors.map(e => e.message).join(', '));
  }

  // Enforce daily export limit (Free: 2/day, Pro: unlimited)
  await enforceExportLimit(validated.data.userId);

  return callLatexCompileService({
    source: 'resumeText',
    templateId: validated.data.templateId,
    resumeText: validated.data.resumeText,
    options: {
      engine: 'tectonic',
      return: ['latex', 'pdf'],
      fileBaseName: sanitizeLatexFileBaseName('Resume-Enhanced'),
    },
  });
}

const jobUrlSchema = z.object({
  url: z.string().url('Invalid URL format'),
});

export async function enhanceJobDescriptionAction(input: {
  jobDescription: string;
  jobRole?: string;
}) {
  try {
    // Basic enhancement logic without AI (can be replaced with AI later)
    const originalDesc = input.jobDescription.trim();
    
    // Add basic enhancements
    let enhanced = originalDesc;
    const addedSections: string[] = [];
    const improvements: string[] = [];
    
    // Add role-specific enhancements if role is provided
    if (input.jobRole) {
      const roleSpecificContent = getRoleSpecificContent(input.jobRole);
      if (roleSpecificContent) {
        enhanced += `\n\n${roleSpecificContent}`;
        addedSections.push('Role-specific requirements');
        improvements.push('Added role-specific technical requirements');
      }
    }
    
    // Add generic professional sections if missing
    if (!enhanced.toLowerCase().includes('benefits') && !enhanced.toLowerCase().includes('perks')) {
      enhanced += `\n\nBenefits & Perks:
• Competitive salary and equity packages
• Comprehensive health, dental, and vision insurance
• 401(k) matching and retirement planning
• Flexible work arrangements and remote options
• Professional development and learning opportunities
• Collaborative and inclusive work environment`;
      addedSections.push('Benefits & Perks');
      improvements.push('Added comprehensive benefits section');
    }
    
    if (!enhanced.toLowerCase().includes('growth') && !enhanced.toLowerCase().includes('career')) {
      enhanced += `\n\nGrowth Opportunities:
• Career advancement pathways with clear progression
• Mentorship programs and leadership development
• Conference attendance and continued education support
• Cross-functional project exposure
• Innovation time for personal projects`;
      addedSections.push('Growth Opportunities');
      improvements.push('Added career growth information');
    }
    
    improvements.push('Improved formatting and structure');
    
    return {
      originalDescription: originalDesc,
      enhancedDescription: enhanced,
      addedSections,
      improvements,
    };
  } catch (error: any) {
    return {
      originalDescription: input.jobDescription,
      enhancedDescription: input.jobDescription,
      addedSections: [],
      improvements: ['Enhancement service temporarily unavailable'],
    };
  }
}

function getRoleSpecificContent(jobRole: string): string | null {
  const roleContent: Record<string, string> = {
    "Frontend Developer": `
Technical Requirements:
• Proficiency in HTML5, CSS3, and modern JavaScript (ES6+)
• Experience with React, Vue.js, or Angular frameworks
• Knowledge of responsive design and cross-browser compatibility
• Familiarity with build tools like Webpack, Vite, or Parcel
• Understanding of version control systems (Git)
• Experience with CSS preprocessors (Sass, Less) and CSS-in-JS
• Knowledge of testing frameworks (Jest, Cypress, Testing Library)`,
    
    "Backend Developer": `
Technical Requirements:
• Strong experience with server-side languages (Node.js, Python, Java, C#, Go)
• Proficiency in database design and management (SQL, NoSQL)
• Experience with RESTful API design and implementation
• Knowledge of cloud platforms (AWS, Azure, GCP)
• Understanding of microservices architecture
• Experience with containerization (Docker, Kubernetes)
• Familiarity with CI/CD pipelines and DevOps practices`,
    
    "Full Stack Developer": `
Technical Requirements:
• Frontend: React, Vue.js, or Angular with modern JavaScript/TypeScript
• Backend: Node.js, Python, or Java with framework experience
• Database: SQL and NoSQL database design and optimization
• Cloud: AWS, Azure, or GCP deployment and scaling
• DevOps: Docker, CI/CD, and infrastructure as code
• API: RESTful services and GraphQL implementation
• Testing: Unit, integration, and end-to-end testing strategies`,
    
    "DevOps Engineer": `
Technical Requirements:
• Infrastructure as Code (Terraform, CloudFormation, Pulumi)
• Container orchestration (Kubernetes, Docker Swarm)
• CI/CD pipeline design and implementation
• Cloud platforms expertise (AWS, Azure, GCP)
• Monitoring and logging solutions (Prometheus, Grafana, ELK stack)
• Automation scripting (Python, Bash, PowerShell)
• Security best practices and compliance frameworks`,
  };
  
  return roleContent[jobRole] || null;
}

export async function extractJobDescriptionFromUrl(url: string, userId?: string) {
  try {
    // Enforce rate limit if userId is provided
    if (userId) {
      await enforceRateLimitAsync(userId, 'structure-job');
    }
    
    // Validate URL
    const validatedData = jobUrlSchema.parse({ url });
    
    // SSRF Protection: Block requests to internal/private networks
    try {
      const parsedUrl = new URL(validatedData.url);
      const hostname = parsedUrl.hostname.toLowerCase();
      
      // Block private/internal hostnames
      const blockedHostnames = ['localhost', '127.0.0.1', '0.0.0.0', '[::1]', 'metadata.google.internal'];
      if (blockedHostnames.includes(hostname)) {
        return { success: false, error: 'Invalid URL: internal addresses are not allowed.' };
      }
      
      // Block private IP ranges (10.x, 172.16-31.x, 192.168.x, 169.254.x)
      const ipMatch = hostname.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
      if (ipMatch) {
        const [, a, b] = ipMatch.map(Number);
        if (a === 10 || a === 127 || (a === 172 && b >= 16 && b <= 31) ||
            (a === 192 && b === 168) || (a === 169 && b === 254) || a === 0) {
          return { success: false, error: 'Invalid URL: private IP addresses are not allowed.' };
        }
      }
      
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return { success: false, error: 'Invalid URL: only HTTP/HTTPS protocols are allowed.' };
      }
    } catch {
      return { success: false, error: 'Invalid URL format.' };
    }
    
    // Set headers to mimic a real browser
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Cache-Control': 'max-age=0',
    };

    // Fetch the webpage
    const response = await axios.get(validatedData.url, { 
      headers,
      timeout: 15000, // 15 second timeout
      maxRedirects: 5,
      validateStatus: (status) => status < 500, // Accept 4xx errors too
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // Remove unnecessary elements but keep the content
    $('script, style, noscript, iframe, nav, header, footer, aside').remove();
    $('<!--').remove();

    // Helper function to clean text
    const cleanText = (text: string) => {
      return text
        .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
        .replace(/\n\s*\n\s*\n+/g, '\n\n') // Clean up excessive line breaks
        .trim();
    };

    // STEP 1: Extract full page content with priority-based approach
    let rawContent = '';
    let extractionMethod = '';

    // Try site-specific selectors first for better content quality
    if (url.includes('linkedin.com')) {
      const content = $('.jobs-description__content, .jobs-box__html-content, .description__text').text();
      if (content.length > 500) {
        rawContent = content;
        extractionMethod = 'LinkedIn-specific';
      }
    } else if (url.includes('indeed.com')) {
      const content = $('#jobDescriptionText, .jobsearch-jobDescriptionText, [id*="jobDescriptionText"]').text();
      if (content.length > 500) {
        rawContent = content;
        extractionMethod = 'Indeed-specific';
      }
    } else if (url.includes('glassdoor.com')) {
      const content = $('[data-test="jobDescriptionContent"], .jobDescriptionContent, [class*="JobDetails_jobDescription"]').text();
      if (content.length > 500) {
        rawContent = content;
        extractionMethod = 'Glassdoor-specific';
      }
    } else if (url.includes('monster.com')) {
      const content = $('[data-test-id="job-description-content"]').text();
      if (content.length > 500) {
        rawContent = content;
        extractionMethod = 'Monster-specific';
      }
    } else if (url.includes('ziprecruiter.com')) {
      const content = $('.job_description, [itemprop="description"]').text();
      if (content.length > 500) {
        rawContent = content;
        extractionMethod = 'ZipRecruiter-specific';
      }
    }

    // Fallback: Try main content containers
    if (!rawContent || rawContent.length < 500) {
      const selectors = [
        'main',
        'article',
        '[role="main"]',
        '[class*="job-description"]',
        '[class*="jobDescription"]',
        '[id*="description"]',
        '.content',
        '#content',
      ];

      for (const selector of selectors) {
        const content = $(selector).text().trim();
        if (content.length > rawContent.length && content.length > 500) {
          rawContent = content;
          extractionMethod = `Generic: ${selector}`;
        }
      }
    }

    // Final fallback: Get entire body content
    if (!rawContent || rawContent.length < 500) {
      rawContent = $('body').text().trim();
      extractionMethod = 'Full body extraction';
    }

    // Clean the extracted content
    rawContent = cleanText(rawContent);

    // Validate we have enough content
    if (!rawContent || rawContent.length < 200) {
      return {
        success: false,
        error: 'Could not extract meaningful content from this URL. The page might be protected, use dynamic content loading, or require authentication.',
      };
    }

    // STEP 2: Use AI to structure the raw content
    try {
      const structuredData = await withTimeout(
        structureJobDescription({
          rawContent: rawContent.substring(0, 15000), // Limit to prevent token overflow
          url: validatedData.url,
        }),
        AI_CALL_TIMEOUT_MS,
        'Job description structuring'
      );

      // Validate that we got meaningful structured data
      if (!structuredData.jobTitle || structuredData.responsibilities.length === 0) {
        return {
          success: false,
          error: 'Could not identify job details from the content. Please ensure the URL points to a job posting.',
        };
      }

      // Ensure we have a description, even if AI failed to generate the formatted one
      let finalDescription = structuredData.formattedDescription;
      
      if (!finalDescription || finalDescription.length < 50) {
        // Fallback: Construct description from structured fields
        const parts = [];
        
        if (structuredData.summary) parts.push(`Summary:\n${structuredData.summary}`);
        
        if (structuredData.responsibilities?.length > 0) {
          parts.push(`Key Responsibilities:\n${structuredData.responsibilities.map(r => `• ${r}`).join('\n')}`);
        }
        
        if (structuredData.requiredSkills?.length > 0) {
          parts.push(`Required Skills:\n${structuredData.requiredSkills.map(s => `• ${s}`).join('\n')}`);
        }
        
        if (structuredData.qualifications?.length > 0) {
          parts.push(`Qualifications:\n${structuredData.qualifications.map(q => `• ${q}`).join('\n')}`);
        }
        
        if ((structuredData.benefits?.length ?? 0) > 0) {
          parts.push(`Benefits:\n${(structuredData.benefits ?? []).map(b => `• ${b}`).join('\n')}`);
        }
        
        finalDescription = parts.join('\n\n');
        
        // If still empty, use raw content
        if (!finalDescription) {
          finalDescription = rawContent.substring(0, 3000);
        }
      }

      // Return the AI-structured data
      return {
        success: true,
        data: {
          jobTitle: structuredData.jobTitle,
          company: structuredData.company || 'Not specified',
          location: structuredData.location || 'Not specified',
          description: finalDescription,
          url: validatedData.url,
        },
      };

    } catch (aiError: any) {
      // If AI fails, return raw content as fallback
      return {
        success: true,
        data: {
          jobTitle: 'Job Position',
          company: 'See description',
          location: 'See description',
          description: `Extracted content from: ${validatedData.url}\n\n${rawContent.substring(0, 3000)}`,
          url: validatedData.url,
        },
      };
    }

  } catch (error: any) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return {
        success: false,
        error: 'Could not connect to the website. Please check the URL and try again.',
      };
    }
    
    if (error.code === 'ECONNABORTED') {
      return {
        success: false,
        error: 'Request timed out. The website might be slow or unavailable.',
      };
    }
    
    if (error.response?.status === 403 || error.response?.status === 401) {
      return {
        success: false,
        error: 'Access denied. This website blocks automated requests.',
      };
    }
    
    if (error.response?.status === 404) {
      return {
        success: false,
        error: 'Job posting not found. The URL might be incorrect or the posting might have been removed.',
      };
    }

    return {
      success: false,
      error: 'Failed to extract job description. Please copy the job description manually.',
    };
  }
}

// AI-powered intelligent resume parsing action
// Note: This action is typically used after an improvement has been generated,
// so rate limiting is lenient (uses parse-resume operation with higher limits)
export async function parseResumeIntelligentlyAction(
  resumeText: string,
  userId?: string
): Promise<{success: boolean; data?: any; error?: string}> {
  try {
    if (!resumeText || resumeText.trim().length < 50) {
      return {
        success: false,
        error: 'Resume text is too short. Please provide a more detailed resume.',
      };
    }

    // Only enforce rate limit if userId is provided
    // This action is typically part of the improvement flow, so we use a lenient limit
    if (userId) {
      await enforceRateLimitAsync(userId, 'parse-resume');
    }

    const result = await withTimeout(
      parseResumeIntelligently({ resumeText }),
      AI_CALL_TIMEOUT_MS,
      'Resume parsing'
    );
    
    return {
      success: true,
      data: result,
    };
  } catch (error: any) {
    // Check if it's a rate limit error
    if (error.code === 'DAILY_LIMIT_EXCEEDED' || error.code === 'RATE_LIMIT_EXCEEDED') {
      return {
        success: false,
        error: error.message,
      };
    }
    return {
      success: false,
      error: 'Failed to parse resume with AI. Please try again.',
    };
  }
}

// ============ SUBSCRIPTION ACTIONS ============

/**
 * Get subscription status for frontend
 * Returns tier, usage, limits, and billing info
 */
export async function getSubscriptionStatusAction(userId: string): Promise<{
  success: boolean;
  data?: SubscriptionState;
  error?: string;
}> {
  if (!userId) {
    return { success: false, error: 'User ID is required' };
  }
  
  try {
    const state = await getSubscriptionState(userId);
    return { success: true, data: state };
  } catch (error: any) {
    console.error('Error getting subscription status:', error);
    return { success: false, error: 'Failed to get subscription status' };
  }
}

/**
 * Check export limit without incrementing
 * Useful for UI to show remaining exports
 */
export async function checkExportLimitAction(userId: string): Promise<{
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
  unlimited: boolean;
}> {
  if (!userId) {
    return { allowed: false, used: 0, limit: 2, remaining: 0, unlimited: false };
  }
  
  try {
    const result = await checkExportLimit(userId);
    return {
      allowed: result.allowed,
      used: result.used,
      limit: result.limit,
      remaining: result.remaining,
      unlimited: result.limit === -1,
    };
  } catch (error) {
    console.error('Error checking export limit:', error);
    return { allowed: false, used: 0, limit: 2, remaining: 0, unlimited: false };
  }
}

// Server-side PDF export removed - now using client-side jsPDF in improvement page
