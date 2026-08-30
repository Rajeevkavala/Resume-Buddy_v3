import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const VERCEL_TOKEN = process.env.VERCEL_TOKEN || "";

function buildVercelCmd(subcommand: string): string {
  return `npx vercel ${subcommand} --token=${VERCEL_TOKEN} --yes`;
}

// ─── Vercel Status ────────────────────────────────────────────────────────────

export async function vercelStatus(): Promise<{
  output: string;
  success: boolean;
}> {
  if (!VERCEL_TOKEN) {
    return { output: "VERCEL_TOKEN not configured", success: false };
  }

  try {
    const { stdout, stderr } = await execAsync(buildVercelCmd("status"), {
      timeout: 30000,
      env: { ...process.env, VERCEL_TOKEN },
    });
    return { output: stdout || stderr, success: true };
  } catch (error) {
    return {
      output: error instanceof Error ? error.message : "Command failed",
      success: false,
    };
  }
}

// ─── Inspect Deployment ───────────────────────────────────────────────────────

export async function vercelInspect(
  deploymentUrlOrId: string
): Promise<{ output: string; success: boolean }> {
  if (!VERCEL_TOKEN) {
    return { output: "VERCEL_TOKEN not configured", success: false };
  }

  try {
    const { stdout, stderr } = await execAsync(
      buildVercelCmd(`inspect ${deploymentUrlOrId}`),
      { timeout: 30000 }
    );
    return { output: stdout || stderr, success: true };
  } catch (error) {
    return {
      output: error instanceof Error ? error.message : "Inspect failed",
      success: false,
    };
  }
}

// ─── Fetch Recent Edge Logs ───────────────────────────────────────────────────

export async function vercelLogs(
  projectUrl: string,
  lines = 100
): Promise<{ output: string; lines: string[]; success: boolean }> {
  if (!VERCEL_TOKEN) {
    return { output: "VERCEL_TOKEN not configured", lines: [], success: false };
  }

  try {
    const domain = projectUrl.replace(/^https?:\/\//, "");
    const { stdout } = await execAsync(
      buildVercelCmd(`logs ${domain} -n ${lines}`),
      { timeout: 20000 }
    );
    const lines_arr = stdout.split("\n").filter(Boolean);
    return { output: stdout, lines: lines_arr, success: true };
  } catch (error) {
    return {
      output: error instanceof Error ? error.message : "Log fetch failed",
      lines: [],
      success: false,
    };
  }
}

// ─── Rollback Deployment ──────────────────────────────────────────────────────

export async function vercelRollback(
  deploymentId: string
): Promise<{ output: string; success: boolean }> {
  if (!VERCEL_TOKEN) {
    return { output: "VERCEL_TOKEN not configured", success: false };
  }

  try {
    const { stdout, stderr } = await execAsync(
      buildVercelCmd(`rollback ${deploymentId}`),
      { timeout: 60000 }
    );
    return { output: stdout || stderr, success: true };
  } catch (error) {
    return {
      output: error instanceof Error ? error.message : "Rollback failed",
      success: false,
    };
  }
}

// ─── List Environment Variables (drift detection) ─────────────────────────────

export async function vercelEnvList(): Promise<{
  output: string;
  success: boolean;
}> {
  if (!VERCEL_TOKEN) {
    return { output: "VERCEL_TOKEN not configured", success: false };
  }

  try {
    const { stdout } = await execAsync(buildVercelCmd("env ls"), {
      timeout: 15000,
    });
    return { output: stdout, success: true };
  } catch (error) {
    return {
      output: error instanceof Error ? error.message : "Env list failed",
      success: false,
    };
  }
}
