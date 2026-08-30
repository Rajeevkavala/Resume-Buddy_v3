import dotenv from 'dotenv';
dotenv.config();
import { getStorageClient, getDefaultBucket, getStorageProvider } from '../src/lib/storage';
import { HeadBucketCommand } from '@aws-sdk/client-s3';

async function testHealth() {
  const start = Date.now();
  const client = getStorageClient();
  const bucket = getDefaultBucket();
  const provider = getStorageProvider();
  console.log(`Probing ${provider.toUpperCase()} Bucket '${bucket}'...`);
  await client.send(new HeadBucketCommand({ Bucket: bucket }));
  console.log(`✅ S3 Health Probe SUCCESS! Latency: ${Date.now() - start}ms`);
}

testHealth().catch(console.error);
