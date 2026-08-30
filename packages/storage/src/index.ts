// Cloud Storage Package
// AWS S3 client + resume storage service (with MinIO fallback)

export {
  s3Client,
  ensureBucket,
  getDefaultBucket,
  getStorageClient,
  getStorageProvider,
  getStorageRegion,
} from './minio-client';

export type { StorageProvider } from './minio-client';

export {
  uploadFile,
  downloadFile,
  downloadFileAsBuffer,
  deleteFile,
  listUserFiles,
  getPresignedDownloadUrl,
  getPresignedUploadUrl,
  copyFile,
  getFileMetadata,
  deleteAllUserFiles,
  getUserStorageUsage,
} from './resume-storage';

export type {
  UploadResult,
  FileMetadata,
  StorageSubfolder,
} from './resume-storage';

export {
  validateImageBuffer,
  validateFileSize,
  validateResumeFileType,
  formatFileSize,
} from './image-processor';
