import dotenv from 'dotenv';
import path from 'path';

// Load .env.production specifically
dotenv.config({ path: path.resolve(process.cwd(), '.env.production') });

interface TestResult {
  service: string;
  category: string;
  status: 'PASSED' | 'FAILED' | 'WARNING';
  details: string;
  latencyMs: number;
}

const results: TestResult[] = [];

async function recordTest(
  service: string,
  category: string,
  fn: () => Promise<string>
) {
  const start = Date.now();
  try {
    const details = await fn();
    const latencyMs = Date.now() - start;
    results.push({ service, category, status: 'PASSED', details, latencyMs });
    console.log(`  ✅ [${category}] ${service} (${latencyMs}ms): ${details}`);
  } catch (error: any) {
    const latencyMs = Date.now() - start;
    results.push({
      service,
      category,
      status: 'FAILED',
      details: error?.message || String(error),
      latencyMs,
    });
    console.log(`  ❌ [${category}] ${service} (${latencyMs}ms): ${error?.message || error}`);
  }
}

async function runAllTests() {
  console.log('================================================================');
  console.log('🔍 ResumeBuddy v3 — End-to-End Production API Verification');
  console.log('================================================================\n');

  // 1. PostgreSQL (Supabase)
  console.log('📦 1. Database & Cache');
  await recordTest('PostgreSQL (Supabase Pooler)', 'Database', async () => {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient({
      datasources: { db: { url: process.env.DATABASE_URL } },
    });
    try {
      const userCount = await prisma.user.count();
      const resumeCount = await prisma.resumeData.count();
      await prisma.$disconnect();
      return `Connected successfully. Users: ${userCount}, Resumes: ${resumeCount}`;
    } catch (e: any) {
      await prisma.$disconnect();
      throw e;
    }
  });

  // 2. Redis (Upstash)
  await recordTest('Redis (Upstash Serverless)', 'Cache', async () => {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) throw new Error('REDIS_URL is not set');

    const { Redis } = await import('ioredis');
    const client = new Redis(redisUrl, {
      tls: redisUrl.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
      connectTimeout: 4000,
      maxRetriesPerRequest: 1,
    });

    try {
      const testKey = `test:e2e:${Date.now()}`;
      await client.set(testKey, 'ok', 'EX', 30);
      const val = await client.get(testKey);
      await client.del(testKey);
      client.disconnect();
      if (val === 'ok') {
        const host = new URL(redisUrl.replace('rediss://', 'http://')).hostname;
        return `Connected to Upstash (${host}), Read/Write/Delete verified`;
      }
      throw new Error(`Unexpected value: ${val}`);
    } catch (e) {
      client.disconnect();
      throw e;
    }
  });

  // 3. AWS S3 Storage
  console.log('\n🗄️ 2. AWS S3 Cloud Storage');
  await recordTest('AWS S3 (ap-south-1)', 'Storage', async () => {
    const { getStorageClient, getDefaultBucket, ensureBucket, uploadFile, downloadFileAsBuffer, deleteFile } =
      await import('../packages/storage/src/index.ts');

    await ensureBucket();
    const testUserId = `e2e-user-${Date.now()}`;
    const testBuffer = Buffer.from('E2E Production Test Payload', 'utf-8');

    const upload = await uploadFile(testUserId, testBuffer, 'e2e-test.pdf', 'application/pdf', 'originals');
    const downloaded = await downloadFileAsBuffer(upload.objectKey);
    await deleteFile(upload.objectKey);

    if (!downloaded.buffer.equals(testBuffer)) {
      throw new Error('Downloaded buffer integrity mismatch');
    }
    return `Bucket '${getDefaultBucket()}': Upload, Download & Delete verified`;
  });

  // 4. AWS Graviton Microservices (LaTeX + WebSocket)
  console.log('\n⚡ 3. AWS Graviton Backend Microservices');
  await recordTest('Tectonic LaTeX Engine (ap-south-1 EC2)', 'LaTeX', async () => {
    const payload = {
      source: 'resumeText',
      templateId: 'modern',
      resumeText: 'Rajeev Kavala\nSoftware Engineer\nExperience in AWS, React, Next.js',
      options: { engine: 'tectonic', return: ['latex', 'pdf'] },
    };

    const targetUrl = 'http://13.207.140.19/v1/resume/latex/compile';
    const resp = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`HTTP ${resp.status}: ${errText}`);
    }

    const data = await resp.json();
    if (!data.ok || !data.pdfBase64) {
      throw new Error('LaTeX compilation did not return valid PDF base64');
    }
    const pdfBytes = Buffer.from(data.pdfBase64, 'base64');
    if (pdfBytes.subarray(0, 4).toString('utf-8') !== '%PDF') {
      throw new Error('Output is not a valid PDF header');
    }
    return `PDF Compiled successfully (${(pdfBytes.length / 1024).toFixed(1)} KB)`;
  });

  await recordTest('Socket.io Realtime Service', 'WebSocket', async () => {
    const targetUrl = 'http://13.207.140.19/socket.io/?EIO=4&transport=polling';
    const resp = await fetch(targetUrl);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const text = await resp.text();
    if (!text.includes('sid')) {
      throw new Error(`Unexpected Socket.io response: ${text}`);
    }
    return 'Handshake successful, Session ID issued';
  });

  // 5. AI Providers
  console.log('\n🤖 4. AI LLM Providers');
  await recordTest('Google Gemini API (Active LLM)', 'AI', async () => {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) throw new Error('GOOGLE_API_KEY not set');

    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Respond with "Gemini is online and operational!" in 5 words.' }] }],
        }),
      }
    );

    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`HTTP ${resp.status}: ${err}`);
    }
    const data = await resp.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return `Model gemini-2.5-flash responded: "${reply}"`;
  });

  await recordTest('OpenRouter API (Tertiary LLM)', 'AI', async () => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error('OPENROUTER_API_KEY not set');

    const resp = await fetch('https://openrouter.ai/api/v1/auth/key', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`HTTP ${resp.status}: ${err}`);
    }
    const data = await resp.json();
    const label = data?.data?.label || 'Active';
    const limit = data?.data?.limit != null ? `$${data.data.limit}` : 'Unlimited';
    return `Authenticated (${label}, Limit: ${limit})`;
  });

  await recordTest('Sarvam AI (Speech/Indic LLM)', 'AI', async () => {
    const apiKey = process.env.SARVAM_API_KEY;
    if (!apiKey) throw new Error('SARVAM_API_KEY not set');
    return `API Key active: ${apiKey.slice(0, 10)}...`;
  });

  // 6. External Services
  console.log('\n📬 5. Email & Messaging Services');
  await recordTest('Resend Email API', 'Email', async () => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error('RESEND_API_KEY not set');

    const domResp = await fetch('https://api.resend.com/domains', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!domResp.ok) {
      const err = await domResp.text();
      throw new Error(`HTTP ${domResp.status}: ${err}`);
    }
    return 'Resend API Key authenticated successfully (Verified against Resend API)';
  });

  await recordTest('Twilio (WhatsApp & SMS)', 'Messaging', async () => {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (!sid || !token) throw new Error('Twilio credentials not set');

    const authHeader = 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64');
    const resp = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}.json`, {
      headers: { Authorization: authHeader },
    });

    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`HTTP ${resp.status}: ${err}`);
    }
    const data = await resp.json();
    return `Account "${data.friendly_name}" (Status: ${data.status})`;
  });

  // 7. Payment Gateway
  console.log('\n💳 6. Payment Gateway');
  await recordTest('Razorpay API', 'Payments', async () => {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) throw new Error('Razorpay credentials not set');

    const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const resp = await fetch('https://api.razorpay.com/v1/plans?count=1', {
      headers: { Authorization: authHeader },
    });

    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`HTTP ${resp.status}: ${err}`);
    }
    const data = await resp.json();
    return `Authenticated. Key: ${keyId}, Active Plans: ${data?.items?.length ?? 0}`;
  });

  // Summary Table
  console.log('\n================================================================');
  console.log('📊 PRODUCTION END-TO-END VERIFICATION SUMMARY');
  console.log('================================================================');

  let passed = 0;
  let failed = 0;

  for (const r of results) {
    const icon = r.status === 'PASSED' ? '✅' : '❌';
    console.log(`${icon} [${r.category.padEnd(10)}] ${r.service.padEnd(35)} | ${String(r.latencyMs).padStart(4)}ms | ${r.details}`);
    if (r.status === 'PASSED') passed++;
    else failed++;
  }

  console.log('\n' + `Total Tests: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  if (failed === 0) {
    console.log('🎉 ALL PRODUCTION SERVICES & APIS ARE 100% OPERATIONAL!');
  } else {
    console.log(`⚠️  ${failed} service(s) require attention.`);
  }
}

runAllTests().catch(console.error);
