"use client";

import { useEffect, useState } from "react";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";

export function Header() {
  const [time, setTime] = useState<string>("");
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
          timeZone: "Asia/Kolkata",
        })
      );
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-14 bg-[#080e1d] border-b border-[#1a2540] flex items-center px-6 gap-4 sticky top-0 z-40">
      {/* Live Stream Indicator */}
      <div className="flex items-center gap-2">
        {isLive ? (
          <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
            <span className="status-dot-healthy" style={{ width: 8, height: 8 }} />
            LIVE STREAM
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-slate-500 text-xs">
            <WifiOff size={12} />
            DISCONNECTED
          </span>
        )}
      </div>

      {/* Region Badge */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#0d1526] border border-[#1a2540] rounded-full text-[11px] text-slate-500">
        <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
        ap-south-1 (Mumbai)
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Clock */}
      <div className="text-[13px] font-mono text-slate-400 tabular-nums">
        {time} IST
      </div>

      {/* Admin */}
      <div className="flex items-center gap-2 pl-4 border-l border-[#1a2540]">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-[11px] font-bold text-white">
          A
        </div>
        <div className="text-[12px] text-slate-400">Admin</div>
      </div>

      {/* Refresh indicator */}
      <button
        onClick={() => window.location.reload()}
        className="p-1.5 rounded-lg hover:bg-[#1a2540] text-slate-500 hover:text-slate-300 transition-colors"
        title="Refresh dashboard"
      >
        <RefreshCw size={14} />
      </button>
    </header>
  );
}
