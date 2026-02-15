'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Eye, EyeOff, Loader2, AlertCircle, Shield } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { User } from 'firebase/auth';
import { PasswordInput } from '@/components/ui/password-input';
import { validatePassword, validatePasswordMatch, type PasswordValidationResult } from '@/lib/password-validation';
import { withSecurePasswordHandling, clearSensitiveData, secureLog } from '@/lib/auth-security';

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password confirmation is required'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

interface ChangePasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

export function ChangePasswordDialog({ isOpen, onClose, user }: ChangePasswordDialogProps) {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPasswordValidation, setNewPasswordValidation] = useState<PasswordValidationResult | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string>('');

  const form = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const reauthenticateUser = withSecurePasswordHandling(async (currentPassword: string) => {
    if (!user?.email) throw new Error('No user email found');
    
    secureLog('Starting reauthentication process', { email: user.email });
    
    // Firebase Auth handles secure credential creation and transmission
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    
    secureLog('Reauthentication successful');
  });

  const onSubmit = async (values: z.infer<typeof passwordFormSchema>) => {
    // Validate new password strength
    if (!newPasswordValidation?.isValid) {
      toast.error('Please choose a stronger password that meets all requirements.');
      return;
    }

    // Validate password confirmation
    const passwordMatch = validatePasswordMatch(values.newPassword, values.confirmPassword);
    if (!passwordMatch.isValid) {
      setConfirmPasswordError(passwordMatch.error || "Passwords don't match");
      return;
    }

    setIsChangingPassword(true);

    const promise = withSecurePasswordHandling(async () => {
      secureLog('Starting password change process');
      
      // Step 1: Reauthenticate user before changing password (security requirement)
      await reauthenticateUser(values.currentPassword);
      
      // Step 2: Update password - Firebase Auth handles:
      // - HTTPS/TLS encryption during transmission
      // - Secure server-side bcrypt hashing with salt
      // - No plain text storage
      await updatePassword(user, values.newPassword);
      
      secureLog('Password update completed successfully');
      
      // Clear form data from memory for additional security
      clearSensitiveData(values);
      
      return "Password updated successfully!";
    });

    toast.promise(promise(), {
      loading: 'Updating password...',
      success: (message) => {
        form.reset();
        setNewPasswordValidation(null);
        setConfirmPasswordError('');
        onClose();
        return message;
      },
      error: (error) => {
        if (error.code === 'auth/wrong-password') {
          return 'Incorrect current password';
        } else if (error.code === 'auth/weak-password') {
          return 'Password is too weak. Please choose a stronger password.';
        } else if (error.code === 'auth/requires-recent-login') {
          return 'Please log in again before changing your password for security.';
        }
        return 'Failed to update password. Please try again.';
      },
      finally: () => setIsChangingPassword(false),
    });
  };

  const handleClose = () => {
    // Clear form data and reset validation states
    const formValues = form.getValues();
    clearSensitiveData(formValues);
    form.reset();
    setNewPasswordValidation(null);
    setConfirmPasswordError('');
    onClose();
  };

  // Auto-clear sensitive data from memory after timeout
  useEffect(() => {
    const timeout = setTimeout(() => {
      const formValues = form.getValues();
      if (formValues.currentPassword || formValues.newPassword || formValues.confirmPassword) {
        clearSensitiveData(formValues);
        form.reset();
      }
    }, 30000); // Clear after 30 seconds of inactivity

    return () => clearTimeout(timeout);
  }, [form]);

  // Handle confirm password validation
  const handleConfirmPasswordChange = (value: string) => {
    const newPassword = form.getValues('newPassword');
    if (value && newPassword) {
      const passwordMatch = validatePasswordMatch(newPassword, value);
      setConfirmPasswordError(passwordMatch.isValid ? '' : (passwordMatch.error || "Passwords don't match"));
    } else {
      setConfirmPasswordError('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-[600px] lg:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Lock className="h-4 w-4 sm:h-5 sm:w-5" />
            Change Password
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Enter your current password and choose a new password.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
            {/* Row 1: Current Password (Full Width) */}
            <div>
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="currentPassword" className="text-sm font-medium mb-2 block">
                      Current Password
                    </Label>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type={showCurrentPassword ? "text" : "password"}
                          placeholder="Enter current password" 
                          className="pl-8 sm:pl-10 pr-10 sm:pr-12 h-10 sm:h-12 border-2 focus:border-blue-500 transition-colors text-sm"
                          {...field}
                        />
                        <div className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2">
                          <Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0.5 sm:right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 sm:h-10 sm:w-10 hover:bg-transparent p-0"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground hover:text-foreground" />
                          ) : (
                            <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground hover:text-foreground" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 2: New Password Fields (Side by Side) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* New Password with Compact Validation */}
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <PasswordInput
                        label="New Password"
                        placeholder="Enter new password"
                        showStrengthMeter={true}
                        showCriteria={false}
                        onValidationChange={setNewPasswordValidation}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Confirm Password */}
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <PasswordInput
                        label="Confirm New Password"
                        placeholder="Confirm new password"
                        showStrengthMeter={false}
                        showCriteria={false}
                        error={confirmPasswordError}
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          handleConfirmPasswordChange(e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Password Requirements (Compact Display) */}
            {newPasswordValidation && !newPasswordValidation.isValid && (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 sm:p-4 border">
                <h4 className="text-xs sm:text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Password Requirements:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 text-xs">
                  <div className={`flex items-center gap-1 ${newPasswordValidation.criteria.minLength ? 'text-green-600' : 'text-red-500'}`}>
                    {newPasswordValidation.criteria.minLength ? '✓' : '✗'} At least 6 characters
                  </div>
                  <div className={`flex items-center gap-1 ${newPasswordValidation.criteria.hasUppercase ? 'text-green-600' : 'text-red-500'}`}>
                    {newPasswordValidation.criteria.hasUppercase ? '✓' : '✗'} Uppercase letter
                  </div>
                  <div className={`flex items-center gap-1 ${newPasswordValidation.criteria.hasLowercase ? 'text-green-600' : 'text-red-500'}`}>
                    {newPasswordValidation.criteria.hasLowercase ? '✓' : '✗'} Lowercase letter
                  </div>
                  <div className={`flex items-center gap-1 ${newPasswordValidation.criteria.hasNumber ? 'text-green-600' : 'text-red-500'}`}>
                    {newPasswordValidation.criteria.hasNumber ? '✓' : '✗'} Number
                  </div>
                  <div className={`flex items-center gap-1 ${newPasswordValidation.criteria.hasSpecialChar ? 'text-green-600' : 'text-red-500'}`}>
                    {newPasswordValidation.criteria.hasSpecialChar ? '✓' : '✗'} Special character
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Security Notice */}
            <div className="flex items-start gap-2 p-2.5 sm:p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-200">
                Re-authentication required for additional security protection.
              </p>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                disabled={isChangingPassword}
                className="w-full sm:w-auto text-sm h-9 sm:h-10"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isChangingPassword || !newPasswordValidation?.isValid || !!confirmPasswordError}
                className="w-full sm:w-auto text-sm h-9 sm:h-10"
              >
                {isChangingPassword && (
                  <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 animate-spin" />
                )}
                <Lock className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Update Password
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}