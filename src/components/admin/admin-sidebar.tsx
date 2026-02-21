'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  Shield, 
  Activity, 
  FileText,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Home,
  Sparkles,
  Crown,
  Settings,
  CreditCard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/context/auth-context';
import { useEffect, useState } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard, badge: null },
  { name: 'Subscriptions', href: '/admin/subscriptions', icon: Crown, badge: null },
  { name: 'Users', href: '/admin/users', icon: Users, badge: null },
  { name: 'API Usage', href: '/admin/api-usage', icon: Activity, badge: null },
  { name: 'Transactions', href: '/admin/transactions', icon: CreditCard, badge: null },
  { name: 'Logs', href: '/admin/logs', icon: FileText, badge: null },
  { name: 'Settings', href: '/admin/settings', icon: Settings, badge: null },
];

interface AdminSidebarProps {
  onNavigate?: () => void;
}

export function AdminSidebar({ onNavigate }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    for (const item of navigation) {
      router.prefetch(item.href);
    }
    router.prefetch('/dashboard');
  }, [router]);

  return (
    <TooltipProvider delayDuration={0}>
      <div className={cn(
        "flex flex-col h-screen border-r bg-card text-card-foreground transition-all duration-300 ease-in-out",
        collapsed ? "w-[70px]" : "w-[260px]"
      )}>
        {/* Logo Header */}
        <div className={cn(
          "flex items-center h-16 px-4 border-b",
          collapsed ? "justify-center" : "justify-between"
        )}>
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                </div>
              </div>
              <span className="text-lg font-bold">
                Admin Panel
              </span>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
          )}
          {!collapsed && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setCollapsed(!collapsed)}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Expand button when collapsed */}
        {collapsed && (
          <div className="flex justify-center py-3 border-b">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setCollapsed(false)}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {!collapsed && (
            <p className="px-3 mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Main Menu
            </p>
          )}
          {navigation.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/admin' && pathname.startsWith(item.href));
            
            const linkContent = (
              <Link
                key={item.name}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-primary/10 hover:text-primary"
                )}
              >
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-lg transition-colors",
                  isActive 
                    ? "bg-primary-foreground/20" 
                    : "bg-primary/10 group-hover:bg-primary/20"
                )}>
                  <item.icon className={cn("h-4 w-4", isActive ? "" : "text-primary")} />
                </div>
                {!collapsed && (
                  <>
                    <span className="font-medium">{item.name}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="ml-auto">
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>
                    {linkContent}
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {item.name}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return linkContent;
          })}
        </nav>

        {/* Bottom Section */}
        <div className="px-3 py-3 space-y-1 border-t">
          {/* Back to App */}
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/dashboard"
                  onClick={onNavigate}
                  className="flex items-center justify-center gap-3 px-3 py-2.5 rounded-lg hover:bg-primary/10 hover:text-primary transition-all duration-200"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                    <Home className="h-4 w-4 text-primary" />
                  </div>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">
                Back to App
              </TooltipContent>
            </Tooltip>
          ) : (
            <Link
              href="/dashboard"
              onClick={onNavigate}
              className="group flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-primary/10 hover:text-primary transition-all duration-200"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 group-hover:bg-primary/20">
                <Home className="h-4 w-4 text-primary" />
              </div>
              <span className="font-medium">Back to App</span>
            </Link>
          )}
        </div>

        {/* User Section */}
        <div className="p-4 border-t">
          <div className={cn(
            "flex items-center gap-3",
            collapsed && "justify-center"
          )}>
            <div className="relative">
              <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                <AvatarImage src={user?.photoURL || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                  {user?.email?.[0].toUpperCase() || 'A'}
                </AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">
                  {user?.displayName || 'Admin'}
                </p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            )}
          </div>
          
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="mt-3 w-full hover:text-destructive hover:bg-destructive/10"
                  onClick={logout}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                Sign Out
              </TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="ghost"
              className="mt-3 w-full justify-start hover:text-destructive hover:bg-destructive/10"
              onClick={logout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
