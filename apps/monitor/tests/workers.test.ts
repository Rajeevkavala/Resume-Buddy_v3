// =============================================================================
// Resume Buddy Monitor v2 — Workers Unit Tests
// =============================================================================

import { describe, it, expect, vi } from "vitest";
import { FrontendWorker } from "../src/workers/frontend.worker";
import { DNSWorker } from "../src/workers/dns.worker";
import { CostSloWorker } from "../src/workers/cost-slo.worker";

describe("Autonomous Monitoring Workers", () => {
  it("CostSloWorker calculates SLO metrics cleanly", async () => {
    const worker = new CostSloWorker();
    const result = await worker.execute();
    expect(result.workerName).toBe("CostSloWorker");
    expect(result.status).toBe("HEALTHY");
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it("FrontendWorker gracefully handles offline targets", async () => {
    const worker = new FrontendWorker();
    const result = await worker.execute();
    expect(["HEALTHY", "DEGRADED", "DOWN"]).toContain(result.status);
  });

  it("DNSWorker resolves domains without crashing", async () => {
    const worker = new DNSWorker();
    const result = await worker.execute();
    expect(["HEALTHY", "DEGRADED", "DOWN"]).toContain(result.status);
  });
});
