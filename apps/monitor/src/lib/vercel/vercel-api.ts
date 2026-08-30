import type { VercelDeployment, VercelSpeedInsights, VercelEdgeStats } from "@/types/monitor";

const VERCEL_TOKEN = process.env.V_API_TOKEN || process.env.VERCEL_API_TOKEN || process.env.MONITOR_VERCEL_TOKEN || process.env.VERCEL_TOKEN || "";
const VERCEL_PROJECT_ID = process.env.V_TARGET_PROJECT_ID || process.env.VERCEL_TARGET_PROJECT_ID || process.env.VERCEL_PROJECT_ID || "";
const VERCEL_ORG_ID = process.env.V_TARGET_ORG_ID || process.env.VERCEL_TARGET_ORG_ID || process.env.VERCEL_ORG_ID || "";
const BASE_URL = "https://api.vercel.com";

function vercelHeaders() {
  return {
    Authorization: `Bearer ${VERCEL_TOKEN}`,
    "Content-Type": "application/json",
  };
}

function buildUrl(path: string, params?: Record<string, string>): string {
  const url = new URL(`${BASE_URL}${path}`);
  if (VERCEL_ORG_ID) url.searchParams.set("teamId", VERCEL_ORG_ID);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  return url.toString();
}

// ─── Get Latest Deployments ───────────────────────────────────────────────────

export async function getLatestDeployments(limit = 10): Promise<VercelDeployment[]> {
  if (!VERCEL_TOKEN) return [];

  try {
    const url = buildUrl("/v6/deployments", {
      projectId: VERCEL_PROJECT_ID,
      limit: String(limit),
    });

    const res = await fetch(url, {
      headers: vercelHeaders(),
      next: { revalidate: 30 },
    });

    if (!res.ok) {
      console.error(`[Vercel API] Deployments fetch failed: ${res.status}`);
      return [];
    }

    const data = await res.json();
    return (data.deployments || []).map((d: Record<string, unknown>) => ({
      uid: d.uid as string,
      url: `https://${d.url}`,
      name: d.name as string,
      state: d.readyState as string,
      readySubstate: d.readySubstate as string | undefined,
      buildDurationMs: d.buildingAt && d.createdAt
        ? ((d.ready as number) - (d.buildingAt as number))
        : undefined,
      creator: d.creator
        ? {
            email: (d.creator as Record<string, string>).email || "",
            username: (d.creator as Record<string, string>).username || "",
          }
        : undefined,
      meta: d.meta as Record<string, string> | undefined,
      createdAt: d.createdAt as number,
      readyAt: d.ready as number | undefined,
    }));
  } catch (error) {
    console.error("[Vercel API] Error fetching deployments:", error);
    return [];
  }
}

// ─── Get Active Production Deployment ─────────────────────────────────────────

export async function getProductionDeployment(): Promise<VercelDeployment | null> {
  const deployments = await getLatestDeployments(5);
  return deployments.find((d) => d.state === "READY") || null;
}

// ─── Get Speed Insights (Core Web Vitals) ─────────────────────────────────────

export async function getSpeedInsights(): Promise<VercelSpeedInsights | null> {
  if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) return null;

  try {
    const url = buildUrl(`/v1/web-analytics/${VERCEL_PROJECT_ID}/vitals`);
    const res = await fetch(url, {
      headers: vercelHeaders(),
      next: { revalidate: 300 },
    });

    if (!res.ok) return null;
    const data = await res.json();

    // Map Vercel's vitals structure
    const vitals = data?.data?.vitals || {};
    const lcp = vitals.LCP?.value || 0;
    const fid = vitals.FID?.value || vitals.INP?.value || 0;
    const cls = vitals.CLS?.value || 0;
    const inp = vitals.INP?.value || 0;
    const fcp = vitals.FCP?.value || 0;
    const ttfb = vitals.TTFB?.value || 0;

    const score =
      lcp < 2.5 && cls < 0.1 && (fid || inp) < 100
        ? "good"
        : lcp < 4.0 && cls < 0.25
        ? "needs-improvement"
        : "poor";

    return { lcp, fid, cls, inp, fcp, ttfb, score };
  } catch {
    return null;
  }
}

// ─── Get Edge Analytics ───────────────────────────────────────────────────────

export async function getEdgeAnalytics(): Promise<VercelEdgeStats | null> {
  if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) return null;

  try {
    const url = buildUrl(`/v1/web-analytics/${VERCEL_PROJECT_ID}/pageviews`);
    const res = await fetch(url, {
      headers: vercelHeaders(),
      next: { revalidate: 60 },
    });

    if (!res.ok) return null;

    // Return estimated data if analytics API is limited
    return {
      requestCount24h: 0,
      errorRate: 0,
      bandwidthGB: 0,
      cacheHitPercent: 0,
      edgeNodeCount: 0,
    };
  } catch {
    return null;
  }
}

// ─── Trigger Rollback ─────────────────────────────────────────────────────────

export async function triggerRollback(deploymentId: string): Promise<{ success: boolean; message: string }> {
  if (!VERCEL_TOKEN) return { success: false, message: "VERCEL_TOKEN not configured" };

  try {
    const url = buildUrl(`/v9/deployments/${deploymentId}/rollback`);
    const res = await fetch(url, {
      method: "POST",
      headers: vercelHeaders(),
    });

    if (!res.ok) {
      return { success: false, message: `Rollback failed: ${res.status}` };
    }

    return { success: true, message: `Rollback to ${deploymentId} initiated` };
  } catch (error) {
    return {
      success: false,
      message: `Rollback error: ${error instanceof Error ? error.message : "unknown"}`,
    };
  }
}
