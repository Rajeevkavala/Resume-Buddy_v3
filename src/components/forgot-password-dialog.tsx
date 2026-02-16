'use client';

import React, { useState, useCallback } from 'react';
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
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Loader2, KeyRound, Lock, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ForgotPasswordDialogProps {
  children?: React.ReactNode;
  defaultEmail?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

type Step = 'email' | 'otp' | 'success';

export function ForgotPasswordDialog({ 
  children, 
  defaultEmail = '',
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: ForgotPasswordDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (controlledOnOpenChange ?? (() => {})) : setInternalOpen;
  
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState(defaultEmail);
  const [emailError, setEmailError] = useState('');
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleOpenChange = useCallback((newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      setEmail(defaultEmail);
      setEmailError('');
      setCode('');
      setCodeError('');
      setNewPassword('');
      setPasswordError('');
      setStep('email');
      setShowPassword(false);
    }
  }, [defaultEmail, setOpen]);

  const validateEmail = (email: string): string => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'Email is required';
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return '';
  };

  // Step 1: Send reset OTP to email
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateEmail(email);
    setEmailError(validationError);
    if (validationError) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      // API always returns success to prevent email enumeration
      if (res.ok) {
        setStep('otp');
        toast.success('If an account exists with this email, you will receive a reset code.');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to send reset code. Please try again.');
      }
    } catch {
      toast.error('Failed to send reset code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP and set new password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let hasError = false;
    if (!code || code.length < 4) {
      setCodeError('Please enter the verification code');
      hasError = true;
    }
    if (!newPassword || newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      hasError = true;
    }
    if (hasError) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/password/reset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 400 && data.error?.toLowerCase().includes('code')) {
          setCodeError(data.error);
        } else {
          toast.error(data.error || 'Failed to reset password.');
        }
        return;
      }

      setStep('success');
      toast.success('Password reset successfully!');
    } catch {
      toast.error('Failed to reset password. Please try again.');
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
                {step === 'email' && "Enter your email to receive a password reset code"}
                {step === 'otp' && "Enter the code sent to your email and your new password"}
                {step === 'success' && "Your password has been reset"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {step === 'success' ? (
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Password Reset!</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Your password has been updated successfully. You can now log in with your new password.
                </p>
              </div>
            </div>
            <Button className="w-full" onClick={() => handleOpenChange(false)}>
              Back to Login
            </Button>
          </div>
        ) : step === 'otp' ? (
          <form onSubmit={handleResetPassword} className="space-y-4 py-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-800 dark:text-blue-200">
                We sent a verification code to <strong>{email}</strong>. Enter it below with your new password.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reset-code" className="text-sm font-medium">Verification Code</Label>
              <Input
                id="reset-code"
                type="text"
                placeholder="Enter verification code"
                className={cn("h-12 border-2 text-center text-lg tracking-widest", codeError ? "border-red-500" : "focus:border-primary")}
                value={code}
                onChange={(e) => { setCode(e.target.value); if (codeError) setCodeError(''); }}
                disabled={isLoading}
                autoFocus
                autoComplete="one-time-code"
              />
              {codeError && (
                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="h-3 w-3" /><span>{codeError}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-sm font-medium">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter new password"
                  className={cn("pl-10 pr-10 h-12 border-2", passwordError ? "border-red-500" : "focus:border-primary")}
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); if (passwordError) setPasswordError(''); }}
                  disabled={isLoading}
                  autoComplete="new-password"
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                </button>
              </div>
              {passwordError && (
                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="h-3 w-3" /><span>{passwordError}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setStep('email')} disabled={isLoading}>
                <ArrowLeft className="h-4 w-4 mr-2" />Back
              </Button>
              <Button type="submit" className="flex-1 bg-gradient-to-r from-primary to-primary/80" disabled={isLoading}>
                {isLoading ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Resetting...</>) : 'Reset Password'}
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSendOtp} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email" className="text-sm font-medium">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="Enter your email address"
                  className={cn("pl-10 h-12 border-2 transition-colors", emailError ? "border-red-500 focus:border-red-500" : "focus:border-primary")}
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(''); }}
                  disabled={isLoading}
                  autoComplete="email"
                  autoFocus
                />
              </div>
              {emailError && (
                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="h-3 w-3" /><span>{emailError}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => handleOpenChange(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-gradient-to-r from-primary to-primary/80" disabled={isLoading}>
                {isLoading ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending...</>) : (<><Mail className="h-4 w-4 mr-2" />Send Reset Code</>)}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
