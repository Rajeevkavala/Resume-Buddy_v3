import {
  ensureBucket,
  getDefaultBucket,
  getStorageProvider,
  getStorageRegion,
  uploadFile,
  downloadFileAsBuffer,
  getPresignedDownloadUrl,
  getPresignedUploadUrl,
  listUserFiles,
  getFileMetadata,
  getUserStorageUsage,
  deleteFile,
} from '../packages/storage/src/index.ts';

// Load environment variables from .env
import dotenv from 'dotenv';
dotenv.config();

async function runTests() {
  console.log('====================================================');
  console.log('🚀 Running ResumeBuddy AWS S3 Storage Verification');
  console.log('====================================================');

  console.log('Storage Provider:', getStorageProvider());
  console.log('Storage Region  :', getStorageRegion());
  console.log('Storage Bucket  :', getDefaultBucket());

  const testUserId = `test-user-${Date.now()}`;
  const testContent = Buffer.from(
    'Rajeev Kavala — Full Stack Cloud & AI Engineer Resume Data (AWS S3 Test)',
    'utf-8'
  );
  let uploadedKey = null;

  try {
    // 1. Ensure Bucket
    console.log('\n[1/8] Testing ensureBucket()...');
    await ensureBucket();
    console.log('✅ Bucket ensured successfully.');

    // 2. Upload File
    console.log('\n[2/8] Testing uploadFile()...');
    const uploadResult = await uploadFile(
      testUserId,
      testContent,
      'test-resume.pdf',
      'application/pdf',
      'originals'
    );
    uploadedKey = uploadResult.objectKey;
    console.log('✅ Upload result:', uploadResult);

    // 3. Get Metadata
    console.log('\n[3/8] Testing getFileMetadata()...');
    const metadata = await getFileMetadata(uploadedKey);
    console.log('✅ File metadata:', metadata);
    if (metadata.size !== testContent.length) {
      throw new Error(`Size mismatch: expected ${testContent.length}, got ${metadata.size}`);
    }

    // 4. Download Buffer
    console.log('\n[4/8] Testing downloadFileAsBuffer()...');
    const download = await downloadFileAsBuffer(uploadedKey);
    console.log('✅ Downloaded bytes:', download.buffer.length);
    if (!download.buffer.equals(testContent)) {
      throw new Error('Downloaded buffer does not match uploaded content!');
    }

    // 5. Presigned Download URL
    console.log('\n[5/8] Testing getPresignedDownloadUrl()...');
    const downloadUrl = await getPresignedDownloadUrl(uploadedKey, 300);
    console.log('✅ Presigned download URL generated:\n   ', downloadUrl);
    const fetchResp = await fetch(downloadUrl);
    if (!fetchResp.ok) {
      throw new Error(`Presigned download failed with status ${fetchResp.status}`);
    }
    const fetchedText = await fetchResp.text();
    if (fetchedText !== testContent.toString('utf-8')) {
      throw new Error('Fetched content from presigned URL does not match original!');
    }
    console.log('✅ Presigned GET fetch verified (HTTP 200, contents match).');

    // 6. Presigned Direct Upload URL (PUT)
    console.log('\n[6/8] Testing getPresignedUploadUrl() & direct HTTP PUT...');
    const { uploadUrl, objectKey: presignedKey } = await getPresignedUploadUrl(
      testUserId,
      'direct-upload.pdf',
      'application/pdf',
      300
    );
    console.log('✅ Presigned upload URL generated:\n   ', uploadUrl);
    const directUploadContent = Buffer.from('Direct Browser Upload Test Content', 'utf-8');
    const putResp = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/pdf',
      },
      body: directUploadContent,
    });
    if (!putResp.ok) {
      throw new Error(`Direct PUT upload failed with status ${putResp.status}`);
    }
    console.log('✅ Direct HTTP PUT upload verified (HTTP 200 OK).');

    // Clean up direct upload file
    await deleteFile(presignedKey);

    // 7. List User Files & Usage
    console.log('\n[7/8] Testing listUserFiles() & getUserStorageUsage()...');
    const files = await listUserFiles(testUserId);
    console.log(`✅ Found ${files.length} file(s) for user:`, files.map((f) => f.objectKey));
    const usage = await getUserStorageUsage(testUserId);
    console.log('✅ Storage usage:', usage);

    // 8. Delete File
    console.log('\n[8/8] Testing deleteFile()...');
    await deleteFile(uploadedKey);
    console.log('✅ Deleted test file successfully.');

    console.log('\n====================================================');
    console.log('🎉 ALL 8 AWS S3 STORAGE TESTS PASSED 100% PERFECTLY!');
    console.log('====================================================');
  } catch (error) {
    console.error('\n❌ S3 Storage Test Failed:', error);
    if (uploadedKey) {
      try {
        await deleteFile(uploadedKey);
      } catch {
        // ignore
      }
    }
    process.exit(1);
  }
}

runTests();
