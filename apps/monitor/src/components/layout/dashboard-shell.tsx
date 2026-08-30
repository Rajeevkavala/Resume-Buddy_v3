"use client";

// =============================================================================
// Resume Buddy Monitor v2 — Dashboard Shell (Sidebar + Header + CommandMenu)
// =============================================================================

import React, { useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { CommandMenu } from "./command-menu";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [commandMenuOpen, setCommandMenuOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#030712] text-slate-200">
      {/* 21-Item Enterprise Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header onOpenCommandMenu={() => setCommandMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-800">
          <div className="max-w-7xl mx-auto space-y-6 pb-12">{children}</div>
        </main>
      </div>

      {/* Global Cmd+K Command Palette */}
      <CommandMenu
        open={commandMenuOpen}
        onOpenChange={setCommandMenuOpen}
      />
    </div>
  );
}
