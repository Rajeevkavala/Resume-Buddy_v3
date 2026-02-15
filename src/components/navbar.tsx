'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  LogOut, 
  Menu, 
  User as UserIcon, 
  Zap, 
  Crown, 
  Clock, 
  X,
  LayoutDashboard,
  BarChart3,
  MessageSquare,
  Mic,
  TrendingUp,
  FileEdit,
  CreditCard,
  ChevronRight,
  Library,
  FileText
} from 'lucide-react';
import { Icons } from '@/components/icons';
import { useAuth } from '@/context/auth-context';
import { useSubscription } from '@/context/subscription-context';
import { Button } from '@/components/ui/button';
import { useState, startTransition } from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useDailyUsage } from '@/hooks/use-daily-usage';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Import ThemeToggle statically for faster navbar rendering
import { ThemeToggle } from '@/components/theme-toggle';

// Import sheet components statically
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

// Import dropdown components statically
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

// Navigation items with icons for mobile
const navItemsWithIcons = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, prefetch: true },
  { href: '/analysis', label: 'Analysis', icon: BarChart3, prefetch: true },
  { href: '/qa', label: 'Q&A', icon: MessageSquare, prefetch: true },
  { href: '/interview', label: 'Interview', icon: Mic, prefetch: true },
  { href: '/improvement', label: 'Improvement', icon: TrendingUp, prefetch: true },
  { href: '/create-resume', label: 'Create Resume', icon: FileEdit, prefetch: true },
  { href: '/cover-letter', label: 'Cover Letter', icon: FileText, prefetch: true },
  { href: '/resume-library', label: 'My Resumes', icon: Library, prefetch: true },
  { href: '/billing', label: 'Billing', icon: CreditCard, prefetch: true },
];

// Simple nav items for desktop (no icons needed)
const navItems = navItemsWithIcons.map(({ href, label, prefetch }) => ({ href, label, prefetch }));

