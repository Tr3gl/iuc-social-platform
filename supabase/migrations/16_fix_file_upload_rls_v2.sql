-- FIX V2: Clean Slate for File Upload Permissions
-- This script safely drops existing policies before creating them to avoid conflicts.

-- 1. Enable RLS on files table
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to prevent "already exists" errors
DROP POLICY IF EXISTS "Authenticated users can upload files" ON files;
DROP POLICY IF EXISTS "Public can view files" ON files;
DROP POLICY IF EXISTS "Users can delete own files" ON files;

-- 3. Create Policies for 'files' table
CREATE POLICY "Public can view files" 
ON files FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can upload files" 
ON files FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own files" 
ON files FOR DELETE 
USING (auth.uid() = user_id);

-- 4. Storage Bucket 'course-files' permissions
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-files', 'course-files', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Uploads" ON storage.objects;
DROP POLICY IF EXISTS "Owner Delete" ON storage.objects;

-- Re-create Storage Policies
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'course-files' );

CREATE POLICY "Authenticated Uploads"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'course-files' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Owner Delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'course-files' 
  AND auth.uid() = owner
);
