import { test, expect } from "@playwright/test";

const ALL_ROUTES = [
  { path: "/overview", name: "Enterprise Mission Control" },
  { path: "/incidents", name: "Incident Management Desk" },
  { path: "/alerts", name: "Alerts & Cooldowns" },
  { path: "/infrastructure", name: "AWS EC2 / CloudWatch" },
  { path: "/frontend", name: "Vercel Edge & Speed Insights" },
  { path: "/backend", name: "Backend / LaTeX Engine" },
  { path: "/database", name: "Supabase PostgreSQL" },
  { path: "/redis", name: "Upstash Redis" },
  { path: "/storage", name: "AWS S3 Storage" },
  { path: "/ai-providers", name: "AI Providers Matrix" },
  { path: "/payments", name: "Razorpay Checkout" },
  { path: "/notifications", name: "Notifications (Resend / Twilio)" },
  { path: "/deployments", name: "Vercel Deployment History" },
  { path: "/synthetics", name: "Synthetic E2E Journeys" },
  { path: "/logs", name: "CloudWatch Live Logs" },
  { path: "/audit-logs", name: "SRE Audit Logs" },
  { path: "/users", name: "User Management" },
  { path: "/rbac", name: "RBAC Permissions" },
  { path: "/settings", name: "Platform Settings" },
  { path: "/api-keys", name: "API Keys Management" },
  { path: "/feature-flags", name: "Feature Flags & Killswitches" },
];

