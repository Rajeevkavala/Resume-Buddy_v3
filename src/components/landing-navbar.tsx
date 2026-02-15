'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, ArrowRight } from 'lucide-react';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

const navSections = [
  { href: '#stats', label: 'Why Us' },
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How It Works' },
];

export default function LandingNavbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  // Handle scroll effect and active section detection
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
      
      // Reset active section when at top
      if (window.scrollY < 100) {
        setActiveSection('');
        return;
      }
      
      // Detect active section - check sections in order from bottom to top
      const sections = navSections.map(s => s.href.replace('#', ''));
      let found = false;
      
      for (const section of [...sections].reverse()) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 200 && rect.bottom > 100) {
            setActiveSection(`#${section}`);
            found = true;
            break;
          }
        }
      }
      
      if (!found) {
        setActiveSection('');
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Run on mount
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Smooth scroll handler
  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    setActiveSection(href);
    
    const targetId = href.replace('#', '');
    const element = document.getElementById(targetId);
    
    if (element) {
      const yOffset = -80; // Offset for fixed navbar
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      
      window.scrollTo({
        top: y,
        behavior: 'smooth'
      });
    }
  };

  return (
    <header 
      className={cn(
        "fixed top-0 z-50 w-full transition-all duration-500",
        isScrolled 
          ? cn(
              "bg-background/90 backdrop-blur-xl border-b",
              "shadow-[0_1px_3px_0_rgb(0,0,0,0.05)]",
              "dark:border-border/40 dark:shadow-[0_1px_3px_0_rgb(0,0,0,0.2)]"
            )
          : "bg-transparent border-transparent"
      )}
    >
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 group"
        >
          <div className="relative">
            <Icons.logo className="h-8 w-8 text-primary transition-transform duration-200 group-hover:scale-105" />
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <span className="font-headline font-bold text-lg tracking-tight text-foreground group-hover:text-primary transition-colors">
            ResumeBuddy
          </span>
        </Link>

        {/* Desktop Navigation - Pill style */}
        <nav className="hidden md:flex items-center gap-1 px-2 py-1.5 rounded-full bg-muted/40 border border-border/30">
          {navSections.map((section) => (
            <a
              key={section.href}
              href={section.href}
              onClick={(e) => handleSmoothScroll(e, section.href)}
              className={cn(
                "relative px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-300",
                activeSection === section.href 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {section.label}
            </a>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          <Link href="/login">
            <Button 
              variant="ghost" 
              size="sm"
              className="font-medium px-4"
            >
              Sign In
            </Button>
          </Link>
          <Link href="/signup">
            <Button 
              className={cn(
                "font-semibold text-sm px-5",
                "bg-primary hover:bg-primary/90",
                "shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30",
                "transition-all duration-200"
              )}
            >
              Get Started
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Mobile Navigation */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="hover:bg-muted/60 transition-colors"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent 
              side="right" 
              className="w-[85vw] max-w-[300px] p-0 border-l border-border/30"
            >
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation Menu</SheetTitle>
              </SheetHeader>
              <div className="flex h-full flex-col">
                {/* Header */}
                <div className="p-4 border-b border-border/20">
                  <div className="flex items-center justify-between">
                    <Link 
                      href="/" 
                      className="flex items-center gap-2"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Icons.logo className="h-7 w-7 text-primary" />
                      <span className="font-headline font-bold">ResumeBuddy</span>
                    </Link>
                    <SheetClose asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted/60">
                        <X className="h-4 w-4" />
                      </Button>
                    </SheetClose>
                  </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1">
                  {navSections.map((section) => (
                    <SheetClose asChild key={section.href}>
                      <a
                        href={section.href}
                        onClick={(e) => handleSmoothScroll(e, section.href)}
                        className={cn(
                          "flex items-center px-4 py-3 rounded-xl text-base font-medium transition-all",
                          activeSection === section.href 
                            ? "bg-primary/10 text-primary" 
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                      >
                        {section.label}
                      </a>
                    </SheetClose>
                  ))}
                </nav>

                {/* Auth Buttons */}
                <div className="p-4 border-t border-border/20 space-y-3">
                  <SheetClose asChild>
                    <Link href="/login" className="block">
                      <Button 
                        variant="outline" 
                        size="lg"
                        className="w-full font-medium"
                      >
                        Sign In
                      </Button>
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link href="/signup" className="block">
                      <Button 
                        className="w-full font-semibold shadow-md" 
                        size="lg"
                      >
                        Get Started
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </SheetClose>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
