# Phase 4: Storage & Delivery - Cloud Storage + Resume Library

> **Copilot Agent Prompt for Phase 4 Implementation**
> **Estimated Duration**: ~8 hours
> **Dependencies**: Phase 1 (Infrastructure/MinIO), Phase 2 (Database/Prisma) must be complete
> **Blocking**: Phase 5 (Testing)

---

## Instruction

Take the `ARCHITECTURE_TRANSFORMATION.md` as the **primary reference** and `IMPLEMENTATION_TIMELINE_7_DAYS.md` as the secondary reference for phase-wise implementation.

Now implement **Phase 4 completely end-to-end** — it should work 100% without any errors. Test after implementing.

**Important**: If `IMPLEMENTATION_TIMELINE_7_DAYS.md` does not have enough context, use `ARCHITECTURE_TRANSFORMATION.md` as the primary source of truth for all code, schemas, configurations, and architectural decisions.

**Prerequisite**: Verify these are working:
- MinIO running on port 9000 (from Phase 1)
- PostgreSQL with StoredFile + GeneratedResume models (from Phase 2)
- Auth system with JWT/sessions (from Phase 1)
- Server actions migrated to Prisma (from Phase 2)

---

## Phase 4 Scope

Phase 4 has two sub-phases:
1. **Phase 4.1 — Cloud Storage Backend (MinIO)** (~4 hours)
2. **Phase 4.2 — Resume Library Frontend** (~4 hours)

---

## Phase 4.1: Cloud Storage Backend

### Objective
Build a complete file storage layer using MinIO (S3-compatible), including the MinIO client, resume storage service with full CRUD, presigned URL generation, and API routes.

### Tasks (implement in order)

#### 1. Create `packages/storage` Package
- `package.json` with dependencies: `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `nanoid`, `sharp` (for image processing)
- `tsconfig.json` extending root config
- Export from `src/index.ts`

#### 2. MinIO Client (`packages/storage/src/minio-client.ts`)
```typescript
import { S3Client, CreateBucketCommand, HeadBucketCommand } from '@aws-sdk/client-s3';

// Create S3-compatible client pointing to MinIO
export const s3Client = new S3Client({
  region: 'us-east-1',                    // Required but unused for MinIO
  endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretAccessKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
  },
  forcePathStyle: true,                    // Required for MinIO (not virtual-hosted)
});

const DEFAULT_BUCKET = process.env.MINIO_BUCKET || 'resumebuddy';

// Ensure default bucket exists on startup
export async function ensureBucket(bucket: string = DEFAULT_BUCKET): Promise<void> {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: bucket }));
  } catch {
    await s3Client.send(new CreateBucketCommand({ Bucket: bucket }));
    console.log(`Created bucket: ${bucket}`);
  }
}

// Also can be configured for AWS S3 in production:
export function getStorageClient() {
  const provider = process.env.STORAGE_PROVIDER || 'minio'; // 'minio' | 's3'
  
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
```

#### 3. Resume Storage Service (`packages/storage/src/resume-storage.ts`)
Full file storage service with upload, download, delete, list, and presigned URLs:

```typescript
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
import { s3Client } from './minio-client';

const BUCKET = process.env.MINIO_BUCKET || 'resumebuddy';

// Sub-folders in the bucket:
// resumes/{userId}/originals/       — uploaded resume files (PDF, DOCX)
// resumes/{userId}/generated/       — AI-generated PDFs
// resumes/{userId}/photos/          — profile photos
// resumes/{userId}/exports/         — exported resume PDFs from LaTeX
// temp/                             — temporary files (auto-cleanup)

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

// UPLOAD
export async function uploadFile(
  userId: string,
  file: Buffer,
  filename: string,
  contentType: string,
  subfolder: 'originals' | 'generated' | 'photos' | 'exports' = 'originals'
): Promise<UploadResult> {
  const fileId = nanoid(12);
  const extension = filename.split('.').pop();
  const objectKey = `resumes/${userId}/${subfolder}/${fileId}.${extension}`;

  await s3Client.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: objectKey,
    Body: file,
    ContentType: contentType,
    Metadata: {
      'original-filename': filename,
      'user-id': userId,
      'upload-date': new Date().toISOString(),
    },
  }));

  return {
    objectKey,
    bucket: BUCKET,
    size: file.length,
    contentType,
    url: `${process.env.MINIO_ENDPOINT}/${BUCKET}/${objectKey}`,
  };
}