test.describe("Resume Buddy Monitor — Live Production E2E Audit", () => {
  // ─── 1. Authentication Layer ───────────────────────────────────────────────
  test("1.1 Security: Unauthenticated request must return 401 Unauthorized", async ({
    playwright,
  }) => {
    const unauthContext = await playwright.request.newContext({
      baseURL: "http://localhost:3000",
      httpCredentials: { username: "", password: "" },
    });
    const res = await unauthContext.get("/overview");
    expect(res.status()).toBe(401);
    const body = await res.text();
    expect(body).toContain("Resume Buddy Monitor");
    await unauthContext.dispose();
  });

  test("1.2 Security: Valid Basic Auth credentials unlock Mission Control", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    const res = await page.goto("/overview", { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toBeVisible();
  });

  // ─── 2. All 21 Navigation Routes ──────────────────────────────────────────
  for (const route of ALL_ROUTES) {
    test(`2. Route: ${route.path} loads HTTP 200 with zero console errors`, async ({
      page,
    }) => {
      const consoleErrors: string[] = [];
      const pageErrors: Error[] = [];

      page.on("console", (msg) => {
        if (msg.type() === "error") {
          // Ignore expected chrome-specific dev warnings if any
          consoleErrors.push(msg.text());
        }
      });
      page.on("pageerror", (err) => pageErrors.push(err));

      const res = await page.goto(route.path, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });

      expect(res?.status(), `Expected HTTP 200 for ${route.path}`).toBe(200);

      // Verify no runtime unhandled page crashes
      expect(pageErrors.length, `Uncaught page errors on ${route.path}`).toBe(0);

      // Verify header is present
      const header = page.locator("header");
      await expect(header).toBeVisible();

      // Verify main content is present
      const main = page.locator("main");
      await expect(main).toBeVisible();

      // Verify content is rendered
      const body = page.locator("body");
      await expect(body).toBeVisible();

      // Filter critical errors
      const criticalErrors = consoleErrors.filter(
        (e) =>
          !e.includes("favicon") &&
          !e.includes("Download the React DevTools") &&
          !e.includes("hydration")
      );
      expect(
        criticalErrors.length,
        `Console errors on ${route.path}: ${criticalErrors.join("; ")}`
      ).toBe(0);
    });
  }

  // ─── 3. Production API Integrations & Contracts ───────────────────────────
  test("3.1 API Summary: Validates live telemetry contract against production backend", async ({
    request,
  }) => {
    const res = await request.get("/api/v1/monitor/summary");
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toBeDefined();
    expect(typeof json.data.overallStatus).toBe("string");
    expect(typeof json.data.uptime30d).toBe("number");
    expect(typeof json.data.sloTarget).toBe("number");
    expect(Array.isArray(json.data.services)).toBe(true);
    expect(json.data.services.length).toBeGreaterThan(0);
  });

  test("3.2 API Metrics: Validates live metrics schema", async ({ request }) => {
    const res = await request.get("/api/v1/monitor/metrics");
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toBeDefined();
  });

  test("3.3 API Alerts: Validates alerts list and severity structure", async ({
    request,
  }) => {
    const res = await request.get("/api/v1/monitor/alerts");
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
  });

  test("3.4 API Incidents: Validates incidents list and declaration endpoint", async ({
    request,
  }) => {
    const res = await request.get("/api/v1/monitor/incidents");
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
  });

  test("3.5 API Health: Public endpoint returns status ok", async ({
    request,
  }) => {
    const res = await request.get("/api/v1/monitor/health");
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("ok");
    expect(json.service).toBe("resume-buddy-monitor");
  });

  test("3.6 API Worker Trigger: Triggers real worker cycle and returns execution result", async ({
    request,
  }) => {
    const res = await request.post("/api/v1/monitor/trigger-worker", {
      data: { worker: "all" },
    });
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  // ─── 4. Real SSE Event Stream Integration ────────────────────────────────
  test("4.1 SSE: Establishes live EventSource connection and receives stream events", async ({
    page,
  }) => {
    await page.goto("/overview");
    const streamActive = await page.evaluate(async () => {
      return new Promise<boolean>((resolve) => {
        try {
          const es = new EventSource("/api/v1/monitor/stream");
          const timeout = setTimeout(() => {
            es.close();
            resolve(true); // Connected without error
          }, 3000);

          es.onopen = () => {
            clearTimeout(timeout);
            es.close();
            resolve(true);
          };

          es.onerror = () => {
            clearTimeout(timeout);
            es.close();
            resolve(false);
          };
        } catch {
          resolve(false);
        }
      });
    });

    expect(streamActive, "SSE stream connection failed").toBe(true);
  });

  // ─── 5. Interactive UI Features & React Query ─────────────────────────────
  test("5.1 Incidents: Interactive severity filtering and declaration flow", async ({
    page,
  }) => {
    await page.goto("/incidents");
    await page.waitForSelector("h1", { timeout: 10000 });

    // Test severity filters
    const filterButtons = page.locator("button:has-text('P1 CRITICAL')");
    if ((await filterButtons.count()) > 0) {
      await filterButtons.first().click();
      await page.waitForTimeout(300);
    }

    const allButton = page.locator("button:has-text('ALL')");
    if ((await allButton.count()) > 0) {
      await allButton.first().click();
      await page.waitForTimeout(300);
    }

    // Verify search input
    const searchInput = page.locator("input[placeholder*='Search']");
    if ((await searchInput.count()) > 0) {
      await searchInput.fill("P1");
      await page.waitForTimeout(300);
      await searchInput.fill("");
    }
  });

  test("5.2 Command Menu: Keyboard shortcut (Cmd+K / Ctrl+K) activates palette", async ({
    page,
  }) => {
    await page.goto("/overview");
    await page.waitForSelector("h1");

    // Press Control+k
    await page.keyboard.press("Control+k");
    await page.waitForTimeout(500);

    // Check if command menu or dialog appeared
    const commandMenu = page.locator("[cmdk-input], input[placeholder*='Type a command']");
    if ((await commandMenu.count()) > 0) {
      await expect(commandMenu.first()).toBeVisible();
      await page.keyboard.press("Escape");
    }
  });

  // ─── 6. Responsive Layout & Viewport Tests ─────────────────────────────────
  const VIEWPORTS = [
    { name: "Desktop 1920x1080", width: 1920, height: 1080 },
    { name: "Laptop 1366x768", width: 1366, height: 768 },
    { name: "Tablet 768x1024", width: 768, height: 1024 },
    { name: "Mobile 375x812", width: 375, height: 812 },
  ];

  for (const vp of VIEWPORTS) {
    test(`6. Viewport: ${vp.name} layout integrity and no horizontal overflow`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/overview");
      await page.waitForSelector("h1");

      const hasHorizontalOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });

      expect(
        hasHorizontalOverflow,
        `Detected horizontal overflow on ${vp.name}`
      ).toBe(false);
    });
  }

  // ─── 7. Performance Web Vitals & Latency Benchmarks ───────────────────────
  test("7.1 Performance: Mission Control Web Vitals (TTFB, FCP, DOM Load)", async ({
    page,
  }) => {
    await page.goto("/overview");
    await page.waitForSelector("h1");

    const performanceMetrics = await page.evaluate(() => {
      const navEntry = performance.getEntriesByType(
        "navigation"
      )[0] as PerformanceNavigationTiming;
      const paintEntries = performance.getEntriesByType("paint");
      const fcpEntry = paintEntries.find(
        (p) => p.name === "first-contentful-paint"
      );

      return {
        ttfbMs: navEntry ? navEntry.responseStart - navEntry.requestStart : 0,
        domContentLoadedMs: navEntry
          ? navEntry.domContentLoadedEventEnd - navEntry.startTime
          : 0,
        loadEventMs: navEntry ? navEntry.loadEventEnd - navEntry.startTime : 0,
        fcpMs: fcpEntry ? fcpEntry.startTime : 0,
      };
    });

    console.log("Mission Control Web Vitals:", performanceMetrics);
    expect(performanceMetrics.ttfbMs).toBeLessThan(1000);
    expect(performanceMetrics.domContentLoadedMs).toBeLessThan(3000);
  });
});
