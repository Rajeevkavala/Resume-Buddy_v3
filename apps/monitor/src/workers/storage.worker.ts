// =============================================================================
// Resume Buddy Monitor v2 — AWS S3 Storage Worker
// =============================================================================

import { BaseMonitoringWorker } from "./base.worker";
import type { ServiceKey, ServiceStatus } from "@/types/monitor";
import {
  S3Client,
  HeadBucketCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

let s3ClientInstance: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3ClientInstance) {
    const accessKeyId = process.env.APP_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.APP_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
    const region = process.env.APP_AWS_REGION || process.env.AWS_REGION || "ap-south-1";

    s3ClientInstance = new S3Client({
      region,
      credentials:
        accessKeyId && secretAccessKey
          ? {
              accessKeyId,
              secretAccessKey,
            }
          : undefined,
    });
  }
  return s3ClientInstance;
}

export class StorageWorker extends BaseMonitoringWorker {
  readonly workerName = "StorageWorker";
  readonly serviceKey: ServiceKey = "aws-s3-storage";
  readonly serviceName = "AWS S3 Bucket";
  override readonly timeoutMs = 5000;

  protected async runProbe(
    _signal: AbortSignal
  ): Promise<{
    status: ServiceStatus;
    latencyMs: number;
    statusCode?: number;
    errorMessage?: string;
    data?: Record<string, unknown>;
  }> {
    const bucket =
      process.env.AWS_S3_BUCKET || "resumebuddy-storage";
    const s3 = getS3Client();
    const start = Date.now();

    try {
      await s3.send(new HeadBucketCommand({ Bucket: bucket }));
      const headLatency = Date.now() - start;

      const testKey = `monitor-probes/ping-${Date.now()}.txt`;
      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: testKey,
          Body: "monitor-probe-ok",
          ContentType: "text/plain",
        })
      );
      await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: testKey }));

      const totalLatency = Date.now() - start;

      let status: ServiceStatus = "HEALTHY";
      if (totalLatency > 3000) {
        status = "DEGRADED";
      }

      return {
        status,
        latencyMs: totalLatency,
        statusCode: 200,
        data: {
          bucket,
          headLatencyMs: headLatency,
          writeTestOk: true,
        },
      };
    } catch (err: unknown) {
      const latencyMs = Date.now() - start;
      return {
        status: "DOWN",
        latencyMs,
        statusCode: 500,
        errorMessage:
          err instanceof Error ? err.message : "S3 bucket probe failed",
      };
    }
  }
}
