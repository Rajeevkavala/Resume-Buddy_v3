import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticateRequest } from '@/lib/api-auth';

/**
 * GET /api/resumes — List user's resumes
 * Query params: ?page=1&limit=10&status=active|archived|all
 */
export async function GET(request: NextRequest) {
  const auth = await authenticateRequest();
  if (!auth.authenticated) return auth.response;

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
  const status = searchParams.get('status') || 'active';
  const search = searchParams.get('search') || '';

  const where: Record<string, unknown> = {
    userId: auth.userId,
  };

  if (status === 'active') {
    where.isActive = true;
  } else if (status === 'archived') {
    where.isActive = false;
  }
  // 'all' — no filter on isActive

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { resumeText: { contains: search, mode: 'insensitive' } },
      { jobRole: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [resumes, total] = await Promise.all([
    prisma.resumeData.findMany({
      where,
      include: {
        generatedResumes: {
          include: { file: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.resumeData.count({ where }),
  ]);

  return NextResponse.json({
    resumes,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}
