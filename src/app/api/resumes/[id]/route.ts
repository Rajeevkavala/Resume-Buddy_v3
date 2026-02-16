import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticateRequest } from '@/lib/api-auth';
import { getPresignedDownloadUrl, deleteFile as deleteStorageFile } from '@/lib/storage';

/**
 * GET /api/resumes/[id] — Get single resume with relations
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticateRequest();
  if (!auth.authenticated) return auth.response;

  const { id } = await params;

  const resume = await prisma.resumeData.findFirst({
    where: { id, userId: auth.userId },
    include: {
      generatedResumes: {
        include: { file: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!resume) {
    return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
  }

  // Generate presigned URLs for any associated files
  const generatedWithUrls = await Promise.all(
    resume.generatedResumes.map(async (gr) => {
      let downloadUrl: string | null = null;
      if (gr.file?.objectKey) {
        try {
          downloadUrl = await getPresignedDownloadUrl(gr.file.objectKey, 3600);
        } catch {
          // File may not exist in storage
        }
      }
      return { ...gr, downloadUrl };
    }),
  );

  return NextResponse.json({
    ...resume,
    generatedResumes: generatedWithUrls,
  });
}

/**
 * PATCH /api/resumes/[id] — Update resume metadata
 * Body: { title?, resumeText?, jobDescription?, isActive? }
 */
export async function PATCH(
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

  const body = await request.json();
  const allowedFields = ['title', 'resumeText', 'jobDescription', 'jobRole', 'isActive'];
  const updateData: Record<string, unknown> = {};

  for (const field of allowedFields) {
    if (field in body) {
      updateData[field] = body[field];
    }
  }

  const updated = await prisma.resumeData.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(updated);
}

/**
 * DELETE /api/resumes/[id] — Soft or hard delete resume
 * Query: ?hard=true for permanent delete
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticateRequest();
  if (!auth.authenticated) return auth.response;

  const { id } = await params;
  const hard = request.nextUrl.searchParams.get('hard') === 'true';

  // Verify ownership
  const existing = await prisma.resumeData.findFirst({
    where: { id, userId: auth.userId },
    include: {
      storedFiles: true,
      generatedResumes: { include: { file: true } },
    },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
  }

  if (hard) {
    // Hard delete: remove files from MinIO + DB records
    for (const sf of existing.storedFiles) {
      if (sf.objectKey) {
        try {
          await deleteStorageFile(sf.objectKey);
        } catch {
          // File may already be deleted
        }
      }
    }

    for (const gr of existing.generatedResumes) {
      if (gr.file?.objectKey) {
        try {
          await deleteStorageFile(gr.file.objectKey);
        } catch {
          // File may already be deleted
        }
      }
    }

    // Delete in order: GeneratedResume → StoredFile → ResumeData
    await prisma.generatedResume.deleteMany({ where: { resumeDataId: id } });
    // Delete StoredFile records linked to this resume (originals) and any stored files
    // referenced by generated resumes.
    const generatedFileIds = existing.generatedResumes
      .map((gr) => gr.fileId)
      .filter(Boolean) as string[];

    await prisma.storedFile.deleteMany({
      where: {
        OR: [
          { resumeDataId: id },
          ...(generatedFileIds.length > 0
            ? [{ id: { in: generatedFileIds } }]
            : []),
        ],
      },
    });
    await prisma.resumeData.delete({ where: { id } });

    return NextResponse.json({ deleted: true, mode: 'hard' });
  } else {
    // Soft delete: set isActive = false
    await prisma.resumeData.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ deleted: true, mode: 'soft' });
  }
}
