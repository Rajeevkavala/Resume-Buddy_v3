import 'server-only';

import { getPresignedDownloadUrl } from '@/lib/storage';

const AVATAR_URL_TTL_SECONDS = 60 * 60; // 1 hour

export async function resolveAvatarUrl(
  avatar: string | null | undefined,
): Promise<string | null> {
  if (!avatar) return null;

  // If we stored the MinIO/S3 objectKey in DB, mint a fresh presigned URL.
  if (avatar.startsWith('resumes/')) {
    return await getPresignedDownloadUrl(avatar, AVATAR_URL_TTL_SECONDS);
  }

  // Otherwise treat it as an external URL (e.g. Google profile picture).
  return avatar;
}
