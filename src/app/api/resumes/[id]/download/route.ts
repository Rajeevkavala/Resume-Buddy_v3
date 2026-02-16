import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticateRequest } from '@/lib/api-auth';
import { getPresignedDownloadUrl } from '@/lib/storage';

/**
 * GET /api/resumes/[id]/download — Download resume file
 * Returns a presigned download URL or redirects to it
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticateRequest();
  if (!auth.authenticated) return auth.response;

  const { id } = await params;

  const source = request.nextUrl.searchParams.get('source') || 'auto';

  // Find the resume and its latest generated file
  const resume = await prisma.resumeData.findFirst({
    where: { id, userId: auth.userId },
    include: {
      storedFiles: {
        where: { objectKey: { contains: '/originals/' } },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      generatedResumes: {
        where: { status: 'COMPLETED' },
        include: { file: true },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!resume) {
    return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
  }

  const latestGenerated = resume.generatedResumes[0]?.file || null;
  const latestOriginal = resume.storedFiles[0] || null;

  const pickFile = () => {
    if (source === 'generated') return latestGenerated;
    if (source === 'original') return latestOriginal;
    // auto: prefer generated, fallback to original
    return latestGenerated || latestOriginal;
  };

  const file = pickFile();
  if (!file?.objectKey) {
    return NextResponse.json(
      { error: 'No file found for this resume' },
      { status: 404 },
    );
  }

  try {
    const downloadUrl = await getPresignedDownloadUrl(
      file.objectKey,
      86400, // 24 hours
    );

    const filename = file.originalName || 'resume.pdf';

    // Check if client wants redirect or JSON
    const accept = request.headers.get('accept') || '';
    if (accept.includes('application/json')) {
      return NextResponse.json({ downloadUrl, filename });
    }

    // Redirect to presigned URL
    return NextResponse.redirect(downloadUrl);
  } catch (error) {
    console.error('[Download] Error generating presigned URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate download link' },
      { status: 500 },
    );
  }
}