// DOWNLOAD (returns stream)
export async function downloadFile(objectKey: string): Promise<{
  body: ReadableStream;
  contentType: string;
  size: number;
}> {
  const response = await s3Client.send(new GetObjectCommand({
    Bucket: BUCKET,
    Key: objectKey,
  }));

  return {
    body: response.Body as ReadableStream,
    contentType: response.ContentType || 'application/octet-stream',
    size: response.ContentLength || 0,
  };
}

// DELETE
export async function deleteFile(objectKey: string): Promise<void> {
  await s3Client.send(new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: objectKey,
  }));
}

// LIST user files
export async function listUserFiles(
  userId: string,
  subfolder?: string
): Promise<FileMetadata[]> {
  const prefix = subfolder
    ? `resumes/${userId}/${subfolder}/`
    : `resumes/${userId}/`;

  const response = await s3Client.send(new ListObjectsV2Command({
    Bucket: BUCKET,
    Prefix: prefix,
  }));

  return (response.Contents || []).map(obj => ({
    objectKey: obj.Key!,
    size: obj.Size!,
    contentType: '', // Would need HeadObject for this
    lastModified: obj.LastModified!,
    etag: obj.ETag!,
  }));
}

// PRESIGNED DOWNLOAD URL (time-limited)
export async function getPresignedDownloadUrl(
  objectKey: string,
  expiresInSeconds: number = 3600  // 1 hour default
): Promise<string> {
  return getSignedUrl(s3Client, new GetObjectCommand({
    Bucket: BUCKET,
    Key: objectKey,
  }), { expiresIn: expiresInSeconds });
}

// PRESIGNED UPLOAD URL (for client-side direct upload)
export async function getPresignedUploadUrl(
  userId: string,
  filename: string,
  contentType: string,
  expiresInSeconds: number = 900  // 15 minutes
): Promise<{ uploadUrl: string; objectKey: string }> {
  const fileId = nanoid(12);
  const extension = filename.split('.').pop();
  const objectKey = `resumes/${userId}/originals/${fileId}.${extension}`;

  const uploadUrl = await getSignedUrl(s3Client, new PutObjectCommand({
    Bucket: BUCKET,
    Key: objectKey,
    ContentType: contentType,
    Metadata: {
      'original-filename': filename,
      'user-id': userId,
    },
  }), { expiresIn: expiresInSeconds });

  return { uploadUrl, objectKey };
}

// COPY file (for resume versioning)
export async function copyFile(
  sourceKey: string,
  destinationKey: string
): Promise<void> {
  await s3Client.send(new CopyObjectCommand({
    Bucket: BUCKET,
    CopySource: `${BUCKET}/${sourceKey}`,
    Key: destinationKey,
  }));
}

// GET file metadata
export async function getFileMetadata(objectKey: string): Promise<FileMetadata> {
  const response = await s3Client.send(new HeadObjectCommand({
    Bucket: BUCKET,
    Key: objectKey,
  }));

  return {
    objectKey,
    size: response.ContentLength || 0,
    contentType: response.ContentType || 'application/octet-stream',
    lastModified: response.LastModified || new Date(),
    etag: response.ETag || '',
  };
}

// DELETE all files for a user (account deletion)
export async function deleteAllUserFiles(userId: string): Promise<number> {
  const files = await listUserFiles(userId);
  let deleted = 0;

  for (const file of files) {
    await deleteFile(file.objectKey);
    deleted++;
  }

  return deleted;
}
```

#### 4. Image Processing (`packages/storage/src/image-processor.ts`)
For profile photos and resume thumbnails:

```typescript
import sharp from 'sharp';

export async function processProfilePhoto(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(256, 256, { fit: 'cover', position: 'center' })
    .jpeg({ quality: 85 })
    .toBuffer();
}

export async function generateResumeThumbnail(pdfBuffer: Buffer): Promise<Buffer> {
  // Convert first page of PDF to PNG thumbnail
  // This might need a separate library or service
  // For now, return a placeholder
  return sharp({
    create: { width: 200, height: 280, channels: 3, background: { r: 255, g: 255, b: 255 } },
  }).png().toBuffer();
}

