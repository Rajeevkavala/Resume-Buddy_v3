import { getEC2Metrics, getS3Metrics, getCloudWatchAlarms } from "@/lib/aws/cloudwatch";
import type { ProbeResult } from "@/types/monitor";

export async function runCloudWatchProbe(): Promise<ProbeResult> {
  const start = Date.now();
  try {
    const metrics = await getEC2Metrics();
    const latency = Date.now() - start;

    const isDown = metrics.statusCheckFailed > 0;
    const isCritical = metrics.cpuUtilization > 90;
    const isDegraded = metrics.cpuUtilization > 75 || metrics.memUsedPercent > 80;

    return {
      serviceKey: "aws-cloudwatch-ec2",
      serviceName: "AWS EC2 Graviton (CloudWatch)",
      status: isDown || isCritical ? "DOWN" : isDegraded ? "DEGRADED" : "HEALTHY",
      latencyMs: latency,
      metadata: {
        cpuUtilization: metrics.cpuUtilization,
        memUsedPercent: metrics.memUsedPercent,
        diskUsedPercent: metrics.diskUsedPercent,
        statusCheckFailed: metrics.statusCheckFailed,
        networkIn: metrics.networkIn,
        networkOut: metrics.networkOut,
      },
      checkedAt: new Date(),
    };
  } catch (error) {
    return {
      serviceKey: "aws-cloudwatch-ec2",
      serviceName: "AWS EC2 Graviton (CloudWatch)",
      status: "DOWN",
      latencyMs: Date.now() - start,
      errorMessage: error instanceof Error ? error.message : "CloudWatch fetch failed",
      checkedAt: new Date(),
    };
  }
}
