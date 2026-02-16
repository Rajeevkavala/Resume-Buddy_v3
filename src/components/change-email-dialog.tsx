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

const emailFormSchema = z.object({
  newEmail: z.string().email('Please enter a valid email address'),
  currentPassword: z.string().min(1, 'Current password is required'),
});

interface ChangeEmailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: { id?: string; uid?: string; email?: string | null };
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

  const onSubmit = async (values: z.infer<typeof emailFormSchema>) => {
    setIsChangingEmail(true);

    const promise = async () => {
      const res = await fetch('/api/auth/email/change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          newEmail: values.newEmail,
          currentPassword: values.currentPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const error = new Error(data.error || 'Failed to change email');
        (error as any).status = res.status;
        throw error;
      }
      
      return 'Email address updated successfully!';
    };

    toast.promise(promise(), {
      loading: 'Updating email address...',
      success: (message) => {
        form.reset();
        onClose();
        return message;
      },
      error: (error: any) => {
        console.error('Email update error:', error);
        if (error.status === 401) {
          return 'Incorrect current password';
        } else if (error.status === 409) {
          return 'This email is already in use by another account';
        } else if (error.status === 400) {
          return error.message || 'Invalid email address';
        }
        return 'Failed to update email. Please try again.';
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
              <strong>Note:</strong>
              <p className="mt-1 text-muted-foreground text-xs">
                Your email will be updated immediately after verification. You will use the new email to sign in.
              </p>
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
                Update Email
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}