// Additional routes - enable prefetching for critical routes
export const allAppRoutes = [
  ...navItems,
  { href: '/profile', label: 'Profile', prefetch: true },
  { href: '/pricing', label: 'Pricing', prefetch: true },
  { href: '/login', label: 'Login', prefetch: false },
  { href: '/signup', label: 'Signup', prefetch: false },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout, isAllowed } = useAuth();
  const { tier, currentPeriodEnd } = useSubscription();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { remaining, limit, loading: usageLoading } = useDailyUsage();
  
  const isFreeUser = tier === 'free';
  const isProUser = tier === 'pro';
  const creditsExhausted = remaining <= 0;

  // Calculate days remaining for Pro users
  const daysRemaining = (() => {
    if (!currentPeriodEnd || !isProUser) return 0;
    const endDate = new Date(currentPeriodEnd);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    const diffMs = endDate.getTime() - today.getTime();
    return Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
  })();

  // Get color for days remaining
  const getDaysColor = () => {
    if (daysRemaining <= 3) return 'text-red-500 bg-red-50 dark:bg-red-950/30';
    if (daysRemaining <= 7) return 'text-amber-500 bg-amber-50 dark:bg-amber-950/30';
    return 'text-amber-600 bg-amber-50 dark:bg-amber-950/30';
  };

  const handleLogout = () => {
    startTransition(() => {
      logout();
      setIsMobileMenuOpen(false);
    });
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('').toUpperCase().slice(0, 2);
  };
  
  // Get color based on remaining requests
  const getUsageColor = () => {
    if (remaining <= 2) return 'text-red-500 bg-red-50 dark:bg-red-950/30';
    if (remaining <= 5) return 'text-amber-500 bg-amber-50 dark:bg-amber-950/30';
    return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30';
  };

  // Only render navbar for authenticated AND allowed users
  if (!user || !isAllowed) {
    return null;
  }

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full border-b transition-all duration-300 navbar-animate",
      "bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70",
      "shadow-[0_1px_3px_0_rgb(0,0,0,0.05)]",
      "dark:border-border/40 dark:shadow-[0_1px_3px_0_rgb(0,0,0,0.2)]"
    )}>
      <div className="container flex h-16 items-center px-4 md:px-6">
        {/* Mobile Nav */}
        <div className="md:hidden flex items-center gap-2">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="relative hover:bg-muted/60 transition-colors"
              >
                <Menu className="h-5 w-5" />
                {/* Notification dot for low credits or expiring subscription */}
                {(creditsExhausted || (isProUser && daysRemaining <= 3)) && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                )}
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent 
              side="left" 
              className="w-[85vw] max-w-[320px] p-0 border-r border-border/30"
            >
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation Menu</SheetTitle>
              </SheetHeader>
              
              <div className="flex h-full flex-col">
                {/* Header with Logo and User Quick Info */}
                <div className="p-4 border-b border-border/20 bg-gradient-to-br from-muted/30 to-transparent">
                  <div className="flex items-center justify-between mb-4">
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-2 group"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Icons.logo className="h-8 w-8 text-primary" />
                      <span className="font-headline font-bold text-lg">ResumeBuddy</span>
                      {isProUser && (
                        <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-[10px] font-semibold px-1.5 py-0.5 shadow-sm">
                          <Crown className="h-2.5 w-2.5 mr-0.5" />
                          PRO
                        </Badge>
                      )}
                    </Link>
                    <SheetClose asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted/60">
                        <X className="h-4 w-4" />
                      </Button>
                    </SheetClose>
                  </div>
                  
                  {/* User Quick Card */}
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-background/60 border border-border/30">
                    <Avatar className={cn(
                      "h-10 w-10 ring-2",
                      isProUser ? "ring-amber-500/50" : "ring-border/50"
                    )}>
                      <AvatarImage src={user.photoURL || ''} />
                      <AvatarFallback className={cn(
                        "font-semibold text-sm",
                        isProUser ? "bg-amber-500/10 text-amber-600" : "bg-primary/10 text-primary"
                      )}>
                        {getInitials(user.displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{user.displayName || 'User'}</p>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className={cn(
                          "text-[10px] px-1.5 py-0 h-5",
                          isProUser && "border-amber-500/50 text-amber-600"
                        )}>
                          {isProUser ? '✦ Pro' : 'Free'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Navigation with Icons */}
                <nav className="flex-1 overflow-y-auto p-3">
                  <p className="px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Main Menu
                  </p>
                  <div className="space-y-1">
                    {navItemsWithIcons.map(item => (
                      <SheetClose asChild key={item.href}>
                        <Link
                          href={item.href}
                          prefetch={item.prefetch}
                          className={cn(
                            "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all",
                            pathname === item.href
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          )}
                        >
                          <div className={cn(
                            "flex items-center justify-center w-9 h-9 rounded-lg transition-colors",
                            pathname === item.href 
                              ? "bg-primary/20" 
                              : "bg-muted/50"
                          )}>
                            <item.icon className={cn(
                              "h-4 w-4",
                              pathname === item.href && "text-primary"
                            )} />
                          </div>
                          <span>{item.label}</span>
                          {pathname === item.href && (
                            <ChevronRight className="h-4 w-4 ml-auto text-primary" />
                          )}
                        </Link>
                      </SheetClose>
                    ))}
                  </div>
                </nav>

                {/* Bottom Section - Stats & Actions */}
                <div className="p-3 border-t border-border/20 bg-muted/20 space-y-3">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Credits Card */}
                    <div className={cn(
                      "p-3 rounded-xl border transition-colors",
                      getUsageColor(),
                      "border-current/20"
                    )}>
                      <div className="flex items-center gap-2 mb-1">
                        <Zap className="h-4 w-4" />
                        <span className="text-xs font-medium">Credits</span>
                      </div>
                      <p className="text-lg font-bold">{usageLoading ? '...' : `${remaining}/${limit}`}</p>
                      <p className="text-[10px] opacity-70">daily requests</p>
                    </div>

                    {/* Subscription/Upgrade Card */}
                    {isProUser ? (
                      <SheetClose asChild>
                        <Link 
                          href="/billing"
                          className={cn(
                            "p-3 rounded-xl border transition-colors hover:opacity-80",
                            getDaysColor(),
                            "border-current/20"
                          )}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="h-4 w-4" />
                            <span className="text-xs font-medium">Pro Plan</span>
                          </div>
                          <p className="text-lg font-bold">{daysRemaining}d</p>
                          <p className="text-[10px] opacity-70">remaining</p>
                        </Link>
                      </SheetClose>
                    ) : (
                      <SheetClose asChild>
                        <Link 
                          href="/pricing"
                          className={cn(
                            "p-3 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors",
                            creditsExhausted && "status-critical"
                          )}
                        >
                          <div className="flex items-center gap-2 mb-1 text-primary">
                            <Crown className="h-4 w-4" />
                            <span className="text-xs font-medium">Upgrade</span>
                          </div>
                          <p className="text-sm font-semibold text-primary">Get Pro</p>
                          <p className="text-[10px] text-primary/70">Unlock all features</p>
                        </Link>
                      </SheetClose>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-2">
                    <SheetClose asChild>
                      <Link href="/profile" className="flex-1">
                        <Button variant="outline" size="sm" className="w-full gap-2">
                          <UserIcon className="h-4 w-4" />
                          Profile
                        </Button>
                      </Link>
                    </SheetClose>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleLogout}
                      className="gap-2 text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800/50 dark:hover:bg-red-950/30"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </Button>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          
          {/* Mobile Logo (shown next to hamburger) */}
          <Link
            href="/dashboard"
            className="flex items-center gap-2 group"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Icons.logo className="h-7 w-7 text-primary" />
            {isProUser && (
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-[9px] font-semibold px-1.5 py-0 shadow-sm">
                <Crown className="h-2.5 w-2.5 mr-0.5" />
                PRO
              </Badge>
            )}
          </Link>
        </div>
        
        {/* Desktop Logo */}
        <Link
          href="/dashboard"
          className="mr-8 hidden items-center gap-2.5 md:flex group"
        >
          <div className="relative">
            <Icons.logo className="h-8 w-8 text-primary transition-transform duration-200 group-hover:scale-105" />
            {/* Subtle glow effect on hover */}
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-headline font-bold text-lg tracking-tight text-primary group-hover:text-primary/80 transition-colors">
              ResumeBuddy
            </span>
            {isProUser && (
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-[10px] font-semibold px-2 py-0.5 shadow-sm">
                <Crown className="h-3 w-3 mr-0.5" />
                PRO
              </Badge>
            )}
          </div>
        </Link>
        
        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              prefetch={item.prefetch}
              className={cn(
                "relative px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                "hover:bg-primary/10 hover:text-primary",
                pathname === item.href
                  ? "text-primary bg-primary/5"
                  : "text-muted-foreground"
              )}
            >
              {item.label}
              {/* Active indicator underline */}
              {pathname === item.href && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-3/5 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
          ))}
        </nav>

        <div className="flex flex-1 items-center justify-end gap-3">
          {/* Compact Mobile Usage Indicator */}
          <div className={cn(
            "flex md:hidden items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold",
            getUsageColor()
          )}>
            <Zap className="h-3 w-3" />
            <span>{usageLoading ? '...' : remaining}</span>
          </div>
          
          {/* Combined Status Pill - Desktop only (lg+) */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border/40">
            {/* Daily Credits */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={cn(
                    "flex items-center gap-1.5 text-xs font-medium cursor-default",
                    getUsageColor()
                  )}>
                    <Zap className="h-3.5 w-3.5" />
                    <span>{usageLoading ? '...' : `${remaining}/${limit}`}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="font-medium">Daily AI Credits</p>
                  <p className="text-xs text-muted-foreground">
                    {remaining} of {limit} requests remaining
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Separator */}
            <div className="h-4 w-px bg-border/60" />

            {/* Pro Days or Upgrade CTA */}
            {isProUser && daysRemaining > 0 ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link 
                      href="/billing"
                      className={cn(
                        "flex items-center gap-1.5 text-xs font-medium transition-colors hover:opacity-80",
                        getDaysColor()
                      )}
                    >
                      <Clock className="h-3.5 w-3.5" />
                      <span>{daysRemaining}d</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="font-medium">Pro Subscription</p>
                    <p className="text-xs text-muted-foreground">
                      {daysRemaining} days remaining
                      {daysRemaining <= 7 && '. Click to renew.'}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : isFreeUser && (
              <Link 
                href="/pricing" 
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                <Crown className="h-3.5 w-3.5" />
                <span>Upgrade</span>
              </Link>
            )}
          </div>

          {/* Standalone Upgrade Button - Visible for Free users on sm-lg screens */}
          {isFreeUser && (
            <Link href="/pricing">
              <Button 
                size="default" 
                className={cn(
                  "hidden sm:flex lg:hidden items-center gap-2",
                  "bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white",
                  "shadow-md hover:shadow-lg transition-all duration-200 px-4",
                  creditsExhausted && "animate-pulse ring-2 ring-primary/30"
                )}
              >
                <Crown className="h-4 w-4" />
                <span className="text-sm font-semibold">Upgrade to Pro</span>
              </Button>
            </Link>
          )}

          {/* Standalone Usage on sm-lg screens */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn(
                  "hidden sm:flex lg:hidden items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium cursor-default",
                  getUsageColor()
                )}>
                  <Zap className="h-3.5 w-3.5" />
                  <span>{usageLoading ? '...' : `${remaining}/${limit}`}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="font-medium">Daily AI Credits</p>
                <p className="text-xs text-muted-foreground">
                  {remaining} of {limit} requests remaining
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <ThemeToggle />
          
          {/* User Dropdown Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="relative h-10 w-10 rounded-full hover:bg-muted/60 transition-all group p-0"
              >
                <Avatar className={cn(
                  "h-9 w-9 ring-2 transition-all",
                  isProUser 
                    ? "ring-amber-500/50 group-hover:ring-amber-500" 
                    : "ring-border/50 group-hover:ring-primary/50"
                )}>
                  <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
                  <AvatarFallback className={cn(
                    "font-semibold text-sm",
                    isProUser 
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" 
                      : "bg-primary/10 text-primary"
                  )}>
                    {getInitials(user.displayName)}
                  </AvatarFallback>
                </Avatar>
                {/* Online indicator */}
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent 
              className="w-72 p-2 border border-border/50 shadow-xl rounded-xl" 
              align="end" 
              sideOffset={8}
            >
              {/* User Info Header */}
              <div className="p-3 bg-gradient-to-br from-muted/50 to-muted/30 rounded-lg mb-2">
                <div className="flex items-start gap-3">
                  <Avatar className={cn(
                    "h-12 w-12 ring-2",
                    isProUser ? "ring-amber-500/50" : "ring-border/50"
                  )}>
                    <AvatarImage src={user.photoURL || ''} />
                    <AvatarFallback className={cn(
                      "text-base font-semibold",
                      isProUser 
                        ? "bg-amber-500/10 text-amber-600" 
                        : "bg-primary/10 text-primary"
                    )}>
                      {getInitials(user.displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{user.displayName || 'User'}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    <Badge className={cn(
                      "mt-1.5 text-[10px] font-semibold",
                      isProUser 
                        ? "bg-amber-500/10 text-amber-600 border-amber-500/30" 
                        : "bg-muted text-muted-foreground border-border/50"
                    )}>
                      {isProUser ? '✦ Pro Member' : 'Free Plan'}
                    </Badge>
                  </div>
                </div>
              </div>

              <DropdownMenuSeparator className="bg-border/30" />

              {/* Quick Stats for Pro Users */}
              {isProUser && daysRemaining > 0 && (
                <>
                  <div className="px-2 py-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Subscription</span>
                      <span className={cn(
                        "font-medium",
                        daysRemaining <= 3 ? "text-red-500" : daysRemaining <= 7 ? "text-amber-500" : "text-amber-600"
                      )}>
                        {daysRemaining} days left
                      </span>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="bg-border/30" />
                </>
              )}

              {/* Menu Items */}
              <DropdownMenuItem asChild className="p-0 focus:bg-transparent">
                <Link 
                  href="/profile" 
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 hover:bg-primary/10 group"
                >
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <UserIcon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm group-hover:text-primary transition-colors">Profile</p>
                    <p className="text-xs text-muted-foreground">Manage your account</p>
                  </div>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild className="p-0 focus:bg-transparent">
                <Link 
                  href="/billing" 
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 hover:bg-primary/10 group"
                >
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <CreditCard className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm group-hover:text-primary transition-colors">Billing</p>
                    <p className="text-xs text-muted-foreground">
                      {isProUser ? 'Manage subscription' : 'Upgrade to Pro'}
                    </p>
                  </div>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-border/30 my-1" />

              {/* Logout */}
              <DropdownMenuItem 
                onClick={logout}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 hover:bg-red-500/10 group focus:bg-red-500/10"
              >
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-red-500/10 group-hover:bg-red-500/20 transition-colors">
                  <LogOut className="h-4 w-4 text-red-500" />
                </div>
                <div>
                  <p className="font-medium text-sm text-red-500">Sign out</p>
                  <p className="text-xs text-red-400/70">End your session</p>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
