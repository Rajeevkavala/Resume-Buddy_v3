"use client";

// =============================================================================
// Resume Buddy Monitor v2 — Mission Control Top Header
// =============================================================================

import React, { useState, useEffect } from "react";
import {
  Search,
  RefreshCw,
  ShieldCheck,
  Zap,
  Clock,
  Radio,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface HeaderProps {
  onOpenCommandMenu?: () => void;
}

export function Header({ onOpenCommandMenu }: HeaderProps) {
  const [timeStr, setTimeStr] = useState<string>("");
  const [isTriggering, setIsTriggering] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString("en-IN", {
          timeZone: "Asia/Kolkata",
          hour12: false,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleTriggerProbes = async () => {
    setIsTriggering(true);
    toast.info("Triggering autonomous worker probe cycle...");
    try {
      const res = await fetch("/api/v1/monitor/trigger-worker", {
        method: "POST",
      });
      if (res.ok) {
        toast.success("Monitoring probe cycle completed. State updated.");
        await queryClient.invalidateQueries({ queryKey: ["monitor-summary"] });
      } else {
        toast.error("Probe cycle failed.");
      }
    } catch {
      toast.error("Network error triggering workers.");
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <header className="h-14 bg-[#070b14]/90 backdrop-blur border-b border-[#1a2540] px-6 flex items-center justify-between flex-shrink-0 z-20">
      {/* Left: Quick Search Button / Cmd+K */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenCommandMenu}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700/60 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-all text-xs w-64 justify-between"
        >
          <span className="flex items-center gap-2">
            <Search size={13} className="text-slate-500" />
            <span>Search telemetry or goto...</span>
          </span>
          <kbd className="font-mono text-[10px] bg-slate-800 border border-slate-700 px-1.5 py-0.2 rounded text-slate-300">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Center: System Clock & Region */}
      <div className="hidden md:flex items-center gap-4 text-xs font-mono text-slate-400">
        <div className="flex items-center gap-1.5 bg-slate-900/60 px-2.5 py-1 rounded border border-slate-800">
          <Clock size={12} className="text-slate-500" />
          <span>{timeStr || "12:00:00"} IST</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-500">ap-south-1 (Mumbai)</span>
        </div>
      </div>

      {/* Right: Actions & Operator Identity */}
      <div className="flex items-center gap-3">
        {/* Trigger Probes Button */}
        <button
          onClick={handleTriggerProbes}
          disabled={isTriggering}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-emerald-500/50 text-slate-300 hover:text-emerald-400 transition-all text-xs font-medium disabled:opacity-50"
          title="Trigger out-of-band worker cycle immediately"
        >
          <RefreshCw
            size={12}
            className={isTriggering ? "animate-spin text-emerald-400" : ""}
          />
          <span>{isTriggering ? "Probing..." : "Trigger Probes"}</span>
        </button>

        {/* Live Pulse */}
        <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono bg-emerald-950/40 border border-emerald-800/40 px-2 py-1 rounded">
          <Radio size={12} className="animate-pulse text-emerald-400" />
          <span className="text-[11px] font-semibold">LIVE</span>
        </div>

        {/* Operator Badge */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 text-xs font-bold">
            SRE
          </div>
          <div className="hidden lg:block text-left">
            <div className="text-[11px] font-semibold text-slate-200 leading-tight">
              SRE Admin
            </div>
            <div className="text-[9px] font-mono text-emerald-400 leading-tight">
              SUPER_ADMIN
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
