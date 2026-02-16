'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Mail, Lock, Eye, EyeOff, User, Sparkles, ArrowRight, AlertCircle, Loader2, Check, X, HelpCircle } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';
import { secureLog } from '@/lib/auth-security';
import { usePageTitle } from '@/hooks/use-page-title';
import { useSearchParams } from 'next/navigation';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

// Simple inline password validation
interface PasswordStrength {
  score: number;
  label: string;
  color: string;
}

function getPasswordStrength(password: string): PasswordStrength {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { score, label: 'Weak', color: 'bg-destructive' };
  if (score <= 3) return { score, label: 'Medium', color: 'bg-yellow-500' };
  return { score, label: 'Strong', color: 'bg-success' };
}

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const nameRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, signInWithGoogle } = useAuth();

  // Get the return URL from query params
  const getReturnUrl = (): string => {
    const returnTo = searchParams?.get('returnTo');
    if (returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')) {
      return returnTo;
    }
    return '/dashboard';
  };

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!authLoading && user) {
      router.replace(getReturnUrl());
    }
  }, [user, authLoading, router]);

  // Set page title
  usePageTitle('Sign Up');

  // Auto-focus name input on mount
  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  // Auto-clear passwords from memory after timeout
  useEffect(() => {
    if (password || confirmPassword) {
      const timeout = setTimeout(() => {
        setPassword('');
        setConfirmPassword('');
        setConfirmPasswordError('');
      }, 300000);
      return () => clearTimeout(timeout);
    }
  }, [password, confirmPassword]);

  // Password criteria checks
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasUpperCase && hasLowerCase && hasNumber;
  const passwordStrength = getPasswordStrength(password);

  // Validation functions
  const validateName = (name: string) => {
    if (!name.trim()) return 'Full name is required';
    if (name.trim().length < 2) return 'Name must be at least 2 characters';
    if (name.trim().length > 50) return 'Name must be less than 50 characters';
    return '';
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'Email is required';
    if (!emailRegex.test(email)) return 'Please enter a valid email';
    return '';
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const nameValidationError = validateName(name);
    const emailValidationError = validateEmail(email);
    
    setNameError(nameValidationError);
    setEmailError(emailValidationError);
    
    if (nameValidationError || emailValidationError) return;

    if (!isPasswordValid) {
      setPasswordError('Password does not meet requirements');
      toast.error('Please choose a stronger password that meets all requirements.');
      return;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords don't match");
      toast.error("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      secureLog('Starting secure account creation', { email, name });
      
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, name: name.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMessage = data.error || 'Failed to create account.';

        if (res.status === 409) {
          setEmailError('An account with this email already exists');
        } else if (res.status === 400) {
          if (errorMessage.toLowerCase().includes('email')) {
            setEmailError(errorMessage);
          } else if (errorMessage.toLowerCase().includes('password')) {
            setPasswordError(errorMessage);
          }
        }

        toast.error(errorMessage);
        setIsLoading(false);
        return;
      }

      // Notify auth context of successful registration
      window.dispatchEvent(new CustomEvent('auth-success', { detail: { user: data.user } }));
      
      secureLog('Account creation successful');
      setPassword('');
      setConfirmPassword('');
      toast.success('Account created successfully! Welcome to ResumeBuddy!');
      // Brief delay to let auth context process the event before navigation
      await new Promise(resolve => setTimeout(resolve, 100));
      router.replace(getReturnUrl());
    } catch (error: unknown) {
      secureLog('Account creation failed', { error: String(error) });
      setPassword('');
      setConfirmPassword('');
      toast.error('Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      // Wait for auth state to settle and cookie to be set
      await new Promise(resolve => setTimeout(resolve, 800));
      // Use replace to avoid adding to browser history
      router.replace(getReturnUrl());
    } catch (error) {
      // Error handling is done in signInWithGoogle
      setIsLoading(false);
    }
    // Keep loading state until redirect completes
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/[0.03] dark:to-primary/[0.08] p-4">
      {/* Subtle background pattern */}
      <div className="fixed inset-0 bg-grid-pattern opacity-40 pointer-events-none" />
      
      <div className="w-full max-w-[400px] relative auth-card">
        {/* Card Container */}
        <div className="bg-card border border-border/50 rounded-2xl shadow-xl shadow-primary/5 p-6 sm:p-8 space-y-5">
          
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center p-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Create Account</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Start your resume journey today
              </p>
            </div>
          </div>

          {/* Google Sign Up */}
          <Button 
            variant="outline" 
            className="w-full h-11 relative overflow-hidden border-2 border-border hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 group"
            onClick={handleGoogleSignUp}
            disabled={isLoading}
            type="button"
          >
            <div className="flex items-center justify-center gap-3">
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="font-medium">Sign up with Google</span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-card text-muted-foreground">or create with email</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSignup} className="space-y-3">
            {/* Name */}
            <div className="space-y-1">
              <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
              <div className="relative group">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input
                  ref={nameRef}
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  autoComplete="name"
                  className={cn(
                    "pl-10 h-11 text-base border-2 transition-all duration-200",
                    "focus:border-primary focus:ring-4 focus:ring-primary/10",
                    nameError && "border-destructive focus:border-destructive focus:ring-destructive/10"
                  )}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (nameError) setNameError('');
                  }}
                  aria-invalid={!!nameError}
                />
              </div>
              {nameError && (
                <p role="alert" className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {nameError}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  className={cn(
                    "pl-10 h-11 text-base border-2 transition-all duration-200",
                    "focus:border-primary focus:ring-4 focus:ring-primary/10",
                    emailError && "border-destructive focus:border-destructive focus:ring-destructive/10"
                  )}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError('');
                  }}
                  aria-invalid={!!emailError}
                />
              </div>
              {emailError && (
                <p role="alert" className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {emailError}
                </p>
              )}
            </div>
            
            {/* Password with inline strength indicator */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
                      <HelpCircle className="h-3.5 w-3.5" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-3" side="top" align="end">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Password Requirements</p>
                      <div className="space-y-1.5 text-xs">
                        <div className={cn("flex items-center gap-2", hasMinLength ? "text-success" : "text-muted-foreground")}>
                          {hasMinLength ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                          At least 8 characters
                        </div>
                        <div className={cn("flex items-center gap-2", hasUpperCase ? "text-success" : "text-muted-foreground")}>
                          {hasUpperCase ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                          One uppercase letter
                        </div>
                        <div className={cn("flex items-center gap-2", hasLowerCase ? "text-success" : "text-muted-foreground")}>
                          {hasLowerCase ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                          One lowercase letter
                        </div>
                        <div className={cn("flex items-center gap-2", hasNumber ? "text-success" : "text-muted-foreground")}>
                          {hasNumber ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                          One number
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  autoComplete="new-password"
                  className={cn(
                    "pl-10 pr-10 h-11 text-base border-2 transition-all duration-200",
                    "focus:border-primary focus:ring-4 focus:ring-primary/10",
                    passwordError && "border-destructive focus:border-destructive focus:ring-destructive/10"
                  )}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError('');
                  }}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                {/* Inline strength bar */}
                {password && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-border rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full transition-all duration-300",
                        passwordStrength.color,
                        passwordStrength.score <= 2 && "w-1/3",
                        passwordStrength.score === 3 && "w-2/3",
                        passwordStrength.score >= 4 && "w-full"
                      )}
                    />
                  </div>
                )}
              </div>
              {password && (
                <p className={cn(
                  "text-xs",
                  passwordStrength.score <= 2 && "text-destructive",
                  passwordStrength.score === 3 && "text-yellow-600 dark:text-yellow-500",
                  passwordStrength.score >= 4 && "text-success"
                )}>
                  Password strength: {passwordStrength.label}
                </p>
              )}
              {passwordError && (
                <p role="alert" className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {passwordError}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  className={cn(
                    "pl-10 pr-10 h-11 text-base border-2 transition-all duration-200",
                    "focus:border-primary focus:ring-4 focus:ring-primary/10",
                    confirmPasswordError && "border-destructive focus:border-destructive focus:ring-destructive/10"
                  )}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (e.target.value && password && e.target.value !== password) {
                      setConfirmPasswordError("Passwords don't match");
                    } else {
                      setConfirmPasswordError('');
                    }
                  }}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmPasswordError && (
                <p role="alert" className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {confirmPasswordError}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button 
              type="submit"
              className={cn(
                "w-full h-11 relative overflow-hidden text-base font-medium mt-2",
                "bg-gradient-to-r from-primary to-primary/90",
                "hover:from-primary/90 hover:to-primary/80",
                "shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/25",
                "hover:-translate-y-0.5",
                "transition-all duration-300",
                "group"
              )}
              disabled={isLoading || !isPasswordValid || !!confirmPasswordError || !confirmPassword}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating Account...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Create Account
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              )}
            </Button>
          </form>

          {/* Login link */}
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link 
              href="/login" 
              className="font-medium text-primary hover:text-primary/80 underline-offset-4 hover:underline transition-colors"
            >
              Sign in
            </Link>
          </p>

          {/* Security footer */}
          <p className="text-[11px] text-center text-muted-foreground/70 pt-1">
            🔒 Secured with enterprise-grade encryption
          </p>
        </div>
      </div>

      {/* Screen reader announcement */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {isLoading && <span>Creating your account...</span>}
      </div>
    </div>
  );
}
