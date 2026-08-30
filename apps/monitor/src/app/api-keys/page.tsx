"use client";

// =============================================================================
// Resume Buddy Monitor v2 — API Key Management
// =============================================================================

import React, { useState } from "react";
import { Key, Plus, Copy, Check, Trash2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface ApiKeyItem {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  lastUsedAt?: string;
  createdAt: string;
}

const SAMPLE_KEYS: ApiKeyItem[] = [
  {
    id: "key_1",
    name: "GitHub Actions Deploy Hook",
    prefix: "rbm_live_9a8b7c...",
    scopes: ["write:incidents", "trigger:workers"],
    lastUsedAt: new Date(Date.now() - 7200000).toISOString(),
    createdAt: "2026-02-10T10:00:00.000Z",
  },
  {
    id: "key_2",
    name: "Better Stack External Uptime Probe",
    prefix: "rbm_live_3f4e5d...",
    scopes: ["read:metrics"],
    lastUsedAt: new Date(Date.now() - 300000).toISOString(),
    createdAt: "2026-01-20T15:30:00.000Z",
  },
];

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyItem[]>(SAMPLE_KEYS);

  const handleCopy = (prefix: string) => {
    navigator.clipboard.writeText(prefix);
    toast.success("Key prefix copied to clipboard");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Key className="text-yellow-400" size={20} />
            Programmatic API Keys
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage scoped authentication tokens for CI/CD pipelines and external monitoring bots
          </p>
        </div>

        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-600 hover:bg-yellow-500 text-black text-xs font-semibold shadow-lg shadow-yellow-950/40 transition-all">
          <Plus size={14} />
          <span>Generate API Key</span>
        </button>
      </div>

      <div className="bg-[#0b0f19] border border-[#1a2540] rounded-xl overflow-hidden divide-y divide-[#1a2540]">
        {keys.map((k) => (
          <div
            key={k.id}
            className="p-4 hover:bg-[#070b14] transition-colors flex items-center justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">{k.name}</span>
                <span className="text-[11px] font-mono text-slate-400 bg-slate-900 border border-slate-700 px-2 py-0.5 rounded flex items-center gap-1.5">
                  {k.prefix}
                  <button
                    onClick={() => handleCopy(k.prefix)}
                    className="hover:text-white"
                  >
                    <Copy size={11} />
                  </button>
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                {k.scopes.map((s) => (
                  <span
                    key={s}
                    className="text-[10px] font-mono bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded"
                  >
                    {s}
                  </span>
                ))}
              </div>
              <div className="text-[10px] font-mono text-slate-500 mt-1">
                Last used: {new Date(k.lastUsedAt || k.createdAt).toLocaleString()}
              </div>
            </div>

            <button className="p-2 rounded-lg bg-slate-800/80 hover:bg-rose-950/80 text-slate-400 hover:text-rose-400 transition-colors">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
