import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { getSessionCookie } from '@/lib/auth-cookies';
import { uploadFile, deleteFile, getPresignedDownloadUrl, listUserFiles } from '@/lib/storage';

const AVATAR_URL_TTL_SECONDS = 60 * 60; // 1 hour

/**
 * POST /api/auth/profile/photo — Upload profile photo
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate
    const sessionId = await getSessionCookie();
    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    // 2. Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('photo') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No photo file provided' }, { status: 400 });
    }

    // 3. Validate file
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image must be less than 5MB' }, { status: 400 });
    }

    // 4. Convert to Buffer and upload to MinIO
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const filename = file.name || 'avatar.jpg';

    const result = await uploadFile(
      session.userId,
      buffer,
      filename,
      file.type,
      'photos',
    );

    // 5. Generate a short-lived URL (SigV4 presigned URLs max out at 7 days)
    const photoUrl = await getPresignedDownloadUrl(result.objectKey, AVATAR_URL_TTL_SECONDS);

    // 6. Update user avatar in DB
    await prisma.user.update({
      where: { id: session.userId },
      // Store objectKey so we can mint fresh presigned URLs later
      data: { avatar: result.objectKey },
    });

    return NextResponse.json({
      success: true,
      photoUrl,
      avatarUrl: photoUrl,
      objectKey: result.objectKey,
    });
  } catch (error) {
    console.error('[ProfilePhoto] Upload error:', error);
    return NextResponse.json({ error: 'Failed to upload photo' }, { status: 500 });
  }
}

/**
 * DELETE /api/auth/profile/photo — Delete profile photo
 */
export async function DELETE(request: NextRequest) {
  try {
    const sessionId = await getSessionCookie();
    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    // Delete user's uploaded files from storage
    try {
      const userFiles = await listUserFiles(session.userId, 'photos');
      for (const f of userFiles) {
        try {
          await deleteFile(f.objectKey);
        } catch {
          // File might not exist
        }
      }
    } catch (error) {
      console.error('[ProfilePhoto] Delete from storage error:', error);
    }

    // Clear avatar in DB
    await prisma.user.update({
      where: { id: session.userId },
      data: { avatar: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[ProfilePhoto] Delete error:', error);
    return NextResponse.json({ error: 'Failed to delete photo' }, { status: 500 });
  }
}
