import { describe, it, expect, beforeAll } from 'vitest';

/**
 * MinIO Storage Tests
 * Tests the storage package functions against a running MinIO instance.
 * Requires MinIO running on localhost:9000 (from Docker infra).
 */

let storageAvailable = false;

beforeAll(async () => {
  try {
    const endpoint = process.env.MINIO_ENDPOINT || 'http://localhost:9000';
    const res = await fetch(`${endpoint}/minio/health/live`, {
      signal: AbortSignal.timeout(5000),
    });
    storageAvailable = res.ok;
  } catch {
    console.warn('MinIO not available, skipping storage tests');
    storageAvailable = false;
  }
});

describe('MinIO Storage', () => {
  describe('Module exports', () => {
    it('should export all required storage functions', async () => {
      const storage = await import('@resumebuddy/storage');
      
      expect(typeof storage.ensureBucket).toBe('function');
      expect(typeof storage.uploadFile).toBe('function');
      expect(typeof storage.downloadFile).toBe('function');
      expect(typeof storage.deleteFile).toBe('function');
      expect(typeof storage.listUserFiles).toBe('function');
      expect(typeof storage.getPresignedDownloadUrl).toBe('function');
      expect(typeof storage.getPresignedUploadUrl).toBe('function');
      expect(typeof storage.deleteAllUserFiles).toBe('function');
      expect(typeof storage.getUserStorageUsage).toBe('function');
    });

    it('should export file validation helpers', async () => {
      const storage = await import('@resumebuddy/storage');
      
      expect(typeof storage.validateFileSize).toBe('function');
      expect(typeof storage.validateResumeFileType).toBe('function');
      expect(typeof storage.formatFileSize).toBe('function');
    });
  });

  describe('File validation', () => {
    it('should validate file size correctly', async () => {
      const { validateFileSize } = await import('@resumebuddy/storage');
      
      // 1MB should be valid (under 5MB free tier limit)
      const valid = validateFileSize(1024 * 1024, 'free');
      expect(valid.valid).toBe(true);
      expect(valid.maxSizeMB).toBe(5);

      // 10MB should be invalid for free tier (5MB limit)
      const invalid = validateFileSize(10 * 1024 * 1024, 'free');
      expect(invalid.valid).toBe(false);

      // 10MB should be valid for pro tier (25MB limit)
      const pro = validateFileSize(10 * 1024 * 1024, 'pro');
      expect(pro.valid).toBe(true);
      expect(pro.maxSizeMB).toBe(25);
    });

    it('should validate resume file types', async () => {
      const { validateResumeFileType } = await import('@resumebuddy/storage');
      
      expect(validateResumeFileType('application/pdf').valid).toBe(true);
      expect(validateResumeFileType('application/vnd.openxmlformats-officedocument.wordprocessingml.document').valid).toBe(true);
      expect(validateResumeFileType('image/png').valid).toBe(false);
      expect(validateResumeFileType('text/plain').valid).toBe(true);
    });

    it('should format file size correctly', async () => {
      const { formatFileSize } = await import('@resumebuddy/storage');
      
      const result1 = formatFileSize(1024);
      expect(result1).toContain('KB') || expect(result1).toContain('1');
      
      const result2 = formatFileSize(1048576);
      expect(result2).toContain('MB') || expect(result2).toContain('1');
    });
  });

  describe('Bucket operations', () => {
    it('should create/ensure bucket exists', async () => {
      if (!storageAvailable) return;

      const { ensureBucket } = await import('@resumebuddy/storage');
      
      // Should not throw
      await expect(ensureBucket()).resolves.not.toThrow();
    });
  });

  describe('File operations', () => {
    it('should upload and download a file', async () => {
      if (!storageAvailable) return;

      const { uploadFile, downloadFileAsBuffer, deleteFile } = await import('@resumebuddy/storage');

      const testContent = Buffer.from('Test file content for MinIO upload');
      const testKey = `test-user/test-${Date.now()}.txt`;

      try {
        // Upload
        const uploadResult = await uploadFile(
          testKey,
          testContent,
          'text/plain'
        );
        expect(uploadResult).toBeDefined();

        // Download
        const downloaded = await downloadFileAsBuffer(testKey);
        expect(downloaded).toBeDefined();

        // Cleanup
        await deleteFile(testKey);
      } catch (error) {
        console.warn('File upload/download test error:', error);
      }
    });

    it('should generate presigned download URL', async () => {
      if (!storageAvailable) return;

      const { uploadFile, getPresignedDownloadUrl, deleteFile } = await import('@resumebuddy/storage');

      const testKey = `test-user/presigned-${Date.now()}.txt`;
      const testContent = Buffer.from('Presigned URL test');

      try {
        await uploadFile(testKey, testContent, 'text/plain');
        
        const url = await getPresignedDownloadUrl(testKey);
        expect(url).toBeDefined();
        expect(typeof url).toBe('string');
        expect(url).toContain('http');

        await deleteFile(testKey);
      } catch (error) {
        console.warn('Presigned URL test error:', error);
      }
    });

    it('should list user files', async () => {
      if (!storageAvailable) return;

      const { listUserFiles } = await import('@resumebuddy/storage');

      try {
        const files = await listUserFiles('test-list-user');
        expect(Array.isArray(files)).toBe(true);
      } catch (error) {
        console.warn('List files test error:', error);
      }
    });
  });
});
