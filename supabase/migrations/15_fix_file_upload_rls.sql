-- FIX: Enable RLS and policies for 'files' table and 'course-files' bucket

-- 1. Ensure 'files' table exists and has RLS enabled
CREATE TABLE IF NOT EXISTS files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT CHECK (type IN ('exam', 'notes', 'other')),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- 2. Create Policies for 'files' table

-- Allow public read access to files metadata
CREATE POLICY "Public can view files" 
ON files FOR SELECT 
USING (true);

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload files" 
ON files FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files" 
ON files FOR DELETE 
USING (auth.uid() = user_id);

-- 3. Configure Storage Bucket 'course-files'

-- Ensure bucket exists (this is idempotent in SQL usually, but good to have)
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-files', 'course-files', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies using storage.objects

-- Allow public read access to objects in bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'course-files' );

-- Allow authenticated uploads
CREATE POLICY "Authenticated Uploads"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'course-files' 
  AND auth.role() = 'authenticated'
);

-- Allow owners to delete their objects
CREATE POLICY "Owner Delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'course-files' 
  AND auth.uid() = owner
);
