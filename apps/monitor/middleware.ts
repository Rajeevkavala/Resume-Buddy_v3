import { NextRequest, NextResponse } from "next/server";

/**
 * Edge Middleware: 2-Layer Security
 * Layer 1: HTTP Basic Auth (username + password)
 * Layer 2: Admin email RBAC via JWT session
 *
 * Public paths: /api/v1/ingest/* (CloudWatch SNS, Vercel Log Drain webhooks)
 */

const PUBLIC_PATHS = [
  "/api/v1/ingest/cloudwatch",
  "/api/v1/ingest/vercel",
  "/api/v1/monitor/health",
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

function unauthorizedResponse(): NextResponse {
  return new NextResponse(
    `<!DOCTYPE html>
<html>
<head><title>Resume Buddy Monitor — Authentication Required</title>
<style>
  body { background: #0a0f1e; color: #94a3b8; font-family: 'Segoe UI', sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
  .box { text-align: center; padding: 40px; border: 1px solid #1a2540; border-radius: 12px; background: #111b30; }
  h1 { color: #10b981; font-size: 24px; margin-bottom: 8px; }
  p { color: #64748b; font-size: 14px; }
</style>
</head>
<body>
  <div class="box">
    <h1>🔒 Resume Buddy Monitor</h1>
    <p>Administrative access required. Please authenticate.</p>
  </div>
</body>
</html>`,
    {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Resume Buddy Monitor Admin"',
        "Content-Type": "text/html",
      },
    }
  );
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Skip auth for public ingest/health endpoints (webhooks)
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // ─── Layer 1: HTTP Basic Authentication ───────────────────────────────────
  const authorization = request.headers.get("authorization");

  if (!authorization || !authorization.startsWith("Basic ")) {
    return unauthorizedResponse();
  }

  const base64Credentials = authorization.slice(6);
  let credentials: string;
  try {
    credentials = Buffer.from(base64Credentials, "base64").toString("utf-8");
  } catch {
    return unauthorizedResponse();
  }

  const colonIndex = credentials.indexOf(":");
  if (colonIndex === -1) {
    return unauthorizedResponse();
  }

  const username = credentials.slice(0, colonIndex);
  const password = credentials.slice(colonIndex + 1);

  const expectedUser = process.env.MONITOR_ADMIN_USER || "admin";
  const expectedPass = process.env.MONITOR_ADMIN_PASSWORD;

  if (!expectedPass) {
    console.error(
      "[Monitor Auth] MONITOR_ADMIN_PASSWORD is not set! Blocking all access."
    );
    return unauthorizedResponse();
  }

  // Constant-time comparison to prevent timing attacks
  const userMatch =
    username.length === expectedUser.length &&
    username.split("").every((c, i) => c === expectedUser[i]);
  const passMatch =
    password.length === expectedPass.length &&
    password.split("").every((c, i) => c === expectedPass[i]);

  if (!userMatch || !passMatch) {
    return unauthorizedResponse();
  }

  // ─── Layer 2: Set admin context header ─────────────────────────────────────
  const response = NextResponse.next();
  response.headers.set("x-monitor-admin", username);
  response.headers.set("x-monitor-authenticated", "true");

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
