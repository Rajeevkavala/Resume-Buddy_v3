// =============================================================================
// Resume Buddy Monitor v2 — Infrastructure & CloudWatch Worker
// =============================================================================

import { BaseMonitoringWorker } from "./base.worker";
import type { ServiceKey, ServiceStatus, EC2Metrics } from "@/types/monitor";
import { getEC2Metrics } from "@/lib/aws/cloudwatch";
import { setLiveMetrics } from "@/lib/redis/live-state";

export class InfrastructureWorker extends BaseMonitoringWorker<EC2Metrics> {
  readonly workerName = "InfrastructureWorker";
  readonly serviceKey: ServiceKey = "aws-cloudwatch-ec2";
  readonly serviceName = "AWS EC2 (CloudWatch)";
  override readonly timeoutMs = 5000;

  protected async runProbe(
    _signal: AbortSignal
  ): Promise<{
    status: ServiceStatus;
    latencyMs: number;
    statusCode?: number;
    errorMessage?: string;
    data?: EC2Metrics;
  }> {
    const start = Date.now();
    try {
      const ec2 = await getEC2Metrics();
      const latencyMs = Date.now() - start;

      let status: ServiceStatus = "HEALTHY";
      if (ec2.statusCheckFailed > 0 || ec2.cpuUtilization > 90) {
        status = "DOWN";
      } else if (ec2.cpuUtilization > 75 || ec2.memUsedPercent > 85) {
        status = "DEGRADED";
      }

      await setLiveMetrics("ec2", ec2);

      return {
        status,
        latencyMs,
        statusCode: 200,
        data: ec2,
      };
    } catch (err: unknown) {
      const latencyMs = Date.now() - start;
      const errorMsg = err instanceof Error ? err.message : "CloudWatch SDK error";
      return {
        status: "DOWN",
        latencyMs,
        statusCode: 500,
        errorMessage: errorMsg,
      };
    }
  }
}
