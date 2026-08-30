"use client";

// =============================================================================
// Resume Buddy Monitor v2 — High-Density Enterprise Sidebar (21 Sections)
// =============================================================================

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Activity,
} from "lucide-react";
import clsx from "clsx";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string | number;
  badgeVariant?: "red" | "amber" | "blue" | "emerald";
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      { name: "Mission Control", href: "/overview", icon: LayoutDashboard },
      { name: "Incidents", href: "/incidents", icon: AlertOctagon },
      { name: "Alerts", href: "/alerts", icon: Bell },
    ],
  },
  {
    label: "Infrastructure",
    items: [
      { name: "Infrastructure", href: "/infrastructure", icon: Cpu },
      { name: "Frontend", href: "/frontend", icon: Globe },
      { name: "Backend", href: "/backend", icon: Server },
      { name: "Database", href: "/database", icon: Database },
      { name: "Redis", href: "/redis", icon: Layers },
      { name: "Storage", href: "/storage", icon: HardDrive },
    ],
  },
  {
    label: "Services & Integrations",
    items: [
      { name: "AI Providers", href: "/ai-providers", icon: Bot },
      { name: "Payments", href: "/payments", icon: CreditCard },
      { name: "Notifications", href: "/notifications", icon: Mail },
      { name: "Deployments", href: "/deployments", icon: GitBranch },
      { name: "Synthetic Tests", href: "/synthetics", icon: FlaskConical },
    ],
  },
  {
    label: "Logs & Audit",
    items: [
      { name: "CloudWatch Logs", href: "/logs", icon: ScrollText },
      { name: "Audit Logs", href: "/audit-logs", icon: ShieldAlert },
    ],
  },
  {
    label: "Administration",
    items: [
      { name: "Users", href: "/users", icon: Users },
      { name: "RBAC", href: "/rbac", icon: KeyRound },
      { name: "Platform Settings", href: "/settings", icon: Sliders },
      { name: "API Keys", href: "/api-keys", icon: Key },
      { name: "Feature Flags", href: "/feature-flags", icon: Flag },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-64 h-screen bg-[#070b14] border-r border-[#1a2540] flex-col flex-shrink-0 select-none">
      {/* Brand Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-[#1a2540]">
        <Link href="/overview" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
            <Activity size={15} />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-100 tracking-wide">
              RESUME BUDDY
            </div>
            <div className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">
              MONITOR v2.0
            </div>
          </div>
        </Link>
        <span className="text-[10px] font-mono bg-slate-800/80 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
          PROD
        </span>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
        {NAV_GROUPS.map((group, gIdx) => (
          <div key={gIdx} className="space-y-0.5">
            {group.label && (
              <div className="px-2.5 pt-1.5 pb-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                {group.label}
              </div>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/overview" && pathname?.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-all duration-150 group",
                    isActive
                      ? "bg-slate-800/90 text-white font-medium border border-slate-700/60 shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      size={14}
                      className={clsx(
                        "flex-shrink-0 transition-colors",
                        isActive
                          ? "text-emerald-400"
                          : "text-slate-500 group-hover:text-slate-300"
                      )}
                    />
                    <span className="truncate">{item.name}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={clsx(
                        "text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded-full",
                        item.badgeVariant === "red"
                          ? "bg-rose-950/80 text-rose-400 border border-rose-800/60"
                          : "bg-slate-800 text-slate-400"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-[#1a2540] bg-[#05080f]">
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live SSE Active
          </span>
          <kbd className="font-mono text-[9px] bg-slate-900 border border-slate-700 px-1 rounded text-slate-400">
            ⌘K
          </kbd>
        </div>
      </div>
    </aside>
  );
}
