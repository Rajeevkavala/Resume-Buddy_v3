"use client";

// =============================================================================
// Resume Buddy Monitor v2 — SRE & Operator User Directory
// =============================================================================

import React, { useState } from "react";
import { Users, Shield, Plus, Mail, CheckCircle2 } from "lucide-react";
import type { MonitorUser } from "@/types/rbac";

const SAMPLE_USERS: MonitorUser[] = [
  {
    id: "usr_admin_1",
    email: "raj@resume-buddy.tech",
    name: "Rajeev (Principal SRE)",
    role: "SUPER_ADMIN",
    lastActiveAt: new Date().toISOString(),
    createdAt: "2026-01-15T10:00:00.000Z",
  },
  {
    id: "usr_admin_2",
    email: "ops-bot@resume-buddy.tech",
    name: "Automated On-Call Bot",
    role: "SRE_OPERATOR",
    lastActiveAt: new Date(Date.now() - 3600000).toISOString(),
    createdAt: "2026-02-01T12:00:00.000Z",
  },
  {
    id: "usr_admin_3",
    email: "dev-team@resume-buddy.tech",
    name: "Engineering Read-Only",
    role: "READ_ONLY",
    lastActiveAt: new Date(Date.now() - 86400000).toISOString(),
    createdAt: "2026-03-10T14:30:00.000Z",
  },
];

export default function UsersPage() {
  const [users] = useState<MonitorUser[]>(SAMPLE_USERS);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Users className="text-emerald-400" size={20} />
            SRE & Operator Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage authenticated operators, on-call responders, and platform privileges
          </p>
        </div>

        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-950/40 transition-all">
          <Plus size={14} />
          <span>Invite Operator</span>
        </button>
      </div>

      <div className="bg-[#0b0f19] border border-[#1a2540] rounded-xl overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#1a2540] text-slate-500 font-semibold uppercase text-[10px] tracking-wider bg-[#070b14]">
              <th className="p-3.5">User</th>
              <th className="p-3.5">Email</th>
              <th className="p-3.5">Assigned Role</th>
              <th className="p-3.5">Last Active</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1a2540]">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-[#070b14] transition-colors">
                <td className="p-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300">
                      {u.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="font-semibold text-white">{u.name}</span>
                  </div>
                </td>
                <td className="p-3.5 text-slate-400 font-mono">{u.email}</td>
                <td className="p-3.5">
                  <span
                    className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                      u.role === "SUPER_ADMIN"
                        ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800/60"
                        : u.role === "SRE_OPERATOR"
                        ? "bg-blue-950/80 text-blue-400 border border-blue-800/60"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                  {new Date(u.lastActiveAt || u.createdAt).toLocaleString()}
                </td>
                <td className="p-3.5 text-right">
                  <button className="text-xs text-slate-400 hover:text-emerald-400 font-medium">
                    Edit Permissions
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
