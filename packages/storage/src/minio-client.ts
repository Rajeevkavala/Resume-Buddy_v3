import { S3Client, CreateBucketCommand, HeadBucketCommand } from '@aws-sdk/client-s3';

/**
 * S3-compatible MinIO client for ResumeBuddy storage.
 * Works with MinIO (local) and AWS S3 (production) via STORAGE_PROVIDER env.
 */

const DEFAULT_BUCKET = process.env.MINIO_BUCKET || 'resumebuddy';

/** Create S3-compatible client pointing to MinIO */
export const s3Client = new S3Client({
  region: 'us-east-1',
  endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretAccessKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
  },
  forcePathStyle: true, // Required for MinIO (not virtual-hosted)
});

/** Get the default bucket name */
export function getDefaultBucket(): string {
  return DEFAULT_BUCKET;
}

/** Ensure default bucket exists on startup */
export async function ensureBucket(bucket: string = DEFAULT_BUCKET): Promise<void> {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: bucket }));
  } catch {
    try {
      await s3Client.send(new CreateBucketCommand({ Bucket: bucket }));
      console.log(`[Storage] Created bucket: ${bucket}`);
    } catch (createErr) {
      // Bucket may already exist (race condition) — ignore
      console.warn(`[Storage] Bucket creation warning:`, createErr);
    }
  }
}

/**
 * Get a storage client configured for the current environment.
 * Toggle via STORAGE_PROVIDER env var: 'minio' (default) or 's3'.
 */
export function getStorageClient(): S3Client {
  const provider = process.env.STORAGE_PROVIDER || 'minio';

  if (provider === 's3') {
    return new S3Client({
      region: process.env.AWS_REGION || 'ap-south-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }

  return s3Client; // MinIO default
}
