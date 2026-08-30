import { getProductionDeployment } from "@/lib/vercel/vercel-api";
import type { ProbeResult } from "@/types/monitor";

const WEB_URL = process.env.PROBE_TARGET_WEB_URL || "https://www.resume-buddy.tech";

export async function runVercelEdgeProbe(): Promise<ProbeResult> {
  const start = Date.now();
  try {
    const res = await fetch(`${WEB_URL}/api/health`, {
      method: "GET",
      signal: AbortSignal.timeout(3000),
      cache: "no-store",
    });

    const latency = Date.now() - start;
    const isOk = res.status === 200;
    const isDegraded = latency > 1200;

    // Also check Vercel deployment state
    let deploymentMeta: Record<string, unknown> = { statusCode: res.status, latencyMs: latency };
    try {
      const deployment = await getProductionDeployment();
      if (deployment) {
        deploymentMeta = {
          ...deploymentMeta,
          deploymentId: deployment.uid,
          deploymentState: deployment.state,
          buildDurationMs: deployment.buildDurationMs,
          commitSha: deployment.meta?.githubCommitSha,
        };
      }
    } catch {
      // Non-critical
    }

    return {
      serviceKey: "vercel-frontend",
      serviceName: "Vercel Edge (Next.js 16)",
      status: !isOk ? "DOWN" : isDegraded ? "DEGRADED" : "HEALTHY",
      latencyMs: latency,
      statusCode: res.status,
      metadata: deploymentMeta,
      checkedAt: new Date(),
    };
  } catch (error) {
    return {
      serviceKey: "vercel-frontend",
      serviceName: "Vercel Edge (Next.js 16)",
      status: "DOWN",
      latencyMs: Date.now() - start,
      errorMessage: error instanceof Error ? error.message : "Probe failed",
      checkedAt: new Date(),
    };
  }
}
