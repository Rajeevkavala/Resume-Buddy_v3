'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Home, Bug, ChevronDown, ChevronUp, Copy, Check, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorPageProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  // Log error to console in development
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  const handleRetry = async () => {
    setIsRetrying(true);
    // Small delay for visual feedback
    await new Promise(resolve => setTimeout(resolve, 800));
    reset();
    setIsRetrying(false);
  };

  const handleCopyError = async () => {
    const errorText = `Error: ${error.message}\n${error.digest ? `Digest: ${error.digest}\n` : ''}Stack: ${error.stack || 'Not available'}`;
    await navigator.clipboard.writeText(errorText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-destructive/5 flex items-center justify-center p-4 overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.3)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.3)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_40%,transparent_100%)]" />
      
      <div className="relative z-10 max-w-2xl w-full text-center">
        {/* Animated Character - Confused Robot */}
        <motion.div
          className="relative mb-8"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
        >
          <div className="relative w-48 h-48 mx-auto">
            {/* Robot body */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="relative">
                {/* Antenna */}
                <motion.div 
                  className="absolute -top-6 left-1/2 -translate-x-1/2 flex flex-col items-center"
                  animate={{ rotate: [-10, 10, -10] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <motion.div 
                    className="w-4 h-4 rounded-full bg-destructive"
                    animate={{ 
                      scale: [1, 1.3, 1],
                      boxShadow: [
                        '0 0 0 0 rgba(239, 68, 68, 0.4)',
                        '0 0 0 10px rgba(239, 68, 68, 0)',
                        '0 0 0 0 rgba(239, 68, 68, 0.4)',
                      ]
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  <div className="w-1 h-4 bg-slate-400 dark:bg-slate-500" />
                </motion.div>
                
                {/* Head */}
                <div className="w-28 h-24 bg-gradient-to-b from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 rounded-2xl border-4 border-slate-400 dark:border-slate-500 shadow-xl relative overflow-hidden">
                  {/* Screen/Face */}
                  <div className="absolute inset-2 bg-slate-800 dark:bg-slate-900 rounded-lg flex items-center justify-center">
                    {/* Error eyes - X X */}
                    <div className="flex gap-4">
                      <motion.div
                        className="relative w-6 h-6"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-5 h-1 bg-destructive rotate-45 absolute" />
                          <div className="w-5 h-1 bg-destructive -rotate-45 absolute" />
                        </div>
                      </motion.div>
                      <motion.div
                        className="relative w-6 h-6"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2, delay: 0.1 }}
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-5 h-1 bg-destructive rotate-45 absolute" />
                          <div className="w-5 h-1 bg-destructive -rotate-45 absolute" />
                        </div>
                      </motion.div>
                    </div>
                  </div>
                  
                  {/* Side lights */}
                  <motion.div 
                    className="absolute top-2 -right-2 w-2 h-2 rounded-full bg-amber-400"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                  <motion.div 
                    className="absolute bottom-2 -right-2 w-2 h-2 rounded-full bg-amber-400"
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                </div>
                
                {/* Neck */}
                <div className="w-8 h-3 bg-slate-400 dark:bg-slate-500 mx-auto rounded-b-lg" />
                
                {/* Body */}
                <div className="w-24 h-20 bg-gradient-to-b from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 rounded-xl mx-auto border-4 border-slate-400 dark:border-slate-500 relative">
                  {/* Chest display */}
                  <div className="absolute inset-x-3 top-2 h-8 bg-slate-800 dark:bg-slate-900 rounded flex items-center justify-center overflow-hidden">
                    <motion.div
                      className="text-xs font-mono text-destructive whitespace-nowrap"
                      animate={{ x: [100, -100] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    >
                      ERROR • MALFUNCTION • ERROR • MALFUNCTION •
                    </motion.div>
                  </div>
                  
                  {/* Buttons */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    <motion.div 
                      className="w-2 h-2 rounded-full bg-emerald-400"
                      animate={{ opacity: [0.3, 0.8, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <motion.div 
                      className="w-2 h-2 rounded-full bg-amber-400"
                      animate={{ opacity: [0.8, 0.3, 0.8] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <motion.div 
                      className="w-2 h-2 rounded-full bg-destructive"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    />
                  </div>
                </div>
                
                {/* Arms */}
                <motion.div 
                  className="absolute left-0 top-[7.5rem] w-6 h-3 bg-slate-300 dark:bg-slate-600 rounded-full origin-right border-2 border-slate-400 dark:border-slate-500 -translate-x-full"
                  animate={{ rotate: [0, -30, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div 
                  className="absolute right-0 top-[7.5rem] w-6 h-3 bg-slate-300 dark:bg-slate-600 rounded-full origin-left border-2 border-slate-400 dark:border-slate-500 translate-x-full"
                  animate={{ rotate: [0, 30, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                />
              </div>
            </motion.div>
            
            {/* Floating error symbols */}
            {['!', '?', '!'].map((char, i) => (
              <motion.div
                key={i}
                className="absolute text-2xl font-bold text-destructive/40"
                style={{
                  left: `${15 + i * 35}%`,
                  top: '10%',
                }}
                animate={{
                  y: [0, -20, 0],
                  opacity: [0.2, 0.6, 0.2],
                  rotate: [0, 10, -10, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.5,
                  ease: "easeInOut",
                }}
              >
                {char}
              </motion.div>
            ))}
            
            {/* Sparks */}
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={`spark-${i}`}
                className="absolute w-1 h-1 bg-amber-400 rounded-full"
                style={{
                  left: `${30 + Math.random() * 40}%`,
                  top: `${40 + Math.random() * 30}%`,
                }}
                animate={{
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.6,
                  repeatDelay: 1.5,
                }}
              />
            ))}
          </div>
        </motion.div>

        {/* Error Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-2"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-destructive/10 border border-destructive/20 text-sm text-destructive mb-4">
            <AlertTriangle className="w-4 h-4" />
            Something went wrong
          </div>
        </motion.div>

        {/* Message */}
        <motion.div
          className="space-y-3 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">
            Oops! The robot tripped over a wire
          </h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Our systems hit an unexpected snag. Give it another shot — 
            these things usually sort themselves out.
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-3 justify-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Button 
            size="lg" 
            className="gap-2 shadow-lg shadow-primary/20"
            onClick={handleRetry}
            disabled={isRetrying}
          >
            {isRetrying ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Try Again
              </>
            )}
          </Button>
          <Link href="/">
            <Button variant="outline" size="lg" className="gap-2">
              <Home className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
        </motion.div>

        {/* Error Details Accordion */}
        <motion.div
          className="max-w-lg mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-2 mx-auto text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Bug className="w-4 h-4" />
            {showDetails ? 'Hide' : 'Show'} error details
            {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4"
            >
              <div className="bg-muted/50 border border-border rounded-lg p-4 text-left relative">
                <button
                  onClick={handleCopyError}
                  className="absolute top-2 right-2 p-2 hover:bg-muted rounded-md transition-colors"
                  title="Copy error details"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
                
                <div className="space-y-2 pr-8">
                  <div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Error Message</span>
                    <p className="text-sm font-mono text-destructive mt-1 break-words">
                      {error.message || 'Unknown error'}
                    </p>
                  </div>
                  
                  {error.digest && (
                    <div>
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Error ID</span>
                      <p className="text-sm font-mono text-muted-foreground mt-1">
                        {error.digest}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground mt-3">
                If this keeps happening, try clearing your browser cache or contact support.
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Footer help text */}
        <motion.div
          className="mt-12 pt-8 border-t border-border/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <p className="text-sm text-muted-foreground">
            Still stuck? Try these quick fixes:
          </p>
          <div className="flex flex-wrap gap-4 justify-center mt-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs">1</span>
              Refresh the page
            </span>
            <span className="flex items-center gap-1">
              <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs">2</span>
              Clear browser cache
            </span>
            <span className="flex items-center gap-1">
              <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs">3</span>
              Try again later
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
