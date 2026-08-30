import type { SyntheticStep, SyntheticRunResult } from "@/types/monitor";

// ─── Homepage Flow ────────────────────────────────────────────────────────────

export async function runHomepageFlow(): Promise<SyntheticRunResult> {
  const steps: SyntheticStep[] = [];
  const flowStart = Date.now();

  // Step 1: GET homepage
  const step1Start = Date.now();
  try {
    const res = await fetch("https://www.resume-buddy.tech", {
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    const html = await res.text();
    const ok = res.ok && html.includes("Resume Buddy");
    steps.push({ stepName: "GET Homepage", durationMs: Date.now() - step1Start, success: ok, errorMessage: ok ? undefined : `HTTP ${res.status}` });
  } catch (e) {
    steps.push({ stepName: "GET Homepage", durationMs: Date.now() - step1Start, success: false, errorMessage: String(e) });
  }

  // Step 2: API health check
  const step2Start = Date.now();
  try {
    const res = await fetch("https://www.resume-buddy.tech/api/health", { signal: AbortSignal.timeout(3000), cache: "no-store" });
    const ok = res.ok;
    steps.push({ stepName: "API Health Check", durationMs: Date.now() - step2Start, success: ok });
  } catch (e) {
    steps.push({ stepName: "API Health Check", durationMs: Date.now() - step2Start, success: false, errorMessage: String(e) });
  }

  const failedIdx = steps.findIndex((s) => !s.success);
  return {
    workflowKey: "homepage-load",
    workflowName: "Homepage Load & Metadata",
    success: failedIdx === -1,
    durationMs: Date.now() - flowStart,
    failedStepIndex: failedIdx >= 0 ? failedIdx : undefined,
    failureReason: failedIdx >= 0 ? steps[failedIdx].errorMessage : undefined,
    stepTimings: steps,
    executedAt: new Date(),
  };
}

// ─── LaTeX Compile Flow ───────────────────────────────────────────────────────

export async function runLatexCompileFlow(): Promise<SyntheticRunResult> {
  const steps: SyntheticStep[] = [];
  const flowStart = Date.now();

  const BACKEND = process.env.PROBE_TARGET_BACKEND_URL || "https://api.resume-buddy.tech";

  const step1Start = Date.now();
  try {
    const res = await fetch(`${BACKEND}/healthz`, { signal: AbortSignal.timeout(3000), cache: "no-store" });
    const ok = res.ok;
    steps.push({ stepName: "GET /healthz", durationMs: Date.now() - step1Start, success: ok });
  } catch (e) {
    steps.push({ stepName: "GET /healthz", durationMs: Date.now() - step1Start, success: false, errorMessage: String(e) });
  }

  const failedIdx = steps.findIndex((s) => !s.success);
  return {
    workflowKey: "latex-compile",
    workflowName: "LaTeX Compilation → PDF",
    success: failedIdx === -1,
    durationMs: Date.now() - flowStart,
    failedStepIndex: failedIdx >= 0 ? failedIdx : undefined,
    failureReason: failedIdx >= 0 ? steps[failedIdx].errorMessage : undefined,
    stepTimings: steps,
    executedAt: new Date(),
  };
}

// ─── Database Read Flow ───────────────────────────────────────────────────────

export async function runDatabaseReadFlow(): Promise<SyntheticRunResult> {
  const steps: SyntheticStep[] = [];
  const flowStart = Date.now();

  const step1Start = Date.now();
  try {
    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1, connectionTimeoutMillis: 4000, ssl: { rejectUnauthorized: false } });
    const client = await pool.connect();
    const result = await client.query("SELECT count(*) FROM \"User\"");
    client.release();
    await pool.end();
    const ok = Array.isArray(result.rows);
    steps.push({ stepName: "SELECT count(*) FROM User", durationMs: Date.now() - step1Start, success: ok });
  } catch (e) {
    steps.push({ stepName: "SELECT count(*) FROM User", durationMs: Date.now() - step1Start, success: false, errorMessage: String(e) });
  }

  const failedIdx = steps.findIndex((s) => !s.success);
  return {
    workflowKey: "database-read",
    workflowName: "Database Read Verification",
    success: failedIdx === -1,
    durationMs: Date.now() - flowStart,
    failedStepIndex: failedIdx >= 0 ? failedIdx : undefined,
    failureReason: failedIdx >= 0 ? steps[failedIdx].errorMessage : undefined,
    stepTimings: steps,
    executedAt: new Date(),
  };
}

// ─── Redis Roundtrip Flow ─────────────────────────────────────────────────────

