import type { ProbeResult, AIProviderStats } from "@/types/monitor";

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || "";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";

const MINI_PROMPT = {
  messages: [{ role: "user", content: "Say: ok" }],
  max_tokens: 5,
  temperature: 0,
};

// ─── Groq Probe ───────────────────────────────────────────────────────────────

async function probeGroq(): Promise<{ latencyMs: number; ok: boolean; tokens: number; error?: string }> {
  const start = Date.now();
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: "llama-3.1-8b-instant", ...MINI_PROMPT }),
      signal: AbortSignal.timeout(4000),
    });
    const latencyMs = Date.now() - start;
    if (!res.ok) return { latencyMs, ok: false, tokens: 0, error: `HTTP ${res.status}` };
    const data = await res.json();
    return { latencyMs, ok: true, tokens: data.usage?.total_tokens || 0 };
  } catch (error) {
    return { latencyMs: Date.now() - start, ok: false, tokens: 0, error: String(error) };
  }
}

// ─── OpenRouter Probe ─────────────────────────────────────────────────────────

async function probeOpenRouter(): Promise<{ latencyMs: number; ok: boolean; tokens: number; error?: string }> {
  const start = Date.now();
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "qwen/qwen3-235b-a22b:free",
        ...MINI_PROMPT,
      }),
      signal: AbortSignal.timeout(5000),
    });
    const latencyMs = Date.now() - start;
    if (!res.ok) return { latencyMs, ok: false, tokens: 0, error: `HTTP ${res.status}` };
    const data = await res.json();
    return { latencyMs, ok: true, tokens: data.usage?.total_tokens || 0 };
  } catch (error) {
    return { latencyMs: Date.now() - start, ok: false, tokens: 0, error: String(error) };
  }
}

// ─── Gemini Probe ─────────────────────────────────────────────────────────────

async function probeGemini(): Promise<{ latencyMs: number; ok: boolean; tokens: number; error?: string }> {
  const start = Date.now();
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Say: ok" }] }],
          generationConfig: { maxOutputTokens: 5 },
        }),
        signal: AbortSignal.timeout(4000),
      }
    );
    const latencyMs = Date.now() - start;
    if (!res.ok) return { latencyMs, ok: false, tokens: 0, error: `HTTP ${res.status}` };
    const data = await res.json();
    const tokens = data.usageMetadata?.totalTokenCount || 0;
    return { latencyMs, ok: true, tokens };
  } catch (error) {
    return { latencyMs: Date.now() - start, ok: false, tokens: 0, error: String(error) };
  }
}

// ─── Main AI Probe ────────────────────────────────────────────────────────────

export async function runAIProbe(): Promise<ProbeResult> {
  const groq = await probeGroq();

  const isDown = !groq.ok;
  const isDegraded = groq.latencyMs > 2500;

  return {
    serviceKey: "ai-groq-primary",
    serviceName: "Groq (Tier 1 AI)",
    status: isDown ? "DOWN" : isDegraded ? "DEGRADED" : "HEALTHY",
    latencyMs: groq.latencyMs,
    errorMessage: groq.error,
    metadata: { tokens: groq.tokens, provider: "groq" },
    checkedAt: new Date(),
  };
}

// ─── All AI Provider Stats ────────────────────────────────────────────────────

export async function getAllAIProviderStats(): Promise<AIProviderStats[]> {
  const [groq, openrouter, gemini] = await Promise.allSettled([
    probeGroq(),
    probeOpenRouter(),
    probeGemini(),
  ]);

  const g = groq.status === "fulfilled" ? groq.value : { latencyMs: 0, ok: false, tokens: 0 };
  const o = openrouter.status === "fulfilled" ? openrouter.value : { latencyMs: 0, ok: false, tokens: 0 };
  const ge = gemini.status === "fulfilled" ? gemini.value : { latencyMs: 0, ok: false, tokens: 0 };

  return [
    {
      provider: "groq",
      latencyMs: g.latencyMs,
      tokensGenerated: g.tokens,
      costPerDay: 0,
      status: !g.ok ? "DOWN" : g.latencyMs > 2500 ? "DEGRADED" : "HEALTHY",
      fallbackActive: !g.ok,
      lastChecked: new Date(),
    },
    {
      provider: "openrouter",
      latencyMs: o.latencyMs,
      tokensGenerated: o.tokens,
      costPerDay: 0,
      status: !o.ok ? "DOWN" : o.latencyMs > 3500 ? "DEGRADED" : "HEALTHY",
      fallbackActive: !g.ok,
      lastChecked: new Date(),
    },
    {
      provider: "gemini",
      latencyMs: ge.latencyMs,
      tokensGenerated: ge.tokens,
      costPerDay: 0,
      status: !ge.ok ? "DOWN" : ge.latencyMs > 2000 ? "DEGRADED" : "HEALTHY",
      fallbackActive: !g.ok && !o.ok,
      lastChecked: new Date(),
    },
  ];
}
