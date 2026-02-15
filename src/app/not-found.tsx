'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft, Search, MapPin } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function NotFound() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(10);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-redirect countdown
  useEffect(() => {
    if (isPaused) return;
    
    if (countdown <= 0) {
      router.push('/');
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, isPaused, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 flex items-center justify-center p-4 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.3)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.3)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_40%,transparent_100%)]" />
      
      <div className="relative z-10 max-w-2xl w-full text-center">
        {/* Animated Character - Lost Astronaut */}
        <motion.div
          className="relative mb-8"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
        >
          {/* Floating astronaut */}
          <motion.div
            className="relative w-48 h-48 mx-auto"
            animate={{ 
              y: [0, -15, 0],
              rotate: [0, 3, -3, 0],
            }}
            transition={{ 
              duration: 6, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          >
            {/* Astronaut body */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                {/* Helmet */}
                <motion.div 
                  className="w-24 h-24 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 border-4 border-slate-400 dark:border-slate-500 shadow-xl flex items-center justify-center"
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {/* Visor */}
                  <div className="w-16 h-12 rounded-full bg-gradient-to-br from-primary/80 to-primary/40 flex items-center justify-center overflow-hidden">
                    {/* Face reflection */}
                    <motion.div 
                      className="w-3 h-3 bg-white/40 rounded-full absolute top-3 right-4"
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    {/* Eyes */}
                    <div className="flex gap-3">
                      <motion.div 
                        className="w-2 h-2 bg-white rounded-full"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                      />
                      <motion.div 
                        className="w-2 h-2 bg-white rounded-full"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 3, repeat: Infinity, delay: 0.7 }}
                      />
                    </div>
                  </div>
                </motion.div>
                
                {/* Body */}
                <div className="w-20 h-16 bg-gradient-to-b from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 rounded-2xl mx-auto -mt-2 border-2 border-slate-400 dark:border-slate-500">
                  {/* Backpack */}
                  <div className="absolute -right-3 top-1/2 w-4 h-10 bg-slate-300 dark:bg-slate-600 rounded-r-lg border-2 border-l-0 border-slate-400 dark:border-slate-500" />
                </div>
                
                {/* Arms */}
                <motion.div 
                  className="absolute -left-8 top-12 w-8 h-3 bg-slate-200 dark:bg-slate-600 rounded-full origin-right border border-slate-400 dark:border-slate-500"
                  animate={{ rotate: [0, 20, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div 
                  className="absolute -right-6 top-12 w-8 h-3 bg-slate-200 dark:bg-slate-600 rounded-full origin-left border border-slate-400 dark:border-slate-500"
                  animate={{ rotate: [0, -15, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                />
              </div>
            </div>
            
            {/* Floating particles - using fixed positions to avoid hydration mismatch */}
            {[
              { left: '25%', top: '30%' },
              { left: '65%', top: '25%' },
              { left: '40%', top: '60%' },
              { left: '75%', top: '55%' },
              { left: '30%', top: '75%' },
              { left: '55%', top: '40%' },
            ].map((pos, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-primary/30 rounded-full"
                style={{
                  left: pos.left,
                  top: pos.top,
                }}
                animate={{
                  y: [0, -30, 0],
                  x: [0, (i % 2 === 0 ? 10 : -10), 0],
                  opacity: [0.3, 0.7, 0.3],
                  scale: [0.8, 1.2, 0.8],
                }}
                transition={{
                  duration: 3 + i * 0.3,
                  repeat: Infinity,
                  delay: i * 0.4,
                  ease: "easeInOut",
                }}
              />
            ))}
          </motion.div>
          
          {/* Map/Location pin animation */}
          <motion.div
            className="absolute bottom-0 left-1/2 -translate-x-1/2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <MapPin className="w-8 h-8 text-destructive/60" />
            </motion.div>
            <motion.div 
              className="w-6 h-1 bg-destructive/20 rounded-full mx-auto mt-1"
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
        </motion.div>

        {/* 404 Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h1 className="text-8xl sm:text-9xl font-headline font-bold text-primary/20 select-none">
            404
          </h1>
        </motion.div>

        {/* Message */}
        <motion.div
          className="space-y-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h2 className="text-2xl sm:text-3xl font-semibold text-foreground">
            Houston, we have a problem
          </h2>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Looks like this page drifted off into space. 
            Don&apos;t worry, we&apos;ll get you back on track.
          </p>
        </motion.div>

        {/* Countdown */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-sm text-muted-foreground">
            Redirecting to home in{' '}
            <span className="font-mono text-primary font-semibold">{countdown}</span>
            {' '}seconds
          </p>
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="text-xs text-muted-foreground/70 hover:text-muted-foreground mt-1 underline-offset-2 hover:underline transition-colors"
          >
            {isPaused ? 'Resume countdown' : 'Pause countdown'}
          </button>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-3 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Link href="/">
            <Button size="lg" className="gap-2 shadow-lg shadow-primary/20">
              <Home className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
          <Button 
            variant="outline" 
            size="lg" 
            className="gap-2"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
        </motion.div>

        {/* Helpful links */}
        <motion.div
          className="mt-12 pt-8 border-t border-border/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <p className="text-sm text-muted-foreground mb-4">Looking for something specific?</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              { href: '/dashboard', label: 'Dashboard' },
              { href: '/analysis', label: 'Analysis' },
              { href: '/create-resume', label: 'Create Resume' },
              { href: '/pricing', label: 'Pricing' },
            ].map((link) => (
              <Link key={link.href} href={link.href}>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  {link.label}
                </Button>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