export async function validateImage(buffer: Buffer): Promise<{
  valid: boolean;
  width: number;
  height: number;
  format: string;
}> {
  const metadata = await sharp(buffer).metadata();
  return {
    valid: ['jpeg', 'png', 'webp'].includes(metadata.format || ''),
    width: metadata.width || 0,
    height: metadata.height || 0,
    format: metadata.format || 'unknown',
  };
}
```

#### 5. Resume API Routes
Create RESTful API routes for resume file management:

**GET `/api/resumes`** — List user's resumes
```typescript
// Auth required
// Query params: ?page=1&limit=10&status=active
// Returns: { resumes: ResumeData[], total: number, page: number }
// Joins with StoredFile for file metadata
// Joins with GeneratedResume for export status
```

**GET `/api/resumes/[id]`** — Get single resume
```typescript
// Auth required, check ownership (userId match)
// Returns full ResumeData with relations:
//   - storedFiles, generatedResumes
//   - Include presigned download URLs for files
```

**PATCH `/api/resumes/[id]`** — Update resume
```typescript
// Auth required, check ownership
// Body: { title?, resumeText?, jobDescription?, isActive? }
// Returns updated ResumeData
```

**DELETE `/api/resumes/[id]`** — Delete resume
```typescript
// Auth required, check ownership
// Soft delete: set isActive = false
// OR hard delete: remove from DB + delete files from MinIO
// Delete associated StoredFile records and MinIO objects
```

**GET `/api/resumes/[id]/download`** — Download resume file
```typescript
// Auth required, check ownership
// Generates presigned download URL from MinIO
// Redirects to presigned URL
// OR streams file directly
```

**POST `/api/resumes/[id]/archive`** — Archive/unarchive
```typescript
// Toggle isActive flag
// Move files to archive subfolder in MinIO
```

**POST `/api/resumes/upload`** — Upload resume file
```typescript
// Auth required
// Accept: multipart/form-data
// Validate: file size (tier-based: Free 5MB, Pro 25MB)
// Validate: file type (PDF, DOCX)
// Store file in MinIO via uploadFile()
// Create StoredFile record in PostgreSQL
// Optionally create/update ResumeData
// Return: { fileId, objectKey, resumeDataId }
```

**GET `/api/resumes/upload-url`** — Get presigned upload URL
```typescript
// Auth required
// Query: ?filename=resume.pdf&contentType=application/pdf
// Returns presigned URL for client-side direct upload
// This is for large files to avoid server memory pressure
```

#### 6. Update Export Action with Cloud Storage
Modify the export action in `src/app/actions.ts` to store generated PDFs in MinIO:

```typescript
export async function exportResumeAction(input: {
  userId: string;
  resumeDataId: string;
  templateId: string;
  source: 'resumeText' | 'resumeData';
  resumeText?: string;
  resumeData?: Record<string, unknown>;
}) {
  // 1. Check export limits (tier-based)
  await enforceExportLimit(input.userId);

  // 2. Call LaTeX service (existing)
  const { latexSource, pdfBase64 } = await callLatexCompileService({
    source: input.source,
    templateId: input.templateId,
    resumeText: input.resumeText,
    resumeData: input.resumeData,
    options: { engine: 'tectonic', return: ['latex', 'pdf'] },
  });

  // 3. Store PDF in MinIO
  const pdfBuffer = Buffer.from(pdfBase64, 'base64');
  const uploadResult = await uploadFile(
    input.userId,
    pdfBuffer,
    `resume-${input.templateId}-${Date.now()}.pdf`,
    'application/pdf',
    'exports'
  );

  // 4. Create StoredFile record
  const storedFile = await prisma.storedFile.create({
    data: {
      userId: input.userId,
      filename: uploadResult.objectKey.split('/').pop()!,
      originalName: `resume-${input.templateId}.pdf`,
      mimeType: 'application/pdf',
      size: pdfBuffer.length,
      bucket: uploadResult.bucket,
      objectKey: uploadResult.objectKey,
    },
  });

  // 5. Create GeneratedResume record
  const generatedResume = await prisma.generatedResume.create({
    data: {
      userId: input.userId,
      resumeDataId: input.resumeDataId,
      templateId: input.templateId,
      format: 'PDF',
      latexSource,
      fileId: storedFile.id,
      status: 'COMPLETED',
      generatedAt: new Date(),
    },
  });

  // 6. Increment export usage
  await incrementUsage(input.userId, 'export');

  // 7. Send notification (via queue from Phase 3)
  // await emailQueue.add('export-ready', { ... });

  // 8. Generate download URL
  const downloadUrl = await getPresignedDownloadUrl(uploadResult.objectKey, 86400); // 24h

  return {
    latexSource,
    pdfBase64,
    fileId: storedFile.id,
    downloadUrl,
    generatedResumeId: generatedResume.id,
  };
}
```

#### 7. Storage Package Exports (`packages/storage/src/index.ts`)
```typescript
export * from './minio-client';
export * from './resume-storage';
export * from './image-processor';
```

---

## Phase 4.2: Resume Library Frontend

### Objective
Build a Resume Library UI that displays all saved resumes with file management capabilities: view, download, delete, search, filter.

### Tasks (implement in order)

#### 1. Resume Library Page (`apps/web/src/app/resume-library/page.tsx`)
```typescript
// Server Component that fetches user's resumes
// Route: /resume-library (add to middleware protected routes)
// Layout: Grid view with resume cards

