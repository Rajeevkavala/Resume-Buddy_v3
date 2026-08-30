import {
  S3Client,
  CreateBucketCommand,
  HeadBucketCommand,
  type BucketLocationConstraint,
  type CreateBucketCommandInput,
} from '@aws-sdk/client-s3';

/**
 * Storage client provider for ResumeBuddy.
 * Fully supports native AWS S3 (production) and MinIO (local dev / backward-compat).
 */

export type StorageProvider = 's3' | 'minio';

/** Determine active storage provider based on environment */
export function getStorageProvider(): StorageProvider {
  const explicit = process.env.STORAGE_PROVIDER?.toLowerCase().trim();
  if (explicit === 's3' || explicit === 'minio') {
    return explicit as StorageProvider;
  }
  // Auto-detect: If AWS S3 bucket or AWS keys are set without a local minio endpoint
  if (process.env.AWS_S3_BUCKET || process.env.S3_BUCKET_NAME) {
    return 's3';
  }
  if (process.env.AWS_ACCESS_KEY_ID && !process.env.MINIO_ENDPOINT) {
    return 's3';
  }
  return 's3'; // Default to AWS S3
}

/** Get AWS / Storage region */
export function getStorageRegion(): string {
  return process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'ap-south-1';
}

/** Get the default bucket name */
export function getDefaultBucket(): string {
  return (
    process.env.AWS_S3_BUCKET ||
    process.env.S3_BUCKET_NAME ||
    process.env.MINIO_BUCKET ||
    'resumebuddy-storage'
  );
}

let cachedClient: S3Client | null = null;
let cachedProvider: StorageProvider | null = null;

/**
 * Get a storage client configured for the current environment.
 */
export function getStorageClient(): S3Client {
  const provider = getStorageProvider();

  // Return cached client if provider hasn't changed
  if (cachedClient && cachedProvider === provider) {
    return cachedClient;
  }

  if (provider === 's3') {
    const region = getStorageRegion();
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const credentials =
      accessKeyId && secretAccessKey
        ? { accessKeyId: accessKeyId.trim(), secretAccessKey: secretAccessKey.trim() }
        : undefined;

    cachedClient = new S3Client({
      region,
      credentials,
      forcePathStyle: false, // Standard AWS S3 virtual-hosted style
    });
  } else {
    // MinIO local fallback
    cachedClient = new S3Client({
      region: 'us-east-1',
      endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
      credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
        secretAccessKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
      },
      forcePathStyle: true, // Required for MinIO
    });
  }

  cachedProvider = provider;
  return cachedClient;
}

/**
 * Proxy object that always delegates to the actively configured S3Client.
 * Provides drop-in compatibility for existing imports of `s3Client`.
 */
export const s3Client: S3Client = new Proxy({} as S3Client, {
  get(_target, prop, receiver) {
    const client = getStorageClient();
    const value = Reflect.get(client, prop, receiver);
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});

/** Ensure default bucket exists on startup */
export async function ensureBucket(bucket: string = getDefaultBucket()): Promise<void> {
  const client = getStorageClient();
  const provider = getStorageProvider();

  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
  } catch (err: any) {
    // If bucket does not exist or 404, attempt creation
    const status = err?.$metadata?.httpStatusCode || err?.name;
    if (status === 404 || err?.name === 'NotFound' || err?.name === 'NoSuchBucket') {
      try {
        const region = getStorageRegion();
        const createInput: CreateBucketCommandInput = {
          Bucket: bucket,
          ...(provider === 's3' && region !== 'us-east-1'
            ? {
                CreateBucketConfiguration: {
                  LocationConstraint: region as BucketLocationConstraint,
                },
              }
            : {}),
        };
        await client.send(new CreateBucketCommand(createInput));
        console.log(`[Storage] Created ${provider.toUpperCase()} bucket: ${bucket}`);
      } catch (createErr: any) {
        // Bucket may have been created concurrently or owned by same account
        if (
          createErr?.name !== 'BucketAlreadyOwnedByYou' &&
          createErr?.name !== 'BucketAlreadyExists'
        ) {
          console.warn(`[Storage] Bucket creation warning:`, createErr?.message || createErr);
        }
      }
    }
  }
}
