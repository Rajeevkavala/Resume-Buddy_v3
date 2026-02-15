import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticateRequest } from '@/lib/api-auth';
import { uploadFile, validateFileSize, validateResumeFileType } from '@/lib/storage';

/**
 * POST /api/resumes/upload — Upload a resume file
 * Accepts: multipart/form-data with 'file' field
 * Creates StoredFile + optionally ResumeData records
 */
export async function POST(request: NextRequest) {
  const auth = await authenticateRequest();
  if (!auth.authenticated) return auth.response;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const title = (formData.get('title') as string) || undefined;
    const resumeDataId = (formData.get('resumeDataId') as string) || undefined;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const typeCheck = validateResumeFileType(file.type);
    if (!typeCheck.valid) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${typeCheck.allowedTypes.join(', ')}` },
        { status: 400 },
      );
    }

    // Validate file size (tier-based)
    const tier = (auth.tier as 'free' | 'pro') || 'free';
    const sizeCheck = validateFileSize(file.size, tier);
    if (!sizeCheck.valid) {
      return NextResponse.json(
        { error: `File too large. Max ${sizeCheck.maxSizeMB}MB for ${tier} tier.` },
        { status: 400 },
      );
    }

    // Upload to MinIO
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadResult = await uploadFile(
      auth.userId,
      buffer,
      file.name,
      file.type,
      'originals',
    );

    // Create StoredFile record
    const storedFile = await prisma.storedFile.create({
      data: {
        userId: auth.userId,
        filename: uploadResult.objectKey.split('/').pop()!,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        bucket: uploadResult.bucket,
        objectKey: uploadResult.objectKey,
      },
    });

    // Optionally create ResumeData if no resumeDataId provided
    let resumeData = null;
    if (resumeDataId) {
      // Link to existing resume
      resumeData = await prisma.resumeData.findFirst({
        where: { id: resumeDataId, userId: auth.userId },
      });
    } else {
      // Create new ResumeData entry
      resumeData = await prisma.resumeData.create({
        data: {
          userId: auth.userId,
          title: title || file.name.replace(/\.[^/.]+$/, ''),
          isActive: true,
        },
      });
    }

    return NextResponse.json({
      fileId: storedFile.id,
      objectKey: uploadResult.objectKey,
      resumeDataId: resumeData?.id,
      size: file.size,
      filename: file.name,
    });
  } catch (error) {
    console.error('[Upload] Error:', error);
    return NextResponse.json(
      { error: 'Upload failed. Please try again.' },
      { status: 500 },
    );
  }
}
