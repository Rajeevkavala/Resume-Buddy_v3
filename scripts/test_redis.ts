import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.production') });
import { Redis } from 'ioredis';

async function testRedis() {
  const url = process.env.REDIS_URL;
  if (!url) throw new Error('REDIS_URL is missing in .env.production');
  console.log('Testing Redis URL:', url);
  const client = new Redis(url, {
    tls: { rejectUnauthorized: false },
    connectTimeout: 5000,
  });
  const testKey = 'test:ping:' + Date.now();
  await client.set(testKey, 'SUCCESS_UPSTASH', 'EX', 60);
  const val = await client.get(testKey);
  console.log('Redis read back:', val);
  await client.del(testKey);
  client.disconnect();
  console.log('✅ UPSTASH REDIS IS 100% OPERATIONAL!');
}
testRedis().catch(console.error);
