import {
  CloudWatchClient,
  GetMetricDataCommand,
  DescribeAlarmsCommand,
  type MetricDataQuery,
} from "@aws-sdk/client-cloudwatch";
import type {
  EC2Metrics,
  S3Metrics,
  CloudWatchAlarmState,
} from "@/types/monitor";

// ─── CloudWatch Client (ap-south-1) ──────────────────────────────────────────

const cwClient = new CloudWatchClient({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const EC2_INSTANCE_ID =
  process.env.AWS_EC2_INSTANCE_ID || "i-0000000000000000";
const S3_BUCKET = process.env.AWS_S3_BUCKET || "resumebuddy-storage";

// ─── EC2 Host Metrics (CPU + CWAgent) ────────────────────────────────────────

export async function getEC2Metrics(): Promise<EC2Metrics> {
  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - 10 * 60 * 1000); // last 10 min

  const queries: MetricDataQuery[] = [
    {
      Id: "cpu",
      MetricStat: {
        Metric: {
          Namespace: "AWS/EC2",
          MetricName: "CPUUtilization",
          Dimensions: [{ Name: "InstanceId", Value: EC2_INSTANCE_ID }],
        },
        Period: 60,
        Stat: "Average",
      },
    },
    {
      Id: "statusCheck",
      MetricStat: {
        Metric: {
          Namespace: "AWS/EC2",
          MetricName: "StatusCheckFailed",
          Dimensions: [{ Name: "InstanceId", Value: EC2_INSTANCE_ID }],
        },
        Period: 60,
        Stat: "Maximum",
      },
    },
    {
      Id: "networkIn",
      MetricStat: {
        Metric: {
          Namespace: "AWS/EC2",
          MetricName: "NetworkIn",
          Dimensions: [{ Name: "InstanceId", Value: EC2_INSTANCE_ID }],
        },
        Period: 60,
        Stat: "Sum",
      },
    },
    {
      Id: "networkOut",
      MetricStat: {
        Metric: {
          Namespace: "AWS/EC2",
          MetricName: "NetworkOut",
          Dimensions: [{ Name: "InstanceId", Value: EC2_INSTANCE_ID }],
        },
        Period: 60,
        Stat: "Sum",
      },
    },
    // CWAgent metrics (memory, disk, swap)
    {
      Id: "memUsed",
      MetricStat: {
        Metric: {
          Namespace: "CWAgent",
          MetricName: "mem_used_percent",
          Dimensions: [{ Name: "InstanceId", Value: EC2_INSTANCE_ID }],
        },
        Period: 60,
        Stat: "Average",
      },
    },
    {
      Id: "diskUsed",
      MetricStat: {
        Metric: {
          Namespace: "CWAgent",
          MetricName: "disk_used_percent",
          Dimensions: [
            { Name: "InstanceId", Value: EC2_INSTANCE_ID },
            { Name: "path", Value: "/" },
            { Name: "fstype", Value: "ext4" },
          ],
        },
        Period: 60,
        Stat: "Average",
      },
    },
    {
      Id: "swapUsed",
      MetricStat: {
        Metric: {
          Namespace: "CWAgent",
          MetricName: "swap_used_percent",
          Dimensions: [{ Name: "InstanceId", Value: EC2_INSTANCE_ID }],
        },
        Period: 60,
        Stat: "Average",
      },
    },
  ];

  try {
    const response = await cwClient.send(
      new GetMetricDataCommand({
        MetricDataQueries: queries,
        StartTime: startTime,
        EndTime: endTime,
      })
    );

    const getLatest = (id: string): number => {
      const result = response.MetricDataResults?.find((r) => r.Id === id);
      const values = result?.Values;
      return values && values.length > 0 ? values[0] : 0;
    };

    return {
      cpuUtilization: getLatest("cpu"),
      memUsedPercent: getLatest("memUsed"),
      diskUsedPercent: getLatest("diskUsed"),
      swapUsedPercent: getLatest("swapUsed"),
      statusCheckFailed: getLatest("statusCheck"),
      networkIn: getLatest("networkIn"),
      networkOut: getLatest("networkOut"),
      timestamp: new Date(),
    };
  } catch (error) {
    console.error("[CloudWatch] Failed to fetch EC2 metrics:", error);
    return {
      cpuUtilization: 0,
      memUsedPercent: 0,
      diskUsedPercent: 0,
      swapUsedPercent: 0,
      statusCheckFailed: 0,
      networkIn: 0,
      networkOut: 0,
      timestamp: new Date(),
    };
  }
}

// ─── Historical EC2 Metrics for Charts ───────────────────────────────────────

export async function getEC2MetricsHistory(
  hours = 24
): Promise<Array<{ timestamp: Date; cpu: number; memory: number }>> {
  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000);

  try {
    const response = await cwClient.send(
      new GetMetricDataCommand({
        MetricDataQueries: [
          {
            Id: "cpu",
            MetricStat: {
              Metric: {
                Namespace: "AWS/EC2",
                MetricName: "CPUUtilization",
                Dimensions: [{ Name: "InstanceId", Value: EC2_INSTANCE_ID }],
              },
              Period: 300, // 5-min granularity
              Stat: "Average",
            },
          },
          {
            Id: "mem",
            MetricStat: {
              Metric: {
                Namespace: "CWAgent",
                MetricName: "mem_used_percent",
                Dimensions: [{ Name: "InstanceId", Value: EC2_INSTANCE_ID }],
              },
              Period: 300,
              Stat: "Average",
            },
          },
        ],
        StartTime: startTime,
        EndTime: endTime,
        ScanBy: "TimestampAscending",
      })
    );

    const cpuResult = response.MetricDataResults?.find((r) => r.Id === "cpu");
    const memResult = response.MetricDataResults?.find((r) => r.Id === "mem");

    const timestamps = cpuResult?.Timestamps || [];
    return timestamps.map((ts, idx) => ({
      timestamp: ts,
      cpu: cpuResult?.Values?.[idx] ?? 0,
      memory: memResult?.Values?.[idx] ?? 0,
    }));
  } catch {
    return [];
  }
}

