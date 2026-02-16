'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Mail, Lock, Eye, EyeOff, Sparkles, ArrowRight, AlertCircle, Loader2, Smartphone } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';
import { secureLog } from '@/lib/auth-security';
import { usePageTitle } from '@/hooks/use-page-title';
import { useSearchParams } from 'next/navigation';
import { ForgotPasswordDialog } from '@/components/forgot-password-dialog';
import { OTPLogin } from '@/components/otp-login';

type LoginMethod = 'password' | 'otp';

export default function LoginPage() {
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
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

  // Set page title
  usePageTitle('Login');

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!authLoading && user) {
      router.replace(getReturnUrl());
    }
  }, [user, authLoading, router]);

  // Auto-focus email input on mount
  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  // Auto-clear password from memory after timeout
  useEffect(() => {
    if (password) {
      const timeout = setTimeout(() => {
        setPassword('');
        setPasswordError('');
      }, 300000);
      return () => clearTimeout(timeout);
    }
  }, [password]);

  // Validation functions
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'Email is required';
    if (!emailRegex.test(email)) return 'Please enter a valid email';
    return '';
  };

  const validateLoginPassword = (password: string) => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    return '';
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailValidationError = validateEmail(email);
    const passwordValidationError = validateLoginPassword(password);
    
    setEmailError(emailValidationError);
    setPasswordError(passwordValidationError);
    
    if (emailValidationError || passwordValidationError) return;

    setIsLoading(true);
    
    try {
      secureLog('Starting secure login process', { email });
      
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMessage = data.error || 'Failed to log in. Please try again.';
        
        if (res.status === 401) {
          setPasswordError('Invalid email or password');
        } else if (res.status === 403) {
          setEmailError('Account suspended');
        }
        
        toast.error(errorMessage);
        setIsLoading(false);
        return;
      }

      // Notify auth context of successful login
      window.dispatchEvent(new CustomEvent('auth-success', { detail: { user: data.user } }));
      
      secureLog('Login successful');
      setPassword('');
      toast.success('Welcome back!');
      // Brief delay to let auth context process the event before navigation
      await new Promise(resolve => setTimeout(resolve, 100));
      router.replace(getReturnUrl());
    } catch (error: unknown) {
      secureLog('Login failed', { error: String(error) });
      setPassword('');
      toast.error('Failed to log in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
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
        <div className="bg-card border border-border/50 rounded-2xl shadow-xl shadow-primary/5 p-6 sm:p-8 space-y-6">
          
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center p-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome Back</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Sign in to continue your resume journey
              </p>
            </div>
          </div>

          {/* Google Sign In */}
          <Button 
            variant="outline" 
            className="w-full h-11 relative overflow-hidden border-2 border-border hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 group"
            onClick={handleGoogleSignIn}
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
              <span className="font-medium">Continue with Google</span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-card text-muted-foreground">or continue with</span>
            </div>
          </div>

          {/* Login Method Tabs */}
          <div className="flex rounded-lg border border-border/80 bg-muted/30 p-1 gap-1">
            <button
              type="button"
              onClick={() => setLoginMethod('password')}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm font-medium transition-all duration-200",
                loginMethod === 'password'
                  ? "bg-background shadow-sm text-foreground border border-border/50"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Mail className="h-3.5 w-3.5" />
              Email
            </button>
            <button
              type="button"
              onClick={() => setLoginMethod('otp')}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm font-medium transition-all duration-200",
                loginMethod === 'otp'
                  ? "bg-background shadow-sm text-foreground border border-border/50"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Smartphone className="h-3.5 w-3.5" />
              OTP
            </button>
          </div>

          {/* Password Login Form */}
          {loginMethod === 'password' && (
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input
                  ref={emailRef}
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  className={cn(
                    "pl-10 h-11 text-base border-2 transition-all duration-200",
                    "focus:border-primary focus:ring-4 focus:ring-primary/10",
                    emailError && "border-destructive focus:border-destructive focus:ring-destructive/10 input-error"
                  )}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError('');
                  }}
                  aria-invalid={!!emailError}
                  aria-describedby={emailError ? "email-error" : undefined}
                />
              </div>
              {emailError && (
                <p id="email-error" role="alert" className="text-xs text-destructive flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" />
                  {emailError}
                </p>
              )}
            </div>
            
            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <button
                  type="button"
                  onClick={() => setForgotPasswordOpen(true)}
                  className="text-xs text-primary hover:text-primary/80 hover:underline underline-offset-4 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className={cn(
                    "pl-10 pr-10 h-11 text-base border-2 transition-all duration-200",
                    "focus:border-primary focus:ring-4 focus:ring-primary/10",
                    passwordError && "border-destructive focus:border-destructive focus:ring-destructive/10 input-error"
                  )}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError('');
                  }}
                  aria-invalid={!!passwordError}
                  aria-describedby={passwordError ? "password-error" : undefined}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordError && (
                <p id="password-error" role="alert" className="text-xs text-destructive flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" />
                  {passwordError}
                </p>
              )}
            </div>

            {/* Forgot Password Dialog */}
            <ForgotPasswordDialog
              open={forgotPasswordOpen}
              onOpenChange={setForgotPasswordOpen}
              defaultEmail={email}
            />

            {/* Submit Button */}
            <Button 
              type="submit"
              className={cn(
                "w-full h-11 relative overflow-hidden text-base font-medium",
                "bg-gradient-to-r from-primary to-primary/90",
                "hover:from-primary/90 hover:to-primary/80",
                "shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/25",
                "hover:-translate-y-0.5",
                "transition-all duration-300",
                "group"
              )}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign In
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              )}
            </Button>
          </form>
          )}

          {/* OTP Login */}
          {loginMethod === 'otp' && (
            <OTPLogin
              onSuccess={() => {
                toast.success('Welcome!');
                router.replace(getReturnUrl());
              }}
            />
          )}

          {/* Sign up link */}
          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link 
              href="/signup" 
              className="font-medium text-primary hover:text-primary/80 underline-offset-4 hover:underline transition-colors"
            >
              Sign up
            </Link>
          </p>

          {/* Security footer */}
          <p className="text-[11px] text-center text-muted-foreground/70 pt-2">
            🔒 Secured with enterprise-grade encryption
          </p>
        </div>
      </div>

      {/* Screen reader announcement */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {isLoading && <span>Signing you in...</span>}
      </div>
    </div>
  );
}
