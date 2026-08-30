import {
  runHomepageFlow,
  runLatexCompileFlow,
  runDatabaseReadFlow,
  runRedisRoundtripFlow,
  runSSLCertFlow,
  runGroqFallbackFlow,
  runS3UploadFlow,
} from "./flows";
import type { SyntheticRunResult } from "@/types/monitor";

// In-memory cache of last synthetic run results
const lastResults = new Map<string, SyntheticRunResult>();
let lastRunAt: Date | null = null;

// ─── Run All 12 Synthetic Tests ───────────────────────────────────────────────

export async function runAllSynthetics(): Promise<SyntheticRunResult[]> {
  lastRunAt = new Date();

  const results = await Promise.allSettled([
    runHomepageFlow(),
    runLatexCompileFlow(),
    runDatabaseReadFlow(),
    runRedisRoundtripFlow(),
    runSSLCertFlow(),
    runGroqFallbackFlow(),
    runS3UploadFlow(),
  ]);

  const runs: SyntheticRunResult[] = results.map((r) => {
    if (r.status === "fulfilled") {
      lastResults.set(r.value.workflowKey, r.value);
      return r.value;
    } else {
      return {
        workflowKey: "unknown",
        workflowName: "Unknown Flow",
        success: false,
        durationMs: 0,
        failureReason: String(r.reason),
        stepTimings: [],
        executedAt: new Date(),
      };
    }
  });

  return runs;
}

// ─── Get Cached Results ───────────────────────────────────────────────────────

export function getCachedSyntheticResults(): SyntheticRunResult[] {
  return Array.from(lastResults.values());
}

export function getSyntheticLastRunAt(): Date | null {
  return lastRunAt;
}
