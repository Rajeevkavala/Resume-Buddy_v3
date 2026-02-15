// Re-export from packages/storage for use in the Next.js app via @/lib/storage
// This bridges the monorepo package to the app's import system

export {
  s3Client,
  ensureBucket,
  getDefaultBucket,
  getStorageClient,
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
  validateImageBuffer,
  validateFileSize,
  validateResumeFileType,
  formatFileSize,
} from '../../packages/storage/src';

export type {
  UploadResult,
  FileMetadata,
  StorageSubfolder,
} from '../../packages/storage/src';
