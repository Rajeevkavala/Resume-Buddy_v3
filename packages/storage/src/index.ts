// Phase 4: Cloud Storage Package
// MinIO (S3-compatible) client + resume storage service

export {
  s3Client,
  ensureBucket,
  getDefaultBucket,
  getStorageClient,
} from './minio-client';

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