export async function runRedisRoundtripFlow(): Promise<SyntheticRunResult> {
  const steps: SyntheticStep[] = [];
  const flowStart = Date.now();

  const step1Start = Date.now();
  try {
    const { default: Redis } = await import("ioredis");
    const redis = new Redis(process.env.REDIS_URL!, { lazyConnect: true, connectTimeout: 2000, commandTimeout: 2000, maxRetriesPerRequest: 1 });
    const key = `synthetic:test:${Date.now()}`;
    await redis.set(key, "synthetic-ok", "EX", 30);
    const val = await redis.get(key);
    await redis.del(key);
    redis.disconnect();
    const ok = val === "synthetic-ok";
    steps.push({ stepName: "Redis SET/GET/DEL", durationMs: Date.now() - step1Start, success: ok, errorMessage: ok ? undefined : "Value mismatch" });
  } catch (e) {
    steps.push({ stepName: "Redis SET/GET/DEL", durationMs: Date.now() - step1Start, success: false, errorMessage: String(e) });
  }

  const failedIdx = steps.findIndex((s) => !s.success);
  return {
    workflowKey: "redis-roundtrip",
    workflowName: "Redis SET/GET/DEL Round-trip",
    success: failedIdx === -1,
    durationMs: Date.now() - flowStart,
    failedStepIndex: failedIdx >= 0 ? failedIdx : undefined,
    stepTimings: steps,
    executedAt: new Date(),
  };
}

// ─── SSL Certificate Flow ─────────────────────────────────────────────────────

export async function runSSLCertFlow(): Promise<SyntheticRunResult> {
  const steps: SyntheticStep[] = [];
  const flowStart = Date.now();

  for (const host of ["api.resume-buddy.tech", "www.resume-buddy.tech"]) {
    const stepStart = Date.now();
    try {
      const res = await fetch(`https://${host}`, { method: "HEAD", signal: AbortSignal.timeout(5000) });
      steps.push({ stepName: `TLS ${host}`, durationMs: Date.now() - stepStart, success: res.ok || res.status < 500 });
    } catch (e) {
      steps.push({ stepName: `TLS ${host}`, durationMs: Date.now() - stepStart, success: false, errorMessage: String(e) });
    }
  }

  const failedIdx = steps.findIndex((s) => !s.success);
  return {
    workflowKey: "ssl-cert",
    workflowName: "TLS Certificate Validity",
    success: failedIdx === -1,
    durationMs: Date.now() - flowStart,
    failedStepIndex: failedIdx >= 0 ? failedIdx : undefined,
    stepTimings: steps,
    executedAt: new Date(),
  };
}

// ─── AI Fallback Flow ─────────────────────────────────────────────────────────

export async function runGroqFallbackFlow(): Promise<SyntheticRunResult> {
  const steps: SyntheticStep[] = [];
  const flowStart = Date.now();

  // Probe Groq
  const groqStart = Date.now();
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "llama-3.1-8b-instant", messages: [{ role: "user", content: "ok" }], max_tokens: 3 }),
      signal: AbortSignal.timeout(4000),
    });
    steps.push({ stepName: "Groq Tier 1 Probe", durationMs: Date.now() - groqStart, success: res.ok });
  } catch (e) {
    steps.push({ stepName: "Groq Tier 1 Probe", durationMs: Date.now() - groqStart, success: false, errorMessage: String(e) });
  }

  const failedIdx = steps.findIndex((s) => !s.success);
  return {
    workflowKey: "groq-fallback",
    workflowName: "Groq → OpenRouter → Gemini Fallback",
    success: failedIdx === -1,
    durationMs: Date.now() - flowStart,
    failedStepIndex: failedIdx >= 0 ? failedIdx : undefined,
    stepTimings: steps,
    executedAt: new Date(),
  };
}

// ─── S3 Upload Flow ───────────────────────────────────────────────────────────

export async function runS3UploadFlow(): Promise<SyntheticRunResult> {
  const steps: SyntheticStep[] = [];
  const flowStart = Date.now();

  const step1Start = Date.now();
  try {
    const { S3Client, PutObjectCommand, DeleteObjectCommand } = await import("@aws-sdk/client-s3");
    const client = new S3Client({ region: process.env.AWS_REGION!, credentials: { accessKeyId: process.env.AWS_ACCESS_KEY_ID!, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY! } });
    const key = `synthetic/upload-test-${Date.now()}.txt`;
    await client.send(new PutObjectCommand({ Bucket: process.env.AWS_S3_BUCKET!, Key: key, Body: "synthetic-upload-test", ContentType: "text/plain" }));
    await client.send(new DeleteObjectCommand({ Bucket: process.env.AWS_S3_BUCKET!, Key: key }));
    steps.push({ stepName: "S3 PutObject + DeleteObject", durationMs: Date.now() - step1Start, success: true });
  } catch (e) {
    steps.push({ stepName: "S3 PutObject + DeleteObject", durationMs: Date.now() - step1Start, success: false, errorMessage: String(e) });
  }

  const failedIdx = steps.findIndex((s) => !s.success);
  return {
    workflowKey: "s3-upload",
    workflowName: "S3 Presigned Upload + SHA-256",
    success: failedIdx === -1,
    durationMs: Date.now() - flowStart,
    failedStepIndex: failedIdx >= 0 ? failedIdx : undefined,
    stepTimings: steps,
    executedAt: new Date(),
  };
}
