import {
  S3Client,
  HeadBucketCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getS3Metrics } from "@/lib/aws/cloudwatch";
import type { ProbeResult } from "@/types/monitor";

const S3_BUCKET = process.env.AWS_S3_BUCKET || "resumebuddy-storage";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function runS3Probe(): Promise<ProbeResult> {
  const start = Date.now();
  try {
    // HeadBucket check
    const headStart = Date.now();
    await s3Client.send(new HeadBucketCommand({ Bucket: S3_BUCKET }));
    const headLatency = Date.now() - headStart;

    // Small write/delete probe
    const testKey = `monitor/probe-${Date.now()}.txt`;
    await s3Client.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: testKey,
        Body: "monitor-probe-ok",
        ContentType: "text/plain",
      })
    );
    await s3Client.send(
      new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: testKey })
    );

    const totalLatency = Date.now() - start;
    const isDegraded = headLatency > 1500;

    // Enrich with CloudWatch S3 metrics
    let s3Metrics;
    try {
      s3Metrics = await getS3Metrics();
    } catch {
      s3Metrics = null;
    }

    return {
      serviceKey: "aws-s3-storage",
      serviceName: "AWS S3 Storage",
      status: isDegraded ? "DEGRADED" : "HEALTHY",
      latencyMs: headLatency,
      metadata: {
        headBucketLatencyMs: headLatency,
        writeReadDeleteOk: true,
        bucketSizeGB: s3Metrics
          ? (s3Metrics.bucketSizeBytes / 1e9).toFixed(2)
          : null,
        numberOfObjects: s3Metrics?.numberOfObjects ?? null,
      },
      checkedAt: new Date(),
    };
  } catch (error) {
    const isAuth = error instanceof Error && error.message.includes("403");
    return {
      serviceKey: "aws-s3-storage",
      serviceName: "AWS S3 Storage",
      status: "DOWN",
      latencyMs: Date.now() - start,
      statusCode: isAuth ? 403 : 500,
      errorMessage: error instanceof Error ? error.message : "S3 probe failed",
      checkedAt: new Date(),
    };
  }
}
