import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticateRequest } from '@/lib/api-auth';

/**
 * POST /api/resumes/[id]/archive — Toggle archive status
 * Body: { archived?: boolean } — if not provided, toggles current state
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticateRequest();
  if (!auth.authenticated) return auth.response;

  const { id } = await params;

  // Verify ownership
  const existing = await prisma.resumeData.findFirst({
    where: { id, userId: auth.userId },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
  }

  let archived: boolean;
  try {
    const body = await request.json();
    archived = typeof body.archived === 'boolean' ? body.archived : !existing.isActive;
  } catch {
    // No body or invalid JSON — toggle
    archived = !existing.isActive;
  }

  const updated = await prisma.resumeData.update({
    where: { id },
    data: { isActive: !archived },
  });

  return NextResponse.json({
    id: updated.id,
    isActive: updated.isActive,
    archived: !updated.isActive,
  });
}
