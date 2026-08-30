"use client";

// =============================================================================
// Resume Buddy Monitor v2 — RBAC Permission Matrix
// =============================================================================

import React from "react";
import { KeyRound, Check, X, Shield } from "lucide-react";
import { ROLE_PERMISSIONS, type Permission, type UserRole } from "@/types/rbac";

const ALL_PERMISSIONS: { key: Permission; label: string; desc: string }[] = [
  { key: "metrics:read", label: "View Live Telemetry & Metrics", desc: "Access to Mission Control, EC2, DB, Redis metrics" },
  { key: "logs:read", label: "Query CloudWatch & Edge Logs", desc: "Execute CloudWatch Logs Insights and browse edge traces" },
  { key: "incidents:read", label: "View Active & Past Incidents", desc: "Access incident desk and post-mortem documents" },
  { key: "incidents:write", label: "Declare & Triage Incidents", desc: "Create new incidents, change severity, and assign leads" },
  { key: "incidents:resolve", label: "Mark Incident Resolved", desc: "Close incidents, publish post-mortems, reset alert states" },
  { key: "alerts:read", label: "View Live Alerts Feed", desc: "Inspect active alerts and CloudWatch alarms" },
  { key: "alerts:acknowledge", label: "Acknowledge Alerts", desc: "Silence alerts and disable repetitive SMS notifications" },
  { key: "workers:trigger", label: "Trigger Autonomous Workers", desc: "Execute ad-hoc out-of-band probe cycles on demand" },
  { key: "flags:write", label: "Toggle Feature Flags", desc: "Enable or disable global platform feature flags & percentages" },
  { key: "apikeys:write", label: "Issue & Revoke API Keys", desc: "Create programmatic credentials with granular scopes" },
  { key: "settings:write", label: "Modify Platform Settings", desc: "Update worker intervals, notification endpoints, thresholds" },
  { key: "audit:read", label: "Inspect SRE Audit Logs", desc: "View full immutable audit trail of operator actions" },
];

export default function RBACPage() {
  const roles: UserRole[] = ["SUPER_ADMIN", "SRE_OPERATOR", "READ_ONLY"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <KeyRound className="text-purple-400" size={20} />
          Role-Based Access Control (RBAC) Matrix
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Explicit permissions breakdown across administrative security tiers
        </p>
      </div>

      <div className="bg-[#0b0f19] border border-[#1a2540] rounded-xl overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#1a2540] text-slate-500 font-semibold uppercase text-[10px] tracking-wider bg-[#070b14]">
              <th className="p-3.5">Permission / Action</th>
              {roles.map((r) => (
                <th key={r} className="p-3.5 text-center font-mono">
                  {r}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1a2540]">
            {ALL_PERMISSIONS.map((perm) => (
              <tr key={perm.key} className="hover:bg-[#070b14] transition-colors">
                <td className="p-3.5">
                  <div className="font-semibold text-white">{perm.label}</div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    {perm.key} · {perm.desc}
                  </div>
                </td>
                {roles.map((role) => {
                  const has = ROLE_PERMISSIONS[role].includes(perm.key);
                  return (
                    <td key={role} className="p-3.5 text-center">
                      {has ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                          <Check size={13} />
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-slate-900 text-slate-600">
                          <X size={13} />
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
