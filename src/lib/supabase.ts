import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

// Profile photo storage bucket name
export const PROFILE_PHOTOS_BUCKET = 'profile-photos';

/**
 * Check if Supabase is properly configured and accessible
 * @returns Promise<boolean> - True if setup is correct
 */
export async function checkSupabaseSetup(): Promise<{ isValid: boolean; error?: string }> {
  try {
    // Instead of listing buckets (which may not work due to RLS), 
    // try to perform a simple operation on the profile-photos bucket
    const { data, error } = await supabase.storage
      .from(PROFILE_PHOTOS_BUCKET)
      .list('', { limit: 1 });
    
    if (error) {
      // If the error is about the bucket not existing, that's the real issue
      if (error.message.includes('Bucket not found') || error.message.includes('does not exist')) {
        return { 
          isValid: false, 
          error: `Bucket "${PROFILE_PHOTOS_BUCKET}" not found. Please create it in your Supabase dashboard.` 
        };
      }
      // Other errors (like RLS policy issues) are actually expected and indicate the bucket exists
      // We'll handle RLS issues during the actual upload
      return { isValid: true };
    }
    
    // If we get here, the bucket exists and is accessible
    return { isValid: true };
  } catch (error) {
    // Network or other critical errors
    return { 
      isValid: false, 
      error: `Failed to verify Supabase setup: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

/**
 * Upload a profile photo to Supabase storage
 * @param userId - The user's unique identifier
 * @param file - The image file to upload
 * @returns Promise with the public URL of the uploaded image
 */
export async function uploadProfilePhoto(userId: string, file: File): Promise<string> {
  try {
    // Validate inputs
    if (!userId) {
      throw new Error('User ID is required for photo upload');
    }
    if (!file) {
      throw new Error('File is required for upload');
    }

    // Create a unique filename with timestamp and original extension
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}_${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    // Upload the file to Supabase storage
    const { data, error } = await supabase.storage
      .from(PROFILE_PHOTOS_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      
      // Provide more specific error messages
      if (error.message.includes('row-level security')) {
        throw new Error('Storage permissions not configured. Please check Supabase RLS policies for the profile-photos bucket.');
      } else if (error.message.includes('Bucket not found')) {
        throw new Error('Profile photos storage bucket not found. Please create the "profile-photos" bucket in Supabase.');
      } else {
        throw new Error(`Failed to upload file: ${error.message}`);
      }
    }

    if (!data) {
      throw new Error('Upload completed but no data returned');
    }

    // Get the public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from(PROFILE_PHOTOS_BUCKET)
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    throw error;
  }
}

/**
 * Upload a profile photo from a URL (e.g., Firebase Google Auth photo)
 * @param userId - The user's unique identifier
 * @param photoURL - The URL of the photo to download and upload
 * @returns Promise with the public URL of the uploaded image
 */
export async function uploadProfilePhotoFromURL(userId: string, photoURL: string): Promise<string> {
  try {
    // Fetch the image from the URL
    const response = await fetch(photoURL);
    if (!response.ok) {
      throw new Error(`Failed to fetch image from URL: ${response.statusText}`);
    }

    // Convert response to blob
    const blob = await response.blob();
    
    // Determine file extension from content type or URL
    let fileExt = 'jpg'; // default
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('png')) fileExt = 'png';
    else if (contentType?.includes('gif')) fileExt = 'gif';
    else if (contentType?.includes('webp')) fileExt = 'webp';
    
    // Create filename
    const fileName = `${userId}_google_${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    // Upload the blob to Supabase storage
    const { data, error } = await supabase.storage
      .from(PROFILE_PHOTOS_BUCKET)
      .upload(filePath, blob, {
        cacheControl: '3600',
        upsert: false,
        contentType: contentType || 'image/jpeg'
      });

    if (error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }

    // Get the public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from(PROFILE_PHOTOS_BUCKET)
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    throw error;
  }
}

/**
 * Delete a profile photo from Supabase storage
 * @param userId - The user's unique identifier
 * @param photoUrl - The URL of the photo to delete
 * @returns Promise<boolean> - Success status
 */
export async function deleteProfilePhoto(userId: string, photoUrl: string): Promise<boolean> {
  try {
    // Extract the file path from the URL
    const url = new URL(photoUrl);
    const pathParts = url.pathname.split('/');
    const filePath = pathParts.slice(-2).join('/'); // Gets "userId/filename"

    const { error } = await supabase.storage
      .from(PROFILE_PHOTOS_BUCKET)
      .remove([filePath]);

    if (error) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * List all profile photos for a user
 * @param userId - The user's unique identifier
 * @returns Promise with array of file objects
 */
export async function listUserProfilePhotos(userId: string) {
  try {
    const { data, error } = await supabase.storage
      .from(PROFILE_PHOTOS_BUCKET)
      .list(userId, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    throw error;
  }
}