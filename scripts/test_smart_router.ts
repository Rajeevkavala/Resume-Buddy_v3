// Mock 'server-only' for Node standalone CLI scripts
try {
  const resolved = require.resolve('server-only');
  require.cache[resolved] = {
    id: resolved,
    filename: resolved,
    loaded: true,
    exports: {},
  } as any;
} catch {}

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.production') });

import { smartGenerate } from '../src/ai/smart-router';

async function testSmartRouter() {
  console.log('====================================================');
  console.log('🤖 Testing Smart AI Router with New Model Hierarchy');
  console.log('====================================================\n');

  // Test 1: Resume Q&A (Target: GPT-OSS 20B -> GPT-OSS 120B -> Gemini 2.5 Flash)
  console.log('[1/3] Testing feature: resume-qa (Primary: gpt-oss-20b, Fallback: gpt-oss-120b, Last Resort: gemini-2.5-flash)...');
  const res1 = await smartGenerate({
    feature: 'resume-qa',
    prompt: 'What is the candidate summary for Rajeev Kavala - Full Stack TypeScript & AWS Developer?',
    systemPrompt: 'You are a resume expert. Respond in JSON with key "answer".',
    jsonMode: true,
  });
  console.log(`✅ resume-qa completed via ${res1.provider} (${res1.model}) in ${res1.latencyMs}ms`);
  console.log('   Output:', res1.content.slice(0, 150));

  // Test 2: Resume Analysis (Target: GPT-OSS 120B -> GPT-OSS 20B -> Gemini 2.5 Flash)
  console.log('\n[2/3] Testing feature: resume-analysis (Primary: gpt-oss-120b, Fallback: gpt-oss-20b, Last Resort: gemini-2.5-flash)...');
  const res2 = await smartGenerate({
    feature: 'resume-analysis',
    prompt: 'Analyze this profile: "Software Engineer with 3 years experience building cloud services".',
    systemPrompt: 'Provide a brief 1-line analysis in JSON with key "summary".',
    jsonMode: true,
  });
  console.log(`✅ resume-analysis completed via ${res2.provider} (${res2.model}) in ${res2.latencyMs}ms`);
  console.log('   Output:', res2.content.slice(0, 150));

  // Test 3: DSA Questions (Target: Qwen 3.6 27B -> GPT-OSS 120B -> Gemini 2.5 Flash)
  console.log('\n[3/3] Testing feature: dsa-questions (Primary: qwen-3.6-27b, Fallback: gpt-oss-120b, Last Resort: gemini-2.5-flash)...');
  const res3 = await smartGenerate({
    feature: 'dsa-questions',
    prompt: 'Generate 1 easy DSA question about Arrays.',
    systemPrompt: 'Provide question in JSON with key "title".',
    jsonMode: true,
  });
  console.log(`✅ dsa-questions completed via ${res3.provider} (${res3.model}) in ${res3.latencyMs}ms`);
  console.log('   Output:', res3.content.slice(0, 150));

  console.log('\n🎉 ALL SMART ROUTER TESTS COMPLETED SUCCESSFULLY!');
}

testSmartRouter().catch(console.error);
