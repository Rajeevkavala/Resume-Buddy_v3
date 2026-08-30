// =============================================================================
// Resume Buddy Monitor v2 — API: GET & POST /api/v1/monitor/incidents
// Incident management desk backed by PostgreSQL
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import type { ApiResponse, IncidentDTO } from "@/types/api";

export const dynamic = "force-dynamic";

let prismaInstance: PrismaClient | null = null;
function getPrisma(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient();
  }
  return prismaInstance;
}

export async function GET() {
  try {
    const prisma = getPrisma();
    const incidents = await prisma.monitorIncident.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { events: { orderBy: { createdAt: "desc" } } },
    });

    const data: IncidentDTO[] = incidents.map((inc: any) => ({
      id: inc.id,
      incidentNumber: inc.incidentNumber,
      severity: inc.severity,
      status: inc.status,
      title: inc.title,
      impactedService: inc.impactedService,
      triggerReason: inc.triggerReason,
      acknowledgedBy: inc.acknowledgedBy ?? undefined,
      acknowledgedAt: inc.acknowledgedAt?.toISOString(),
      mitigatedAt: inc.mitigatedAt?.toISOString(),
      resolvedAt: inc.resolvedAt?.toISOString(),
      downtimeSeconds: inc.downtimeSeconds ?? undefined,
      postMortem: inc.postMortem ?? undefined,
      createdAt: inc.createdAt.toISOString(),
      updatedAt: inc.updatedAt.toISOString(),
      events: inc.events?.map((e: any) => ({
        id: e.id,
        incidentId: e.incidentId,
        message: e.message,
        actor: e.actor,
        eventType: e.eventType,
        createdAt: e.createdAt.toISOString(),
      })),
    }));

    return NextResponse.json<ApiResponse<IncidentDTO[]>>({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json<ApiResponse<IncidentDTO[]>>({
      success: false,
      data: [],
      error: err instanceof Error ? err.message : "Failed to load incidents",
      timestamp: new Date().toISOString(),
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prisma = getPrisma();

    const incidentNumber = `INC-${Date.now().toString().slice(-6)}`;
    const newIncident = await prisma.monitorIncident.create({
      data: {
        incidentNumber,
        severity: body.severity || "P3_MEDIUM",
        status: "OPEN",
        title: body.title || "Manually Created Incident",
        impactedService: body.impactedService || "global-system",
        triggerReason: body.triggerReason || "Operator initiated",
        events: {
          create: {
            message: "Incident opened by SRE operator",
            actor: body.actor || "operator@resume-buddy.tech",
            eventType: "STATUS_CHANGE",
          },
        },
      },
      include: { events: true },
    });

    return NextResponse.json({
      success: true,
      data: newIncident,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to create incident",
      },
      { status: 500 }
    );
  }
}
