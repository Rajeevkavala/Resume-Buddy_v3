import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "resume-buddy-monitor",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    region: process.env.AWS_REGION || "ap-south-1",
    uptime: process.uptime?.() ?? 0,
  });
}