// Features:
// - Grid/List view toggle
// - Search by title/content
// - Filter: active, archived, all
// - Sort: newest, oldest, recently analyzed
// - Pagination or infinite scroll
```

#### 2. Resume Card Component (`apps/web/src/components/resume-card.tsx`)
```typescript
// Individual resume card showing:
// - Title (editable inline)
// - Template badge (if generated)
// - ATS Score badge (if analyzed)
// - Last modified date
// - Thumbnail (if available)
// - Action buttons:
//   - View/Open → navigate to /analysis with this resume loaded
//   - Download → trigger presigned URL download
//   - Export → open template selector + generate PDF
//   - Delete → confirmation dialog → soft delete
//   - Archive → toggle active/archived
// - Status indicator (draft, analyzed, exported)

// Use shadcn/ui: Card, Badge, Button, DropdownMenu, AlertDialog
```

#### 3. Resume Upload Component (`apps/web/src/components/resume-upload.tsx`)
```typescript
// Drag-and-drop file upload component
// Features:
// - Drag and drop zone with visual feedback
// - File type validation (PDF, DOCX only)
// - File size validation (tier-based: Free 5MB, Pro 25MB)
// - Upload progress bar
// - Uses presigned URL for direct upload to MinIO
// - Creates ResumeData record after successful upload
// - Extracts text from PDF/DOCX (client-side or server-side)
// - Auto-triggers analysis after upload (optional)

// Two upload modes:
// 1. Direct upload via presigned URL (large files)
// 2. Server upload via /api/resumes/upload (small files, with text extraction)

// Use shadcn/ui: Input, Progress, Alert
// Use react-dropzone or native drag-and-drop
```

#### 4. Resume Download Handler
```typescript
// Utility function for downloading files from presigned URLs
export async function downloadResume(resumeId: string): Promise<void> {
  // 1. Call API to get presigned download URL
  const response = await fetch(`/api/resumes/${resumeId}/download`);
  const { downloadUrl, filename } = await response.json();

  // 2. Create temporary <a> element and trigger download
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename;
  link.click();
}
```

#### 5. Resume Version History (`apps/web/src/components/resume-versions.tsx`)
```typescript
// Show history of generated resumes for a given ResumeData
// Each version shows:
// - Template used
// - Generation date
// - File size
// - Download button
// - Delete button

// Query: prisma.generatedResume.findMany({ where: { resumeDataId, userId } })
```

#### 6. Storage Usage Indicator (`apps/web/src/components/storage-usage.tsx`)
```typescript
// Show user's storage usage:
// - Total files count
// - Total storage used (sum of file sizes)
// - Tier limit indicator
//   - Free: 3 resumes, 5MB per file
//   - Pro: 50 resumes, 25MB per file
// - Progress bar visual
// Use shadcn/ui: Progress, Card
```

#### 7. Update Dashboard
Integrate resume library into the existing dashboard:
- Add "My Resumes" section with recent resumes (last 5)
- Add "View All" link to `/resume-library`
- Show storage usage summary
- Quick upload button

#### 8. Update Navigation
Add "Resume Library" link to the main navigation/sidebar:
```typescript
// In header/navigation component:
{ href: '/resume-library', label: 'My Resumes', icon: FileText }
```

#### 9. Update Middleware
Add `/resume-library` to protected routes in `middleware.ts`.

---

## Required Dependencies to Install

```bash
# In packages/storage
pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner nanoid sharp
pnpm add -D @types/sharp

