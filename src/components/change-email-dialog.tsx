'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { verifyBeforeUpdateEmail, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { User } from 'firebase/auth';

const emailFormSchema = z.object({
  newEmail: z.string().email('Please enter a valid email address'),
  currentPassword: z.string().min(1, 'Current password is required'),
});

interface ChangeEmailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

export function ChangeEmailDialog({ isOpen, onClose, user }: ChangeEmailDialogProps) {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [isChangingEmail, setIsChangingEmail] = useState(false);

  const form = useForm<z.infer<typeof emailFormSchema>>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      newEmail: '',
      currentPassword: '',
    },
  });

  const reauthenticateUser = async (currentPassword: string) => {
    if (!user?.email) throw new Error('No user email found');
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
  };

  const onSubmit = async (values: z.infer<typeof emailFormSchema>) => {
    setIsChangingEmail(true);

    const promise = async () => {
      // Step 1: Reauthenticate user before changing email
      await reauthenticateUser(values.currentPassword);
      
      // Step 2: Send verification email to new address before updating
      await verifyBeforeUpdateEmail(user, values.newEmail);
      
      return "Verification email sent! Please check your new email address and click the verification link to complete the email change.";
    };

    toast.promise(promise(), {
      loading: 'Sending verification email...',
      success: (message) => {
        form.reset();
        onClose();
        return message;
      },
      error: (error) => {
        console.error('Email update error:', error);
        if (error.code === 'auth/wrong-password') {
          return 'Incorrect current password';
        } else if (error.code === 'auth/email-already-in-use') {
          return 'This email is already in use by another account';
        } else if (error.code === 'auth/invalid-email') {
          return 'Invalid email address';
        } else if (error.code === 'auth/requires-recent-login') {
          return 'Please log out and log back in before changing your email';
        } else if (error.code === 'auth/operation-not-allowed') {
          return 'Email verification is required. Please check your email and verify before updating.';
        }
        return 'Failed to send verification email. Please try again.';
      },
      finally: () => setIsChangingEmail(false),
    });
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Change Email Address
          </DialogTitle>
          <DialogDescription>
            Enter your new email address and current password to update your email.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="newEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Email Address</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="Enter new email address" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        type={showCurrentPassword ? "text" : "password"}
                        placeholder="Enter current password" 
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="text-sm bg-muted p-4 rounded-lg">
              <strong>Email Change Process:</strong><br/>
              <div className="mt-2 space-y-1 text-muted-foreground text-xs">
                <div>1. Enter your new email and current password</div>
                <div>2. Click "Send Verification Email"</div>
                <div>3. Check your new email for a verification link</div>
                <div>4. Click the verification link to complete the change</div>
              </div>
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                disabled={isChangingEmail}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isChangingEmail}
              >
                {isChangingEmail && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                <Mail className="mr-2 h-4 w-4" />
                Send Verification Email
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}