// ─── S3 Bucket Metrics ────────────────────────────────────────────────────────

export async function getS3Metrics(): Promise<S3Metrics> {
  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - 2 * 24 * 60 * 60 * 1000); // S3 metrics update daily

  try {
    const response = await cwClient.send(
      new GetMetricDataCommand({
        MetricDataQueries: [
          {
            Id: "bucketSize",
            MetricStat: {
              Metric: {
                Namespace: "AWS/S3",
                MetricName: "BucketSizeBytes",
                Dimensions: [
                  { Name: "BucketName", Value: S3_BUCKET },
                  { Name: "StorageType", Value: "StandardStorage" },
                ],
              },
              Period: 86400, // Daily
              Stat: "Average",
            },
          },
          {
            Id: "objectCount",
            MetricStat: {
              Metric: {
                Namespace: "AWS/S3",
                MetricName: "NumberOfObjects",
                Dimensions: [
                  { Name: "BucketName", Value: S3_BUCKET },
                  { Name: "StorageType", Value: "AllStorageTypes" },
                ],
              },
              Period: 86400,
              Stat: "Average",
            },
          },
        ],
        StartTime: startTime,
        EndTime: endTime,
      })
    );

    const getLatest = (id: string): number => {
      const result = response.MetricDataResults?.find((r) => r.Id === id);
      const values = result?.Values;
      return values && values.length > 0 ? values[0] : 0;
    };

    return {
      bucketSizeBytes: getLatest("bucketSize"),
      numberOfObjects: Math.round(getLatest("objectCount")),
      fivexxErrors: 0,
      headBucketLatencyMs: 0,
      timestamp: new Date(),
    };
  } catch {
    return {
      bucketSizeBytes: 0,
      numberOfObjects: 0,
      fivexxErrors: 0,
      headBucketLatencyMs: 0,
      timestamp: new Date(),
    };
  }
}

// ─── CloudWatch Alarms ────────────────────────────────────────────────────────

export async function getCloudWatchAlarms(): Promise<CloudWatchAlarmState[]> {
  try {
    const response = await cwClient.send(
      new DescribeAlarmsCommand({
        AlarmNamePrefix: "resumebuddy",
        MaxRecords: 50,
      })
    );

    return (response.MetricAlarms || []).map((alarm) => ({
      alarmName: alarm.AlarmName || "unknown",
      alarmArn: alarm.AlarmArn || "",
      stateValue: (alarm.StateValue as "OK" | "ALARM" | "INSUFFICIENT_DATA") || "INSUFFICIENT_DATA",
      stateReason: alarm.StateReason || "",
      stateUpdatedTimestamp: alarm.StateUpdatedTimestamp || new Date(),
      metricName: alarm.MetricName || "",
    }));
  } catch {
    return [];
  }
}
