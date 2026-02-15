'use client';

import { useState, useRef, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

import { Trash2, Loader2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { uploadProfilePhoto, deleteProfilePhoto, checkSupabaseSetup } from '@/lib/supabase';
import { ImageEditor } from './image-editor';
import { updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { updateUserProfile } from '@/app/actions';

interface ProfilePhotoUploaderProps {
  userId: string;
  currentPhotoUrl?: string | null;
  userName?: string | null;
  onPhotoChange: (photoUrl: string | null) => void;
  disabled?: boolean;
}

export function ProfilePhotoUploader({
  userId,
  currentPhotoUrl,
  userName,
  onPhotoChange,
  disabled = false
}: ProfilePhotoUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleFileSelect = (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 10MB for editing)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB');
      return;
    }

    // Store the file and open editor
    setSelectedFile(file);
    setIsEditorOpen(true);
  };

  const handleDirectUpload = async (file: File) => {
    if (!file) return;

    setIsUploading(true);
    
    try {
      // Create preview
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);

      // Upload to Supabase
      const photoUrl = await uploadProfilePhoto(userId, file);
      
      // Update Firebase Auth profile
      const currentUser = auth.currentUser;
      if (currentUser) {
        await updateProfile(currentUser, {
          photoURL: photoUrl
        });
      }

      // Update profile in database
      const formData = new FormData();
      formData.append('photoURL', photoUrl);
      if (currentUser?.displayName) {
        formData.append('displayName', currentUser.displayName);
      }
      await updateUserProfile(userId, formData);
      
      // Call the parent component's handler to update UI
      onPhotoChange(photoUrl);
      
      toast.success('Profile photo updated successfully!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload photo. Please try again.';
      
      // Provide specific guidance for common errors
      if (errorMessage.includes('row-level security')) {
        toast.error('Storage permissions issue. Please check if you are signed in and try again.');
      } else if (errorMessage.includes('Bucket not found')) {
        toast.error('Storage bucket not found. Please create the "profile-photos" bucket in Supabase.');
      } else if (errorMessage.includes('JWT')) {
        toast.error('Authentication issue. Please sign out and sign back in.');
      } else {
        toast.error(errorMessage);
      }
      
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditorSave = async (editedFile: File) => {
    await handleDirectUpload(editedFile);
    setSelectedFile(null);
  };

  const handleEditorClose = () => {
    setIsEditorOpen(false);
    setSelectedFile(null);
  };

  const handleDeletePhoto = async () => {
    if (!currentPhotoUrl) return;

    setIsDeleting(true);
    
    try {
      const success = await deleteProfilePhoto(userId, currentPhotoUrl);
      
      if (success) {
        // Update Firebase Auth profile
        const currentUser = auth.currentUser;
        if (currentUser) {
          await updateProfile(currentUser, {
            photoURL: null
          });
        }

        // Update profile in database
        const formData = new FormData();
        formData.append('photoURL', '');
        if (currentUser?.displayName) {
          formData.append('displayName', currentUser.displayName);
        }
        await updateUserProfile(userId, formData);
        
        // Update UI
        onPhotoChange(null);
        setPreviewUrl(null);
        toast.success('Profile photo removed successfully!');
      } else {
        toast.error('Failed to remove photo. Please try again.');
      }
    } catch (error) {
      toast.error('Failed to remove photo. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };



  const displayPhotoUrl = previewUrl || currentPhotoUrl;

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-4">
        {/* Avatar Display with Hover Edit Icon */}
        <div className="relative group">
          <Avatar className="h-32 w-32 ring-2 ring-border cursor-pointer transition-all duration-200 group-hover:ring-4 group-hover:ring-primary/20">
            {displayPhotoUrl && <AvatarImage src={displayPhotoUrl} alt={userName || 'Profile'} />}
            <AvatarFallback className="text-3xl font-semibold">
              {getInitials(userName)}
            </AvatarFallback>
          </Avatar>

          {/* Hover Edit Icon */}
          <div 
            className={`absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 transition-opacity duration-200 ${
              disabled ? 'cursor-not-allowed' : 'cursor-pointer group-hover:opacity-100'
            }`}
            onClick={() => !disabled && fileInputRef.current?.click()}
          >
            {isUploading ? (
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            ) : (
              <Pencil className="w-8 h-8 text-white" />
            )}
          </div>

          {/* Loading overlay when uploading */}
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full">
              <div className="text-center text-white">
                <Loader2 className="w-8 h-8 mx-auto animate-spin mb-2" />
                <p className="text-sm">Uploading...</p>
              </div>
            </div>
          )}
        </div>

        {/* User Info and Actions */}
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Hover over photo to edit • JPG, PNG, GIF up to 10MB
          </p>
          
          {/* Remove button - only show if there's a photo */}
          {displayPhotoUrl && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDeletePhoto}
              disabled={disabled || isDeleting || isUploading}
              className="text-destructive hover:text-destructive-foreground hover:bg-destructive"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              {isDeleting ? 'Removing...' : 'Remove Photo'}
            </Button>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input 
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleFileSelect(file);
          }
        }}
        accept="image/*"
        disabled={disabled}
        className="hidden"
      />

      {/* Image Editor Modal */}
      <ImageEditor
        isOpen={isEditorOpen}
        onClose={handleEditorClose}
        imageFile={selectedFile}
        onSave={handleEditorSave}
      />
    </div>
  );
}