# In apps/web (for file upload UI)
pnpm add react-dropzone  # Optional, can use native drag-and-drop
```

---

## File Deliverables Checklist

```
Phase 4.1 (Cloud Storage Backend):
├── packages/storage/package.json                    ✅
├── packages/storage/tsconfig.json                   ✅
├── packages/storage/src/minio-client.ts             ✅
├── packages/storage/src/resume-storage.ts           ✅
├── packages/storage/src/image-processor.ts          ✅
├── packages/storage/src/index.ts                    ✅
├── apps/web/src/app/api/resumes/route.ts            ✅ (GET list)
├── apps/web/src/app/api/resumes/upload/route.ts     ✅ (POST upload)
├── apps/web/src/app/api/resumes/upload-url/route.ts ✅ (GET presigned)
├── apps/web/src/app/api/resumes/[id]/route.ts       ✅ (GET/PATCH/DELETE)
├── apps/web/src/app/api/resumes/[id]/download/route.ts ✅
├── apps/web/src/app/api/resumes/[id]/archive/route.ts  ✅
├── src/app/actions.ts (export action updated)       ✅

Phase 4.2 (Resume Library Frontend):
├── apps/web/src/app/resume-library/page.tsx         ✅
├── apps/web/src/app/resume-library/layout.tsx       ✅ (optional)
├── apps/web/src/components/resume-card.tsx           ✅
├── apps/web/src/components/resume-upload.tsx         ✅
├── apps/web/src/components/resume-versions.tsx       ✅
├── apps/web/src/components/storage-usage.tsx         ✅
├── Dashboard updated with resume section            ✅
├── Navigation updated                               ✅
├── middleware.ts (resume-library added)             ✅
```

---

## Phase 4 Exit Criteria (Test All)

```
Cloud Storage:
- [ ] MinIO client connects successfully
- [ ] Default bucket 'resumebuddy' created automatically
- [ ] File upload to MinIO works (PDF, DOCX)
- [ ] File download from MinIO works (stream or presigned URL)
- [ ] File deletion from MinIO works
- [ ] List user files returns correct results
- [ ] Presigned download URL works (valid for 1 hour)
- [ ] Presigned upload URL works (client-side direct upload)
- [ ] File size validation enforced (tier-based)
- [ ] File type validation enforced (PDF, DOCX)
- [ ] StoredFile record created in PostgreSQL after upload
- [ ] Profile photo upload + resize to 256x256 works
- [ ] Export action stores PDF in MinIO + creates records

Resume Library Frontend:
- [ ] /resume-library page loads with all user resumes
- [ ] Grid/List view toggle works
- [ ] Resume card shows title, score, date, status
- [ ] Click resume card → opens in analysis view
- [ ] Download button triggers file download
- [ ] Delete button shows confirmation → removes resume
- [ ] Archive/unarchive toggles work
- [ ] Drag-and-drop file upload works
- [ ] Upload progress indicator shows correctly
- [ ] File type/size validation shows error messages
- [ ] Resume version history shows generated PDFs
- [ ] Storage usage indicator shows correct values
- [ ] Dashboard shows recent resumes section
- [ ] Navigation includes "My Resumes" link
- [ ] Protected route redirects unauthenticated users

Verification Commands:
# Test MinIO directly:
curl -X PUT http://localhost:9000/resumebuddy/test.txt \
  -H "Content-Type: text/plain" \
  -d "test"

# MinIO console: http://localhost:9001
# Check bucket contents visually

# Test API routes:
curl -X POST http://localhost:9002/api/resumes/upload \
  -H "Cookie: rb_session=..." \
  -F "file=@resume.pdf"

curl http://localhost:9002/api/resumes \
  -H "Cookie: rb_session=..."
```

---

## Important Notes

1. **MinIO vs S3**: The code uses `@aws-sdk/client-s3` which works with both MinIO (local) and AWS S3 (production). Toggle via `STORAGE_PROVIDER` env var.
2. **Presigned URLs**: These are S3-compatible presigned URLs. For MinIO, ensure the endpoint is accessible from the client's browser (use `localhost` for local dev, public domain for production).
3. **File size limits**: Enforce BOTH in the API route (server-side) AND the upload component (client-side) for good UX.
4. **CORS for direct upload**: If using presigned upload URLs, MinIO must have CORS configured to allow uploads from the browser. Add CORS rules to the MinIO bucket.
5. **Soft vs Hard Delete**: Prefer soft delete (set `isActive = false`) for resumes. Add a cleanup job (Phase 5) to permanently delete after 30 days.
6. **Text extraction**: Extracting text from uploaded PDFs is needed for AI analysis. Consider using `pdf-parse` or calling the existing resume parser. This can happen asynchronously after upload.
7. **The existing `file-uploader.tsx` component** may need to be updated or replaced with the new `resume-upload.tsx` that uses MinIO.
