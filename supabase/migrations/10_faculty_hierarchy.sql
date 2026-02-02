-- ============================================================================
-- MIGRATION: Add parent_id hierarchy to faculties table
-- ============================================================================
-- This enables a true hierarchy: Top-Level Faculty → Department → Courses
-- Top-level faculties have parent_id = NULL
-- Departments have parent_id pointing to their parent faculty

-- Add parent_id column
ALTER TABLE faculties ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES faculties(id) ON DELETE SET NULL;

-- Add index for faster hierarchy queries  
CREATE INDEX IF NOT EXISTS idx_faculties_parent_id ON faculties(parent_id);

-- ============================================================================
-- IMPORTANT: After running this migration, you need to manually set parent_id
-- for existing departments to link them to their parent faculties.
-- 
-- Example SQL to link departments to a faculty:
-- UPDATE faculties 
-- SET parent_id = 'faculty-uuid-here' 
-- WHERE name LIKE '%Engineering%' OR name LIKE '%engineering%';
-- ============================================================================
