import {
  CloudWatchLogsClient,
  StartQueryCommand,
  GetQueryResultsCommand,
  DescribeLogGroupsCommand,
  FilterLogEventsCommand,
} from "@aws-sdk/client-cloudwatch-logs";

// ─── CloudWatch Logs Client ───────────────────────────────────────────────────

const cwLogsClient = new CloudWatchLogsClient({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// ─── Log Group Constants ──────────────────────────────────────────────────────

export const LOG_GROUPS = {
  latex: "/aws/ec2/resumebuddy/latex-service",
  websocket: "/aws/ec2/resumebuddy/websocket-service",
  nginxAccess: "/aws/ec2/resumebuddy/nginx/access",
  nginxError: "/aws/ec2/resumebuddy/nginx/error",
} as const;

// ─── Run Logs Insights Query ──────────────────────────────────────────────────

export async function runLogsInsightsQuery(
  logGroupNames: string[],
  queryString: string,
  startMinutesAgo = 60
): Promise<Array<{ timestamp: string; message: string; level: string }>> {
  const endTime = Math.floor(Date.now() / 1000);
  const startTime = endTime - startMinutesAgo * 60;

  try {
    // Start the query
    const startResponse = await cwLogsClient.send(
      new StartQueryCommand({
        logGroupNames,
        startTime,
        endTime,
        queryString,
        limit: 100,
      })
    );

    const queryId = startResponse.queryId;
    if (!queryId) return [];

    // Poll for results (max 10 attempts)
    for (let i = 0; i < 10; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      const resultsResponse = await cwLogsClient.send(
        new GetQueryResultsCommand({ queryId })
      );

      if (
        resultsResponse.status === "Complete" ||
        resultsResponse.status === "Failed"
      ) {
        if (!resultsResponse.results) return [];

        return resultsResponse.results.map((row) => {
          const getField = (name: string) =>
            row.find((f) => f.field === name)?.value || "";

          const msg = getField("@message");
          const level = msg.includes("ERROR")
            ? "ERROR"
            : msg.includes("WARN")
            ? "WARN"
            : "INFO";

          return {
            timestamp: getField("@timestamp"),
            message: msg,
            level,
          };
        });
      }
    }

    return [];
  } catch (error: any) {
    if (error?.name !== "ResourceNotFoundException") {
      console.warn("[CloudWatch Logs] Query failed:", error?.message || error);
    }
    return [];
  }
}

// ─── Get Recent Errors & Warnings ─────────────────────────────────────────────

export async function getRecentErrors(minutesAgo = 60) {
  return runLogsInsightsQuery(
    [LOG_GROUPS.latex, LOG_GROUPS.websocket],
    `fields @timestamp, @message, @logStream
     | filter @message like /(ERROR|WARN|exception|timeout|failed)/
     | sort @timestamp desc
     | limit 50`,
    minutesAgo
  );
}

// ─── Get LaTeX Compile Stats ──────────────────────────────────────────────────

export async function getLatexCompileStats(minutesAgo = 60) {
  return runLogsInsightsQuery(
    [LOG_GROUPS.latex],
    `fields @timestamp, @message
     | filter @message like /compiled|compile|Tectonic/
     | sort @timestamp desc
     | limit 100`,
    minutesAgo
  );
}

// ─── Get Recent Log Events (for real-time viewer) ─────────────────────────────

export async function getRecentLogEvents(
  logGroupName: string,
  minutesAgo = 15,
  filterPattern?: string
): Promise<Array<{ timestamp: number; message: string; logStreamName: string }>> {
  const startTime = Date.now() - minutesAgo * 60 * 1000;

  try {
    const response = await cwLogsClient.send(
      new FilterLogEventsCommand({
        logGroupName,
        startTime,
        filterPattern,
        limit: 100,
      })
    );

    return (response.events || []).map((e) => ({
      timestamp: e.timestamp || 0,
      message: e.message || "",
      logStreamName: e.logStreamName || "",
    }));
  } catch {
    return [];
  }
}

// ─── List Available Log Groups ────────────────────────────────────────────────

export async function listResumeBuddyLogGroups() {
  try {
    const response = await cwLogsClient.send(
      new DescribeLogGroupsCommand({
        logGroupNamePrefix: "/aws/ec2/resumebuddy",
      })
    );
    return response.logGroups || [];
  } catch {
    return [];
  }
}
