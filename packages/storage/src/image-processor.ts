/**
 * Image processing utilities for profile photos and resume thumbnails.
 * Uses pure buffer manipulation to avoid native dependency (sharp) issues.
 */

/** Validate image type from buffer magic bytes */
export function validateImageBuffer(buffer: Buffer): {
  valid: boolean;
  format: string;
} {
  // Check magic bytes
  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    return { valid: true, format: 'jpeg' };
  }
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return { valid: true, format: 'png' };
  }
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46
  ) {
    return { valid: true, format: 'webp' };
  }
  return { valid: false, format: 'unknown' };
}

/** Check if file size is within the tier limit */
export function validateFileSize(
  sizeBytes: number,
  tier: 'free' | 'pro',
): { valid: boolean; maxSizeMB: number } {
  const maxSizeMB = tier === 'pro' ? 25 : 5;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return { valid: sizeBytes <= maxSizeBytes, maxSizeMB };
}

/** Check if file type is allowed for resume upload */
export function validateResumeFileType(
  mimeType: string,
): { valid: boolean; allowedTypes: string[] } {
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'text/plain',
  ];
  return { valid: allowedTypes.includes(mimeType), allowedTypes };
}

/** Get a human-readable file size */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
