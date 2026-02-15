'use client';

import React, { useState, useCallback } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Loader2, KeyRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ForgotPasswordDialogProps {
  /** For uncontrolled mode - render a trigger element */
  children?: React.ReactNode;
  /** Default email to pre-fill */
  defaultEmail?: string;
  /** For controlled mode - dialog open state */
  open?: boolean;
  /** For controlled mode - callback when open state changes */
  onOpenChange?: (open: boolean) => void;
}

export function ForgotPasswordDialog({ 
  children, 
  defaultEmail = '',
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: ForgotPasswordDialogProps) {
  // Internal state for uncontrolled mode
  const [internalOpen, setInternalOpen] = useState(false);
  
  // Determine if we're in controlled mode
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (controlledOnOpenChange ?? (() => {})) : setInternalOpen;
  
  const [email, setEmail] = useState(defaultEmail);
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Reset state when dialog opens/closes
  const handleOpenChange = useCallback((newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      setEmail(defaultEmail);
      setEmailError('');
      setIsSuccess(false);
    }
  }, [defaultEmail, setOpen]);

  // Email validation
  const validateEmail = (email: string): string => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      return 'Email is required';
    } else if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateEmail(email);
    setEmailError(validationError);
    
    if (validationError) {
      return;
    }

    setIsLoading(true);

    try {
      await sendPasswordResetEmail(auth, email, {
        // Redirect URL after password reset (optional)
        url: `${window.location.origin}/login`,
        handleCodeInApp: false,
      });
      
      setIsSuccess(true);
      toast.success('Password reset email sent! Check your inbox.');
    } catch (error: any) {
      console.error('Password reset error:', error);
      
      let errorMessage = 'Failed to send reset email. Please try again.';
      
      if (error.code === 'auth/user-not-found') {
        // For security, don't reveal if email exists
        setIsSuccess(true); // Show success even if user not found
        toast.success('If an account exists with this email, you will receive a reset link.');
        setIsLoading(false);
        return;
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
        setEmailError('Invalid email format');
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please try again later.';
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {children && (
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-full bg-primary/10">
              <KeyRound className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">Reset Password</DialogTitle>
              <DialogDescription className="text-sm mt-1">
                {isSuccess 
                  ? "Check your email for the reset link"
                  : "Enter your email to receive a password reset link"
                }
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isSuccess ? (
          // Success state
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Email Sent!</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  We've sent a password reset link to <strong className="text-foreground">{email}</strong>
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  <strong>Didn't receive the email?</strong> Check your spam folder, or try again in a few minutes.
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setIsSuccess(false);
                    setEmail('');
                  }}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Try Different Email
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => handleOpenChange(false)}
                >
                  Back to Login
                </Button>
              </div>
            </div>
          </div>
        ) : (
          // Form state
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email" className="text-sm font-medium">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="Enter your email address"
                  className={cn(
                    "pl-10 h-12 border-2 transition-colors",
                    emailError 
                      ? "border-red-500 focus:border-red-500" 
                      : "focus:border-primary"
                  )}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError('');
                  }}
                  disabled={isLoading}
                  autoComplete="email"
                  autoFocus
                />
              </div>
              {emailError && (
                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="h-3 w-3" />
                  <span>{emailError}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => handleOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-primary to-primary/80"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Reset Link
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
