import { runS3Probe } from "@/lib/probes/s3.probe";
import { getS3Metrics } from "@/lib/aws/cloudwatch";
import { StatusBadge } from "@/components/status-badge";
import { HardDrive, CheckCircle2, AlertTriangle } from "lucide-react";

export const revalidate = 60;

export default async function StoragePage() {
  const [probeResult, metricsResult] = await Promise.allSettled([
    runS3Probe(),
    getS3Metrics(),
  ]);

  const probe = probeResult.status === "fulfilled" ? probeResult.value : null;
  const metrics = metricsResult.status === "fulfilled" ? metricsResult.value : null;

  const sizeGB = metrics ? (metrics.bucketSizeBytes / 1e9).toFixed(2) : null;
  const bucketName = process.env.AWS_S3_BUCKET || "resumebuddy-storage";
  const region = process.env.AWS_REGION || "ap-south-1";
  const s3Endpoint = `s3.${region}.amazonaws.com`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Storage — AWS S3</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Bucket: {bucketName} · {region}
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="monitor-card">
          <div className="text-xs text-slate-500 mb-2">Storage Size</div>
          <div className="text-3xl font-bold text-white tabular-nums">{sizeGB ? `${sizeGB} GB` : "—"}</div>
          <div className="text-[11px] text-slate-600 mt-1">Standard Storage</div>
        </div>
        <div className="monitor-card">
          <div className="text-xs text-slate-500 mb-2">Object Count</div>
          <div className="text-3xl font-bold text-white tabular-nums">
            {metrics?.numberOfObjects?.toLocaleString() ?? "—"}
          </div>
          <div className="text-[11px] text-slate-600 mt-1">Resume PDFs</div>
        </div>
        <div className="monitor-card">
          <div className="text-xs text-slate-500 mb-2">HeadBucket Latency</div>
          <div className={`text-3xl font-bold tabular-nums ${(probe?.metadata as any)?.headBucketLatencyMs > 1500 ? "text-amber-400" : "text-emerald-400"}`}>
            {(probe?.metadata as any)?.headBucketLatencyMs != null ? `${(probe?.metadata as any).headBucketLatencyMs}ms` : "—"}
          </div>
        </div>
        <div className="monitor-card">
          <div className="text-xs text-slate-500 mb-2">5xx Error Rate</div>
          <div className="text-3xl font-bold text-emerald-400 tabular-nums">
            {metrics?.fivexxErrors !== undefined ? `${metrics.fivexxErrors.toFixed(2)}%` : "—"}
          </div>
          {probe && <div className="mt-2"><StatusBadge status={probe.status} /></div>}
        </div>
      </div>

      {/* Write/Read Test */}
      <div className="monitor-card">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Object Lifecycle Probe (PutObject → DeleteObject)
        </div>
        <div className="flex items-center gap-3">
          {(probe?.metadata as any)?.writeReadDeleteOk ? (
            <div className="flex items-center gap-2 text-emerald-400 text-sm">
              <CheckCircle2 size={16} />
              Write + Delete roundtrip PASS — Bucket accessible and writable
            </div>
          ) : (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertTriangle size={16} />
              Write/Delete probe FAILED — {probe?.errorMessage}
            </div>
          )}
        </div>
      </div>

      {/* Bucket Info */}
      <div className="monitor-card">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Bucket Configuration
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-[#0a0f1e] rounded-lg p-3 border border-[#1a2540]">
            <div className="text-slate-500 mb-1">Bucket Name</div>
            <div className="font-mono text-slate-300">{bucketName}</div>
          </div>
          <div className="bg-[#0a0f1e] rounded-lg p-3 border border-[#1a2540]">
            <div className="text-slate-500 mb-1">Region</div>
            <div className="font-mono text-slate-300">{region} (Mumbai)</div>
          </div>
          <div className="bg-[#0a0f1e] rounded-lg p-3 border border-[#1a2540]">
            <div className="text-slate-500 mb-1">S3 Endpoint</div>
            <div className="font-mono text-slate-300">{s3Endpoint}</div>
          </div>
          <div className="bg-[#0a0f1e] rounded-lg p-3 border border-[#1a2540]">
            <div className="text-slate-500 mb-1">Auth</div>
            <div className="font-mono text-slate-300">SigV4 (IAM Credentials)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
