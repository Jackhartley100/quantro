# Supabase Storage Setup Instructions

## 1. Create the `avatars` Storage Bucket

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket**
4. Configure the bucket:
   - **Name**: `avatars`
   - **Public bucket**: Choose one:
     - **Option A (Recommended for MVP)**: Set to **Public** - simpler, no signed URLs needed
     - **Option B**: Set to **Private** - more secure, requires signed URLs (you'll need to update the code to use `createSignedUrl` instead of `getPublicUrl`)
   - **File size limit**: 2MB (or your preferred limit)
   - **Allowed MIME types**: `image/jpeg`, `image/jpg`, `image/png`, `image/webp`

## 2. Set Up Storage Policies (RLS)

After creating the bucket, you need to set up Row Level Security policies:

### For Public Bucket:
```sql
-- Allow authenticated users to upload their own avatars
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own avatars
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own avatars
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access (since bucket is public)
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
```

### For Private Bucket:
```sql
-- Allow authenticated users to upload their own avatars
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own avatars
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own avatars
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to read their own avatars
CREATE POLICY "Users can read own avatar"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

**Note**: If using a private bucket, you'll need to update `app/actions/profile.ts` in the `uploadAvatar` function to use signed URLs instead of public URLs. The current implementation uses public URLs.

## 3. Run the Database Migration

Run the SQL migration file to create the profiles table:

```bash
# If using Supabase CLI
supabase db push

# Or manually run the SQL in supabase/migrations/001_create_profiles.sql
# via the Supabase Dashboard SQL Editor
```

## 4. Verify Setup

1. Check that the `profiles` table exists with the correct schema
2. Verify RLS policies are enabled on both `profiles` table and `storage.objects`
3. Test uploading an avatar to ensure storage policies work correctly

## Troubleshooting

- **"Bucket not found"**: Make sure the bucket name is exactly `avatars` (case-sensitive)
- **"Permission denied"**: Check that storage policies are correctly set up
- **"File too large"**: Adjust the bucket's file size limit or the validation in `uploadAvatar`
- **"Invalid file type"**: Ensure the bucket's allowed MIME types match the validation in the code

