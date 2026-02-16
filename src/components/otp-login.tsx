'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Phone,
  Mail,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type OTPChannel = 'whatsapp' | 'sms' | 'email';
type Step = 'input' | 'otp' | 'name' | 'success';

interface OTPLoginProps {
  defaultChannel?: OTPChannel;
  returnUrl?: string;
  onSuccess?: () => void;
}

// Common country codes
const COUNTRY_CODES = [
  { code: '+91', country: 'IN', flag: '🇮🇳' },
  { code: '+1', country: 'US', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+61', country: 'AU', flag: '🇦🇺' },
  { code: '+971', country: 'AE', flag: '🇦🇪' },
  { code: '+65', country: 'SG', flag: '🇸🇬' },
  { code: '+49', country: 'DE', flag: '🇩🇪' },
  { code: '+33', country: 'FR', flag: '🇫🇷' },
  { code: '+81', country: 'JP', flag: '🇯🇵' },
];

export function OTPLogin({ defaultChannel = 'email', returnUrl = '/dashboard', onSuccess }: OTPLoginProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('input');
  const [channel, setChannel] = useState<OTPChannel>(defaultChannel);
  const [destination, setDestination] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-focus input on step change
  useEffect(() => {
    if (step === 'input') inputRef.current?.focus();
    if (step === 'otp') otpRefs.current[0]?.focus();
  }, [step]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      cooldownTimerRef.current = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    };
  }, [cooldown]);

  const getFullDestination = useCallback(() => {
    if (channel === 'email') return destination;
    return `${countryCode}${destination.replace(/\D/g, '')}`;
  }, [channel, countryCode, destination]);

  // ============ Send OTP ============
  const handleSendOTP = async () => {
    setError('');
    const fullDest = getFullDestination();

    // Basic validation
    if (channel === 'email') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(destination)) {
        setError('Please enter a valid email address');
        return;
      }
    } else {
      const phoneDigits = destination.replace(/\D/g, '');
      if (phoneDigits.length < 7 || phoneDigits.length > 15) {
        setError('Please enter a valid phone number');
        return;
      }
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: fullDest,
          channel,
          purpose: 'login',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429 && data.retryAfter) {
          setCooldown(data.retryAfter);
        }
        setError(data.error || 'Failed to send verification code');
        return;
      }

      toast.success(data.message || 'Verification code sent!');
      setCooldown(60);
      setStep('otp');
      setAttemptsRemaining(null);
    } catch {
      setError('Failed to send verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ============ OTP Input Handling ============
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...otpDigits];

    if (value.length > 1) {
      // Paste handling
      const chars = value.slice(0, 6).split('');
      chars.forEach((char, i) => {
        if (index + i < 6) newDigits[index + i] = char;
      });
      setOtpDigits(newDigits);
      const nextIndex = Math.min(index + chars.length, 5);
      otpRefs.current[nextIndex]?.focus();

      // Auto-submit if all filled
      if (newDigits.every((d) => d !== '')) {
        handleVerifyOTP(newDigits.join(''));
      }
      return;
    }

    newDigits[index] = value;
    setOtpDigits(newDigits);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (value && newDigits.every((d) => d !== '')) {
      handleVerifyOTP(newDigits.join(''));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // ============ Verify OTP ============
  const handleVerifyOTP = async (code?: string) => {
    setError('');
    const otpCode = code || otpDigits.join('');
    const fullDest = getFullDestination();

    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: fullDest,
          code: otpCode,
          channel,
          purpose: 'login',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setAttemptsRemaining(data.attemptsRemaining ?? null);
        setError(data.error || 'Invalid verification code');
        setOtpDigits(['', '', '', '', '', '']);
        otpRefs.current[0]?.focus();
        return;
      }

      // Check if new user needs to enter name
      if (data.user?.isNewUser) {
        setStep('name');
        return;
      }

      toast.success('Login successful!');
      // Notify auth context of successful OTP login
      window.dispatchEvent(new CustomEvent('auth-success', { detail: { user: data.user } }));
      setStep('success');
      setTimeout(() => { onSuccess?.(); router.replace(returnUrl); }, 500);
    } catch {
      setError('Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ============ Update Name ============
  const handleUpdateName = async () => {
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!response.ok) {
        // Non-critical error — let user proceed
        console.warn('Failed to update name');
      }

      toast.success('Welcome to ResumeBuddy!');
      // Notify auth context of successful OTP login (new user)
      window.dispatchEvent(new CustomEvent('auth-success', {}));
      setStep('success');
      setTimeout(() => { onSuccess?.(); router.replace(returnUrl); }, 500);
    } catch {
      // Still redirect on error
      onSuccess?.();
      router.replace(returnUrl);
    } finally {
      setIsLoading(false);
    }
  };

  // ============ Resend OTP ============
  const handleResend = async () => {
    setOtpDigits(['', '', '', '', '', '']);
    setError('');
    setAttemptsRemaining(null);
    await handleSendOTP();
  };

  // ============ Render ============
  return (
    <div className="space-y-4">
      {/* Channel Selector (only on input step) */}
      {step === 'input' && (
        <>
          <div className="flex gap-2 p-1 bg-muted rounded-lg">
            <button
              type="button"
              onClick={() => { setChannel('email'); setDestination(''); setError(''); }}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm font-medium transition-all',
                channel === 'email'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Mail className="h-3.5 w-3.5" />
              Email
            </button>
            <button
              type="button"
              onClick={() => { setChannel('whatsapp'); setDestination(''); setError(''); }}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm font-medium transition-all',
                channel === 'whatsapp'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              WhatsApp
            </button>
            <button
              type="button"
              onClick={() => { setChannel('sms'); setDestination(''); setError(''); }}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm font-medium transition-all',
                channel === 'sms'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Phone className="h-3.5 w-3.5" />
              SMS
            </button>
          </div>

          {/* Destination Input */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {channel === 'email' ? 'Email Address' : 'Phone Number'}
            </Label>
            <div className="flex gap-2">
              {channel !== 'email' && (
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-[100px] h-11 rounded-lg border border-border bg-background px-2 text-sm"
                >
                  {COUNTRY_CODES.map((cc) => (
                    <option key={cc.code} value={cc.code}>
                      {cc.flag} {cc.code}
                    </option>
                  ))}
                </select>
              )}
              <Input
                ref={inputRef}
                type={channel === 'email' ? 'email' : 'tel'}
                value={destination}
                onChange={(e) => { setDestination(e.target.value); setError(''); }}
                placeholder={channel === 'email' ? 'you@example.com' : '9876543210'}
                className="h-11"
                onKeyDown={(e) => e.key === 'Enter' && handleSendOTP()}
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Send Button */}
          <Button
            className="w-full h-11"
            onClick={handleSendOTP}
            disabled={isLoading || !destination}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <ArrowRight className="h-4 w-4 mr-2" />
            )}
            {isLoading ? 'Sending...' : 'Send Verification Code'}
          </Button>
        </>
      )}

      {/* OTP Input Step */}
      {step === 'otp' && (
        <>
          <button
            type="button"
            onClick={() => { setStep('input'); setOtpDigits(['', '', '', '', '', '']); setError(''); }}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>

          <div className="text-center space-y-1">
            <p className="text-sm text-muted-foreground">
              Enter the 6-digit code sent to your{' '}
              {channel === 'email' ? 'email' : channel === 'whatsapp' ? 'WhatsApp' : 'phone'}
            </p>
          </div>

          {/* OTP Digit Inputs */}
          <div className="flex gap-2 justify-center">
            {otpDigits.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => { otpRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                className={cn(
                  'w-11 h-13 text-center text-lg font-semibold rounded-lg',
                  digit && 'border-primary/50 bg-primary/5'
                )}
              />
            ))}
          </div>

          {/* Attempts remaining */}
          {attemptsRemaining !== null && attemptsRemaining > 0 && (
            <p className="text-sm text-amber-600 text-center">
              {attemptsRemaining} attempt{attemptsRemaining > 1 ? 's' : ''} remaining
            </p>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Verify Button */}
          <Button
            className="w-full h-11"
            onClick={() => handleVerifyOTP()}
            disabled={isLoading || otpDigits.some((d) => !d)}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            )}
            {isLoading ? 'Verifying...' : 'Verify Code'}
          </Button>

          {/* Resend */}
          <div className="text-center">
            {cooldown > 0 ? (
              <p className="text-sm text-muted-foreground">
                Resend code in <span className="font-medium text-foreground">{cooldown}s</span>
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={isLoading}
                className="text-sm text-primary hover:underline font-medium"
              >
                Resend verification code
              </button>
            )}
          </div>
        </>
      )}

      {/* Name Input Step */}
      {step === 'name' && (
        <>
          <div className="text-center space-y-1">
            <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto" />
            <h3 className="text-lg font-semibold">Welcome!</h3>
            <p className="text-sm text-muted-foreground">
              What should we call you?
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Your Name</Label>
            <Input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              placeholder="John Doe"
              className="h-11"
              onKeyDown={(e) => e.key === 'Enter' && handleUpdateName()}
              autoFocus
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <Button
            className="w-full h-11"
            onClick={handleUpdateName}
            disabled={isLoading || !name.trim()}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <ArrowRight className="h-4 w-4 mr-2" />
            )}
            {isLoading ? 'Saving...' : 'Continue'}
          </Button>

          <button
            type="button"
            onClick={() => { setStep('success'); onSuccess?.(); router.replace(returnUrl); }}
            className="w-full text-sm text-muted-foreground hover:text-foreground text-center"
          >
            Skip for now
          </button>
        </>
      )}

      {/* Success Step */}
      {step === 'success' && (
        <div className="text-center space-y-3 py-4">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
          <h3 className="text-lg font-semibold">Login Successful!</h3>
          <p className="text-sm text-muted-foreground">Redirecting to dashboard...</p>
          <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" />
        </div>
      )}
    </div>
  );
}
