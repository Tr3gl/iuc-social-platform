-- Add verification system for files

-- 1. Add is_verified column (default false for new uploads)
ALTER TABLE files 
ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;

-- 2. Update existing files to be verified (so current files don't disappear)
UPDATE files SET is_verified = TRUE WHERE is_verified IS NULL;

-- 3. Create helper view for admins (optional but helpful)
CREATE OR REPLACE VIEW pending_files AS
SELECT 
  f.id, f.file_name, f.file_url, f.type, f.created_at,
  f.course_id, c.name as course_name, c.code as course_code,
  f.user_id, u.email as submitted_by_email
FROM files f
JOIN courses c ON f.course_id = c.id
LEFT JOIN auth.users u ON f.user_id = u.id
WHERE f.is_verified = FALSE
ORDER BY f.created_at DESC;
