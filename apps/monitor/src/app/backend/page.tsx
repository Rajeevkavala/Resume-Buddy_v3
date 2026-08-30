import { runLatexProbe } from "@/lib/probes/latex.probe";
import { runWebSocketProbe } from "@/lib/probes/websocket.probe";
import { StatusBadge } from "@/components/status-badge";
import { Zap, Wifi, CheckCircle2, AlertTriangle } from "lucide-react";

export const revalidate = 15;

export default async function BackendPage() {
  const [latexResult, wsResult] = await Promise.allSettled([
    runLatexProbe(),
    runWebSocketProbe(),
  ]);

  const latex = latexResult.status === "fulfilled" ? latexResult.value : null;
  const ws = wsResult.status === "fulfilled" ? wsResult.value : null;
  const backendUrl = (process.env.PROBE_TARGET_BACKEND_URL || "https://api.resume-buddy.tech").replace(/\/$/, "");
  const backendHost = (() => {
    try {
      return new URL(backendUrl).hostname;
    } catch {
      return "api.resume-buddy.tech";
    }
  })();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Backend Services</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          LaTeX Microservice (Fastify + Tectonic) & WebSocket Gateway (Socket.io) · {backendHost}
        </p>
      </div>

      {/* LaTeX Service */}
      <div className="monitor-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-semibold text-white flex items-center gap-2">
              <Zap size={15} className="text-purple-400" />
              LaTeX Compilation Engine
            </div>
            <div className="text-[11px] text-slate-600 mt-0.5 font-mono">
              GET {backendUrl}/healthz
            </div>
          </div>
          {latex && <StatusBadge status={latex.status} size="md" />}
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="bg-[#0a0f1e] rounded-lg p-3 border border-[#1a2540]">
            <div className="text-[11px] text-slate-500">Probe Latency</div>
            <div className="text-xl font-bold text-white mt-1 tabular-nums">
              {latex ? `${latex.latencyMs.toFixed(0)} ms` : "—"}
            </div>
          </div>
          <div className="bg-[#0a0f1e] rounded-lg p-3 border border-[#1a2540]">
            <div className="text-[11px] text-slate-500">Compile Duration</div>
            <div className="text-xl font-bold text-white mt-1 tabular-nums">
              {(latex?.metadata as any)?.compileDurationMs != null
                ? `${(latex?.metadata as any).compileDurationMs.toFixed(1)} ms`
                : "—"}
            </div>
          </div>
          <div className="bg-[#0a0f1e] rounded-lg p-3 border border-[#1a2540]">
            <div className="text-[11px] text-slate-500">Service Uptime</div>
            <div className="text-xl font-bold text-white mt-1 tabular-nums">
              {(latex?.metadata as any)?.uptime != null
                ? `${((latex?.metadata as any).uptime / 3600).toFixed(1)} hrs`
                : "—"}
            </div>
          </div>
          <div className="bg-[#0a0f1e] rounded-lg p-3 border border-[#1a2540]">
            <div className="text-[11px] text-slate-500">HTTP Status</div>
            <div className="text-xl font-bold text-emerald-400 mt-1">
              {latex?.statusCode ?? latex?.status === "DOWN" ? "—" : "200"}
            </div>
          </div>
        </div>

        {latex?.errorMessage && (
          <div className="mt-3 flex items-start gap-2 text-xs text-red-400 bg-red-950/20 rounded-lg p-3">
            <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
            {latex.errorMessage}
          </div>
        )}
      </div>

      {/* WebSocket Gateway */}
      <div className="monitor-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-semibold text-white flex items-center gap-2">
              <Wifi size={15} className="text-cyan-400" />
              WebSocket Gateway (Socket.io)
            </div>
            <div className="text-[11px] text-slate-600 mt-0.5 font-mono">
              GET {backendUrl}/socket.io/?EIO=4&transport=polling
            </div>
          </div>
          {ws && <StatusBadge status={ws.status} size="md" />}
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="bg-[#0a0f1e] rounded-lg p-3 border border-[#1a2540]">
            <div className="text-[11px] text-slate-500">Handshake Latency</div>
            <div className="text-xl font-bold text-white mt-1 tabular-nums">
              {ws ? `${ws.latencyMs.toFixed(0)} ms` : "—"}
            </div>
          </div>
          <div className="bg-[#0a0f1e] rounded-lg p-3 border border-[#1a2540]">
            <div className="text-[11px] text-slate-500">Session ID</div>
            <div className="text-xl font-bold mt-1">
              {(ws?.metadata as any)?.handshakeOk ? (
                <span className="text-emerald-400">Issued</span>
              ) : (
                <span className="text-red-400">Failed</span>
              )}
            </div>
          </div>
          <div className="bg-[#0a0f1e] rounded-lg p-3 border border-[#1a2540]">
            <div className="text-[11px] text-slate-500">Transport</div>
            <div className="text-sm font-bold text-white mt-1">polling → ws</div>
          </div>
          <div className="bg-[#0a0f1e] rounded-lg p-3 border border-[#1a2540]">
            <div className="text-[11px] text-slate-500">Namespace</div>
            <div className="text-sm font-mono font-bold text-slate-300 mt-1">/</div>
          </div>
        </div>

        {ws?.errorMessage && (
          <div className="mt-3 flex items-start gap-2 text-xs text-red-400 bg-red-950/20 rounded-lg p-3">
            <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
            {ws.errorMessage}
          </div>
        )}
      </div>

      {/* EC2 Service Architecture */}
      <div className="monitor-card">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
          AWS EC2 Service Architecture
        </div>
        <div className="grid grid-cols-3 gap-3 text-xs">
          {[
            { name: "Nginx Reverse Proxy", port: ":443/:80", note: "SSL termination" },
            { name: "LaTeX Service (Fastify)", port: ":8080", note: "Tectonic PDF compiler" },
            { name: "WebSocket Server (Socket.io)", port: ":3001", note: "Real-time collaboration" },
          ].map((svc) => (
            <div key={svc.name} className="bg-[#0a0f1e] rounded-lg p-3 border border-[#1a2540]">
              <div className="flex items-center gap-1.5 mb-1">
                <CheckCircle2 size={11} className="text-emerald-400" />
                <span className="font-semibold text-slate-300">{svc.name}</span>
              </div>
              <div className="text-slate-600 font-mono">{svc.port}</div>
              <div className="text-slate-600 mt-0.5">{svc.note}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
