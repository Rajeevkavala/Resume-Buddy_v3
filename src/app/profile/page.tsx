
'use client';

import { useAuth } from '@/context/auth-context';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, Mail, Lock, RefreshCw, CheckCircle, Shield, Edit, X, User, Loader2, AlertCircle, KeyRound } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { ProfilePhotoUploader } from '@/components/profile-photo-uploader';
import { ChangeEmailDialog } from '@/components/change-email-dialog';
import { ChangePasswordDialog } from '@/components/change-password-dialog';
import { usePageTitle } from '@/hooks/use-page-title';

const profileFormSchema = z.object({
  displayName: z.string().min(2, {
    message: 'Display name must be at least 2 characters.',
  }).max(50, {
    message: 'Display name must not be longer than 50 characters.',
  }),
});



export default function ProfilePage() {
  const { user, loading: authLoading, forceReloadUser } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string | null>(null);
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isChangeEmailDialogOpen, setIsChangeEmailDialogOpen] = useState(false);
  const [isChangePasswordDialogOpen, setIsChangePasswordDialogOpen] = useState(false);
  const [showVerificationInput, setShowVerificationInput] = useState(false);
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const verificationRefs = useRef<(HTMLInputElement | null)[]>([]);

  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: '',
    },
  });

  // Set page title
  usePageTitle('Profile Settings');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
    if (user) {
      form.reset({
        displayName: user.displayName || '',
      });
      setCurrentPhotoUrl(user.photoURL || null);
    }
  }, [user, authLoading, router, form]);

  const handlePhotoChange = async (photoUrl: string | null) => {
    setCurrentPhotoUrl(photoUrl);
    // Force a reload of the user object from Firebase to get the new data
    await forceReloadUser?.();
  };

  const sendCurrentEmailVerification = async () => {
    if (!user) return;
    setIsSendingVerification(true);

    const promise = async () => {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send verification email');
      setShowVerificationInput(true);
      setVerificationCode(['', '', '', '', '', '']);
      // Focus the first input after render
      setTimeout(() => verificationRefs.current[0]?.focus(), 100);
      return 'Verification code sent to your email!';
    };

    toast.promise(promise(), {
      loading: 'Sending verification email...',
      success: (message) => message,
      error: (error) => {
        console.error('Verification email error:', error);
        return error?.message || 'Failed to send verification email. Please try again.';
      },
      finally: () => setIsSendingVerification(false),
    });
  };

  const handleVerificationCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...verificationCode];
    if (value.length > 1) {
      // Handle paste
      const chars = value.slice(0, 6).split('');
      chars.forEach((char, i) => {
        if (index + i < 6) newCode[index + i] = char;
      });
      setVerificationCode(newCode);
      const nextIndex = Math.min(index + chars.length, 5);
      verificationRefs.current[nextIndex]?.focus();
      if (newCode.every(d => d !== '')) {
        submitVerificationCode(newCode.join(''));
      }
      return;
    }
    newCode[index] = value;
    setVerificationCode(newCode);
    if (value && index < 5) {
      verificationRefs.current[index + 1]?.focus();
    }
    if (value && newCode.every(d => d !== '')) {
      submitVerificationCode(newCode.join(''));
    }
  };

  const handleVerificationKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      verificationRefs.current[index - 1]?.focus();
    }
  };

  const submitVerificationCode = async (code?: string) => {
    const otpCode = code || verificationCode.join('');
    if (otpCode.length !== 6) {
      toast.error('Please enter the complete 6-digit code');
      return;
    }
    setIsVerifying(true);
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Invalid verification code');
        setVerificationCode(['', '', '', '', '', '']);
        verificationRefs.current[0]?.focus();
        return;
      }
      toast.success('Email verified successfully!');
      setShowVerificationInput(false);
      await forceReloadUser?.();
    } catch {
      toast.error('Failed to verify email. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };
  
  const onSubmit = async (values: z.infer<typeof profileFormSchema>) => {
    if (!user) return;
    setIsSubmitting(true);

    const promise = fetch('/api/auth/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        name: values.displayName,
      }),
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');
      
      // Force a reload of the user from session
      await forceReloadUser?.();
      return 'Profile updated successfully!';
    });

    toast.promise(promise, {
        loading: 'Updating profile...',
        success: (message) => message,
        error: 'Failed to update profile.',
        finally: () => setIsSubmitting(false),
    });
  };

  const handleSaveAllChanges = async () => {
    if (!user) return;
    
    // Get current form values
    const displayNameValue = form.getValues('displayName');
    
    // Validate display name form
    const isDisplayNameValid = await form.trigger();
    
    if (isDisplayNameValid) {
      await onSubmit({ displayName: displayNameValue });
      setIsEditMode(false);
    }
  };

  const handleEditModeToggle = () => {
    if (isEditMode) {
      // Cancel edit mode - reset form to original values
      form.reset({
        displayName: user?.displayName || '',
      });
      setIsEditMode(false);
    } else {
      setIsEditMode(true);
    }
  };

  // Show skeleton while loading instead of blocking
  const showSkeleton = authLoading || !user;

  return (
    <div className="flex-1 min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {showSkeleton ? (
          <div className="space-y-4 sm:space-y-6">
            {/* Page Header Skeleton */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="space-y-2">
                <div className="h-8 bg-muted animate-pulse rounded w-48" />
                <div className="h-4 bg-muted animate-pulse rounded w-64" />
              </div>
              <div className="h-10 bg-muted animate-pulse rounded w-28" />
            </div>
            
            {/* Profile Card Skeleton */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                  <div className="h-24 w-24 sm:h-32 sm:w-32 bg-muted animate-pulse rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-3 text-center sm:text-left w-full">
                    <div className="h-6 bg-muted animate-pulse rounded w-40 mx-auto sm:mx-0" />
                    <div className="h-4 bg-muted animate-pulse rounded w-48 mx-auto sm:mx-0" />
                    <div className="h-6 bg-muted animate-pulse rounded w-24 mx-auto sm:mx-0" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Settings Card Skeleton */}
            <Card>
              <CardHeader>
                <div className="h-6 bg-muted animate-pulse rounded w-32" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="h-4 bg-muted animate-pulse rounded w-24" />
                  <div className="h-10 bg-muted animate-pulse rounded" />
                </div>
              </CardContent>
            </Card>
            
            {/* Security Card Skeleton */}
            <Card>
              <CardHeader>
                <div className="h-6 bg-muted animate-pulse rounded w-24" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="h-16 bg-muted animate-pulse rounded" />
                  <div className="h-16 bg-muted animate-pulse rounded" />
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {/* Page Header - Outside card for cleaner look */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
              <div>
                <h1 className="text-2xl sm:text-3xl font-headline font-semibold text-foreground">
                  Profile Settings
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-1">
                  Manage your account information
                </p>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2">
                {isEditMode ? (
                  <>
                    <Button
                      onClick={handleSaveAllChanges}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleEditModeToggle}
                      disabled={isSubmitting}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    onClick={handleEditModeToggle}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                )}
              </div>
            </div>
            
            {/* Profile Overview Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                  {/* Profile Photo */}
                  <div className="flex-shrink-0">
                    <ProfilePhotoUploader
                      userId={user.uid}
                      currentPhotoUrl={currentPhotoUrl}
                      userName={user.displayName}
                      onPhotoChange={handlePhotoChange}
                      disabled={isSubmitting || !isEditMode}
                    />
                  </div>
                  
                  {/* Basic Info */}
                  <div className="flex-1 text-center sm:text-left">
                    <h2 className="text-xl font-headline font-semibold">
                      {user.displayName || 'Anonymous User'}
                    </h2>
                    
                    <div className="flex items-center justify-center sm:justify-start gap-2 mt-2 text-muted-foreground">
                      <Mail className="h-4 w-4 flex-shrink-0" />
                      <span className="text-sm truncate">{user.email}</span>
                    </div>
                    
                    {/* Verification Badge - Using CSS variables */}
                    <div className="mt-3">
                      {user.emailVerified ? (
                        <Badge 
                          variant="outline" 
                          className="border-success/50 text-success bg-success/5"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Email Verified
                        </Badge>
                      ) : (
                        <Badge 
                          variant="outline" 
                          className="border-destructive/50 text-destructive bg-destructive/5"
                        >
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Verification Pending
                        </Badge>
                      )}
                    </div>
                    
                    {/* Verify Email Button - Only if not verified */}
                    {!user.emailVerified && (
                      <div className="mt-3 space-y-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={sendCurrentEmailVerification}
                          disabled={isSendingVerification || isVerifying}
                        >
                          {isSendingVerification ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <Mail className="h-4 w-4 mr-2" />
                          )}
                          {showVerificationInput ? 'Resend Code' : 'Send Verification Email'}
                        </Button>

                        {/* OTP Input for Email Verification */}
                        {showVerificationInput && (
                          <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <KeyRound className="h-4 w-4" />
                              <span>Enter the 6-digit code sent to your email</span>
                            </div>
                            <div className="flex gap-2 justify-center">
                              {verificationCode.map((digit, index) => (
                                <Input
                                  key={index}
                                  ref={(el) => { verificationRefs.current[index] = el; }}
                                  type="text"
                                  inputMode="numeric"
                                  maxLength={6}
                                  value={digit}
                                  onChange={(e) => handleVerificationCodeChange(index, e.target.value)}
                                  onKeyDown={(e) => handleVerificationKeyDown(index, e)}
                                  disabled={isVerifying}
                                  className="w-11 h-12 text-center text-lg font-semibold rounded-lg"
                                />
                              ))}
                            </div>
                            <Button
                              size="sm"
                              className="w-full"
                              onClick={() => submitVerificationCode()}
                              disabled={isVerifying || verificationCode.some(d => !d)}
                            >
                              {isVerifying ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              ) : (
                                <CheckCircle className="h-4 w-4 mr-2" />
                              )}
                              {isVerifying ? 'Verifying...' : 'Verify Email'}
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Account Settings Card */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-headline flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Account Details
                </CardTitle>
                <CardDescription className="text-sm">
                  Update your display name
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <Form {...form}>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="displayName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            Display Name
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter your name" 
                              readOnly={!isEditMode}
                              className={!isEditMode ? "bg-muted cursor-default transition-colors" : "transition-colors"}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </Form>
              </CardContent>
            </Card>
            
            {/* Security Settings Card */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-headline flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Security
                </CardTitle>
                <CardDescription className="text-sm">
                  Manage your email and password
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Change Email Button */}
                  <Button
                    variant="outline"
                    className="h-auto min-h-[64px] p-4 justify-start"
                    onClick={() => setIsChangeEmailDialogOpen(true)}
                  >
                    <div className="flex items-start gap-3 text-left">
                      <div className="p-2 rounded-lg bg-muted flex-shrink-0">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <span className="font-medium block">Change Email</span>
                        <span className="text-xs text-muted-foreground mt-0.5 block">
                          Update your email address
                        </span>
                      </div>
                    </div>
                  </Button>

                  {/* Change Password Button */}
                  <Button
                    variant="outline"
                    className="h-auto min-h-[64px] p-4 justify-start"
                    onClick={() => setIsChangePasswordDialogOpen(true)}
                  >
                    <div className="flex items-start gap-3 text-left">
                      <div className="p-2 rounded-lg bg-muted flex-shrink-0">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <span className="font-medium block">Change Password</span>
                        <span className="text-xs text-muted-foreground mt-0.5 block">
                          Update your password
                        </span>
                      </div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Change Email Dialog */}
        {user && (
          <ChangeEmailDialog
            isOpen={isChangeEmailDialogOpen}
            onClose={() => setIsChangeEmailDialogOpen(false)}
            user={user}
          />
        )}

        {/* Change Password Dialog */}
        {user && (
          <ChangePasswordDialog
            isOpen={isChangePasswordDialogOpen}
            onClose={() => setIsChangePasswordDialogOpen(false)}
            user={user}
          />
        )}
      </div>
    </div>
  );
}
