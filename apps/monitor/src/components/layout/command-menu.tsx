"use client";

// =============================================================================
// Resume Buddy Monitor v2 — Keyboard Command Palette (Cmd+K)
// =============================================================================

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  LayoutDashboard,
  AlertOctagon,
  Bell,
  Cpu,
  Globe,
  Server,
  Database,
  Layers,
  HardDrive,
  Bot,
  CreditCard,
  Mail,
  GitBranch,
  FlaskConical,
  ScrollText,
  ShieldAlert,
  Users,
  KeyRound,
  Sliders,
  Key,
  Flag,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

interface CommandMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandMenu({ open, onOpenChange }: CommandMenuProps) {
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const handleNavigate = (path: string) => {
    onOpenChange(false);
    router.push(path);
  };

  const handleTriggerProbes = async () => {
    onOpenChange(false);
    toast.info("Triggering worker batch...");
    try {
      const res = await fetch("/api/v1/monitor/trigger-worker", {
        method: "POST",
      });
      if (res.ok) {
        toast.success("Probe cycle completed.");
      }
    } catch {
      toast.error("Failed to trigger workers.");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-20 p-4">
      <div
        className="w-full max-w-xl bg-[#0b0f19] border border-[#1a2540] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <Command label="Command Menu" className="w-full">
          <div className="flex items-center border-b border-[#1a2540] px-3">
            <Command.Input
              placeholder="Type a command or jump to page..."
              className="w-full bg-transparent py-3 px-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
              autoFocus
            />
          </div>

          <Command.List className="max-h-80 overflow-y-auto p-2 space-y-1 text-xs scrollbar-thin scrollbar-thumb-slate-800">
            <Command.Empty className="py-6 text-center text-slate-500 text-xs">
              No matching pages or actions found.
            </Command.Empty>

            {/* Quick Actions */}
            <Command.Group
              heading="Quick Actions"
              className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-2 py-1"
            >
              <Command.Item
                onSelect={handleTriggerProbes}
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 cursor-pointer"
              >
                <RefreshCw size={13} className="text-emerald-400" />
                <span>Trigger Autonomous Worker Probes</span>
              </Command.Item>
            </Command.Group>

            {/* Pages Navigation */}
            <Command.Group
              heading="Navigation"
              className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-2 py-1"
            >
              <Command.Item
                onSelect={() => handleNavigate("/overview")}
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 cursor-pointer"
              >
                <LayoutDashboard size={13} className="text-slate-400" />
                <span>Mission Control</span>
              </Command.Item>
              <Command.Item
                onSelect={() => handleNavigate("/incidents")}
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 cursor-pointer"
              >
                <AlertOctagon size={13} className="text-rose-400" />
                <span>Incidents Desk</span>
              </Command.Item>
              <Command.Item
                onSelect={() => handleNavigate("/alerts")}
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 cursor-pointer"
              >
                <Bell size={13} className="text-amber-400" />
                <span>Alerts Feed</span>
              </Command.Item>
              <Command.Item
                onSelect={() => handleNavigate("/infrastructure")}
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 cursor-pointer"
              >
                <Cpu size={13} className="text-blue-400" />
                <span>AWS EC2 & CloudWatch</span>
              </Command.Item>
              <Command.Item
                onSelect={() => handleNavigate("/frontend")}
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 cursor-pointer"
              >
                <Globe size={13} className="text-emerald-400" />
                <span>Frontend & Vercel Edge</span>
              </Command.Item>
              <Command.Item
                onSelect={() => handleNavigate("/backend")}
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 cursor-pointer"
              >
                <Server size={13} className="text-purple-400" />
                <span>Backend & LaTeX Service</span>
              </Command.Item>
              <Command.Item
                onSelect={() => handleNavigate("/database")}
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 cursor-pointer"
              >
                <Database size={13} className="text-cyan-400" />
                <span>Supabase PostgreSQL</span>
              </Command.Item>
              <Command.Item
                onSelect={() => handleNavigate("/redis")}
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 cursor-pointer"
              >
                <Layers size={13} className="text-rose-400" />
                <span>Upstash Redis</span>
              </Command.Item>
              <Command.Item
                onSelect={() => handleNavigate("/ai-providers")}
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 cursor-pointer"
              >
                <Bot size={13} className="text-indigo-400" />
                <span>AI Providers (Groq / Gemini)</span>
              </Command.Item>
              <Command.Item
                onSelect={() => handleNavigate("/synthetics")}
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 cursor-pointer"
              >
                <FlaskConical size={13} className="text-amber-400" />
                <span>Synthetic Tests</span>
              </Command.Item>
              <Command.Item
                onSelect={() => handleNavigate("/feature-flags")}
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 cursor-pointer"
              >
                <Flag size={13} className="text-pink-400" />
                <span>Feature Flags</span>
              </Command.Item>
              <Command.Item
                onSelect={() => handleNavigate("/api-keys")}
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 cursor-pointer"
              >
                <Key size={13} className="text-yellow-400" />
                <span>API Keys</span>
              </Command.Item>
            </Command.Group>
          </Command.List>

          <div className="border-t border-[#1a2540] px-3 py-2 text-[10px] text-slate-500 flex items-center justify-between bg-[#070b14]">
            <span>Navigate with arrow keys</span>
            <span>Press ESC to exit</span>
          </div>
        </Command>
      </div>
    </div>
  );
}
