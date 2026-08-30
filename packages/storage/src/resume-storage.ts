import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
  CopyObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { nanoid } from 'nanoid';
import {
  s3Client,
  getDefaultBucket,
  ensureBucket,
  getStorageProvider,
  getStorageRegion,
} from './minio-client';

/**
 * Resume storage service — CRUD operations for files in AWS S3 / MinIO.
 *
 * Folder structure in bucket:
 *   resumes/{userId}/originals/   — uploaded resume files (PDF, DOCX)
 *   resumes/{userId}/generated/   — AI-generated PDFs
 *   resumes/{userId}/photos/      — profile photos
 *   resumes/{userId}/exports/     — exported resume PDFs from LaTeX
 *   temp/                         — temporary files (auto-cleanup)
 */

// ─── Types ───────────────────────────────────────────────

export type StorageSubfolder = 'originals' | 'generated' | 'photos' | 'exports';

export interface UploadResult {
  objectKey: string;
  bucket: string;
  size: number;
  contentType: string;
  url: string;
}

export interface FileMetadata {
  objectKey: string;
  size: number;
  contentType: string;
  lastModified: Date;
  etag: string;
}

// ─── Upload ──────────────────────────────────────────────

export async function uploadFile(
  userId: string,
  file: Buffer,
  filename: string,
  contentType: string,
  subfolder: StorageSubfolder = 'originals',
): Promise<UploadResult> {
  const bucket = getDefaultBucket();
  await ensureBucket(bucket);
  const fileId = nanoid(12);
  const extension = filename.split('.').pop() || 'bin';
  const objectKey = `resumes/${userId}/${subfolder}/${fileId}.${extension}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      Body: file,
      ContentType: contentType,
      Metadata: {
        'original-filename': filename,
        'user-id': userId,
        'upload-date': new Date().toISOString(),
      },
    }),
  );

  const provider = getStorageProvider();
  const region = getStorageRegion();
  const url =
    provider === 's3'
      ? `https://${bucket}.s3.${region}.amazonaws.com/${objectKey}`
      : `${process.env.MINIO_ENDPOINT || 'http://localhost:9000'}/${bucket}/${objectKey}`;

  return {
    objectKey,
    bucket,
    size: file.length,
    contentType,
    url,
  };
}

// ─── Download ────────────────────────────────────────────

export async function downloadFile(objectKey: string): Promise<{
  body: ReadableStream | NodeJS.ReadableStream;
  contentType: string;
  size: number;
}> {
  const bucket = getDefaultBucket();
  const response = await s3Client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: objectKey,
    }),
  );

  return {
    body: response.Body as ReadableStream,
    contentType: response.ContentType || 'application/octet-stream',
    size: response.ContentLength || 0,
  };
}

/** Download file as Buffer */
export async function downloadFileAsBuffer(objectKey: string): Promise<{
  buffer: Buffer;
  contentType: string;
  size: number;
}> {
  const bucket = getDefaultBucket();
  const response = await s3Client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: objectKey,
    }),
  );

  const chunks: Uint8Array[] = [];
  const stream = response.Body as AsyncIterable<Uint8Array>;
  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  return {
    buffer: Buffer.concat(chunks),
    contentType: response.ContentType || 'application/octet-stream',
    size: response.ContentLength || 0,
  };
}

// ─── Delete ──────────────────────────────────────────────

export async function deleteFile(objectKey: string): Promise<void> {
  const bucket = getDefaultBucket();
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: objectKey,
    }),
  );
}

// ─── List ────────────────────────────────────────────────

export async function listUserFiles(
  userId: string,
  subfolder?: string,
): Promise<FileMetadata[]> {
  const bucket = getDefaultBucket();
  const prefix = subfolder
    ? `resumes/${userId}/${subfolder}/`
    : `resumes/${userId}/`;

  const response = await s3Client.send(
    new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
    }),
  );

  return (response.Contents || []).map((obj) => ({
    objectKey: obj.Key!,
    size: obj.Size || 0,
    contentType: '',
    lastModified: obj.LastModified || new Date(),
    etag: obj.ETag || '',
  }));
}

// ─── Presigned URLs ──────────────────────────────────────

/** Generate presigned download URL (time-limited, default 1hr) */
export async function getPresignedDownloadUrl(
  objectKey: string,
  expiresInSeconds: number = 3600,
): Promise<string> {
  const bucket = getDefaultBucket();
  await ensureBucket(bucket);
  return getSignedUrl(
    s3Client,
    new GetObjectCommand({
      Bucket: bucket,
      Key: objectKey,
    }),
    { expiresIn: expiresInSeconds },
  );
}

/** Generate presigned upload URL for client-side direct upload */
export async function getPresignedUploadUrl(
  userId: string,
  filename: string,
  contentType: string,
  expiresInSeconds: number = 900,
): Promise<{ uploadUrl: string; objectKey: string }> {
  const bucket = getDefaultBucket();
  await ensureBucket(bucket);
  const fileId = nanoid(12);
  const extension = filename.split('.').pop() || 'bin';
  const objectKey = `resumes/${userId}/originals/${fileId}.${extension}`;

  const uploadUrl = await getSignedUrl(
    s3Client,
    new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      ContentType: contentType,
      Metadata: {
        'original-filename': filename,
        'user-id': userId,
      },
    }),
    { expiresIn: expiresInSeconds },
  );

  return { uploadUrl, objectKey };
}

// ─── Copy / Version ─────────────────────────────────────

/** Copy file (e.g. for resume versioning) */
export async function copyFile(
  sourceKey: string,
  destinationKey: string,
): Promise<void> {
  const bucket = getDefaultBucket();
  await s3Client.send(
    new CopyObjectCommand({
      Bucket: bucket,
      CopySource: `${bucket}/${sourceKey}`,
      Key: destinationKey,
    }),
  );
}

// ─── Metadata ────────────────────────────────────────────

export async function getFileMetadata(objectKey: string): Promise<FileMetadata> {
  const bucket = getDefaultBucket();
  const response = await s3Client.send(
    new HeadObjectCommand({
      Bucket: bucket,
      Key: objectKey,
    }),
  );

  return {
    objectKey,
    size: response.ContentLength || 0,
    contentType: response.ContentType || 'application/octet-stream',
    lastModified: response.LastModified || new Date(),
    etag: response.ETag || '',
  };
}

// ─── Bulk Operations ─────────────────────────────────────

/** Delete ALL files for a user (account deletion) */
export async function deleteAllUserFiles(userId: string): Promise<number> {
  const files = await listUserFiles(userId);
  let deleted = 0;

  for (const file of files) {
    await deleteFile(file.objectKey);
    deleted++;
  }

  return deleted;
}

/** Get total storage usage for a user (in bytes) */
export async function getUserStorageUsage(userId: string): Promise<{
  totalSize: number;
  fileCount: number;
}> {
  const files = await listUserFiles(userId);
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  return { totalSize, fileCount: files.length };
}
