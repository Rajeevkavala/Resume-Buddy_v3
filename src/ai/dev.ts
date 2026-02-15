import { config } from 'dotenv';
config();

import '@/ai/flows/analyze-resume-content.ts';
import '@/ai/flows/suggest-resume-improvements.ts';
import '@/ai/flows/generate-interview-questions.ts';
import '@/ai/flows/generate-resume-qa.ts';
import '@/ai/flows/structure-job-description.ts';
import '@/ai/flows/parse-resume-intelligently.ts';