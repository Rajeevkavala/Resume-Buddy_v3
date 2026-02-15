import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/api-auth';
import { getPresignedUploadUrl, validateResumeFileType, validateFileSize } from '@/lib/storage';

/**
 * GET /api/resumes/upload-url — Get presigned upload URL for direct client upload
 * Query: ?filename=resume.pdf&contentType=application/pdf&size=1024
 */
export async function GET(request: NextRequest) {
  const auth = await authenticateRequest();
  if (!auth.authenticated) return auth.response;

  const { searchParams } = request.nextUrl;
  const filename = searchParams.get('filename');
  const contentType = searchParams.get('contentType');
  const size = parseInt(searchParams.get('size') || '0');

  if (!filename || !contentType) {
    return NextResponse.json(
      { error: 'filename and contentType query params are required' },
      { status: 400 },
    );
  }

  // Validate file type
  const typeCheck = validateResumeFileType(contentType);
  if (!typeCheck.valid) {
    return NextResponse.json(
      { error: `Invalid file type. Allowed: ${typeCheck.allowedTypes.join(', ')}` },
      { status: 400 },
    );
  }

  // Validate file size if provided
  if (size > 0) {
    const tier = (auth.tier as 'free' | 'pro') || 'free';
    const sizeCheck = validateFileSize(size, tier);
    if (!sizeCheck.valid) {
      return NextResponse.json(
        { error: `File too large. Max ${sizeCheck.maxSizeMB}MB for ${tier} tier.` },
        { status: 400 },
      );
    }
  }

  const { uploadUrl, objectKey } = await getPresignedUploadUrl(
    auth.userId,
    filename,
    contentType,
    900, // 15 minutes
  );

  return NextResponse.json({ uploadUrl, objectKey });
}
