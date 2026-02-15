# Supabase Storage Setup Guide for Profile Photos

## Error Fix: "new row violates row-level security policy"

This error occurs because Supabase Storage has Row Level Security (RLS) enabled by default, but no policies are configured to allow file uploads. Follow these steps to fix it:

## Step 1: Create Storage Bucket

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project: `hlduevifufaasxmrtjks`
3. Navigate to **Storage** in the left sidebar
4. Click **Create bucket**
5. Set bucket name: `profile-photos`
6. Set bucket to **Public** (this allows public read access to uploaded images)
7. Click **Create bucket**

## Step 2: Configure Storage Policies

After creating the bucket, you need to set up RLS policies:

### Option A: Using the Supabase Dashboard (Recommended)

1. Go to **Storage** → **profile-photos** bucket
2. Click on **Policies** tab
3. Click **Create policy**

**Policy 1: Allow Upload (INSERT)**
```sql
CREATE POLICY "Users can upload profile photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'profile-photos' AND 
  auth.uid() IS NOT NULL
);
```

**Policy 2: Allow Public Read (SELECT)**
```sql
CREATE POLICY "Profile photos are publicly viewable" ON storage.objects
FOR SELECT USING (bucket_id = 'profile-photos');
```

**Policy 3: Allow Users to Delete Their Own Photos (DELETE)**
```sql
CREATE POLICY "Users can delete their own profile photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'profile-photos' AND 
  auth.uid() IS NOT NULL
);
```

**Policy 4: Allow Users to Update Their Own Photos (UPDATE)**
```sql
CREATE POLICY "Users can update their own profile photos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'profile-photos' AND 
  auth.uid() IS NOT NULL
);
```

### Option B: Using SQL Editor

1. Go to **SQL Editor** in your Supabase dashboard
2. Create a new query and run these commands:

```sql
-- Enable RLS on storage.objects (should already be enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policies for profile-photos bucket
CREATE POLICY "Enable upload for authenticated users" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'profile-photos' AND 
  auth.uid() IS NOT NULL
);

CREATE POLICY "Enable public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'profile-photos');

CREATE POLICY "Enable delete for users" ON storage.objects
FOR DELETE USING (
  bucket_id = 'profile-photos' AND 
  auth.uid() IS NOT NULL
);

CREATE POLICY "Enable update for users" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'profile-photos' AND 
  auth.uid() IS NOT NULL
);
```

## Step 3: Test the Configuration

After setting up the policies, test the upload functionality:

1. Make sure your app is running (`npm run dev`)
2. Sign in to your app (authentication is required for uploads)
3. Go to the profile page
4. Try uploading a profile photo

## Troubleshooting

### Still getting 403 errors?

1. **Check Authentication**: Make sure the user is properly signed in. The `auth.uid()` function returns the authenticated user's ID.

2. **Verify Bucket Name**: Ensure the bucket is named exactly `profile-photos` (case-sensitive).

3. **Check Policies**: In the Supabase dashboard, go to Storage → profile-photos → Policies and verify all policies are active.

4. **Test with Supabase CLI** (optional):
   ```bash
   npx supabase --version
   npx supabase login
   npx supabase projects list
   ```

### Alternative: Temporary Fix (Less Secure)

If you want to quickly test without authentication, you can create a more permissive policy (NOT recommended for production):

```sql
-- TEMPORARY: Allow anyone to upload (remove this in production)
CREATE POLICY "Temporary allow all uploads" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'profile-photos');
```

## Step 4: Verify Setup

After completing the setup, you should see:

1. ✅ A `profile-photos` bucket in Storage
2. ✅ Four active policies for the bucket
3. ✅ No more 403 errors when uploading photos
4. ✅ Photos accessible via public URLs

## Additional Security Considerations

For production, you might want to add more restrictive policies:

```sql
-- Limit file size (example: 5MB = 5242880 bytes)
CREATE POLICY "Limit file size" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'profile-photos' AND 
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text AND
  char_length(encode(raw_data, 'base64')) < 7000000
);

-- Limit to specific file types
CREATE POLICY "Only allow image files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'profile-photos' AND 
  auth.uid() IS NOT NULL AND
  lower(right(name, 4)) IN ('.jpg', '.png', '.gif') OR
  lower(right(name, 5)) IN ('.jpeg', '.webp')
);
```

## Need Help?

If you're still experiencing issues:

1. Check the browser's developer console for detailed error messages
2. Verify your Supabase project URL and anon key in `.env.local`
3. Ensure you're signed in to the app before trying to upload
4. Check the Supabase dashboard logs for more detailed error information

The setup should now work correctly for profile photo uploads!














