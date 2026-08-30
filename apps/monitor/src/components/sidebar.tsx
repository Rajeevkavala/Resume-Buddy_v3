"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Server,
  Globe,
  Database,
  Layers,
  HardDrive,
  Brain,
  CreditCard,
  Bell,
  GitBranch,
  FlaskConical,
  ScrollText,
  AlertTriangle,
  BookOpen,
  Settings,
  ChevronRight,
  Cpu,
} from "lucide-react";

const NAV_SECTIONS = [
  {
    label: "OVERVIEW",
    items: [
      { href: "/overview", label: "Mission Control", icon: Activity },
      { href: "/incidents", label: "Incidents", icon: AlertTriangle },
      { href: "/alerts", label: "Alerts & Alarms", icon: Bell },
    ],
  },
  {
    label: "INFRASTRUCTURE",
    items: [
      { href: "/infrastructure", label: "AWS CloudWatch EC2", icon: Cpu },
      { href: "/frontend", label: "Vercel Edge & CDN", icon: Globe },
      { href: "/backend", label: "LaTeX & WebSocket", icon: Server },
    ],
  },
  {
    label: "DATA LAYER",
    items: [
      { href: "/database", label: "Supabase PostgreSQL", icon: Database },
      { href: "/redis", label: "Upstash Redis", icon: Layers },
      { href: "/storage", label: "AWS S3 Storage", icon: HardDrive },
    ],
  },
  {
    label: "AI & PAYMENTS",
    items: [
      { href: "/ai-providers", label: "AI Providers", icon: Brain },
      { href: "/payments", label: "Razorpay Payments", icon: CreditCard },
      { href: "/notifications", label: "Email & SMS", icon: Bell },
    ],
  },
  {
    label: "OPERATIONS",
    items: [
      { href: "/synthetics", label: "Synthetic Tests", icon: FlaskConical },
      { href: "/logs", label: "Log Explorer", icon: ScrollText },
      { href: "/deployments", label: "Deployments", icon: GitBranch },
      { href: "/audit-logs", label: "Audit Logs", icon: BookOpen },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#080e1d] border-r border-[#1a2540] flex flex-col z-50 overflow-hidden">
      {/* Logo */}
      <div className="p-5 border-b border-[#1a2540]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
            <Activity size={16} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-white leading-tight">
              Resume Buddy
            </div>
            <div className="text-[10px] text-emerald-400 font-medium tracking-wider uppercase">
              Monitor · SRE Platform
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-5">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <div className="px-3 mb-2 text-[10px] font-semibold text-slate-600 tracking-widest uppercase">
              {section.label}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/overview" &&
                    pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`sidebar-item ${isActive ? "active" : ""}`}
                  >
                    <Icon size={15} className="flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                    {isActive && (
                      <ChevronRight
                        size={13}
                        className="ml-auto text-emerald-500"
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[#1a2540]">
        <div className="flex items-center gap-2">
          <div className="status-dot-healthy flex-shrink-0" />
          <div className="text-[11px] text-slate-500 truncate">
            monitor.resume-buddy.tech
          </div>
        </div>
        <div className="text-[10px] text-slate-700 mt-1 pl-4">
          ap-south-1 · Mumbai
        </div>
      </div>
    </aside>
  );
}
