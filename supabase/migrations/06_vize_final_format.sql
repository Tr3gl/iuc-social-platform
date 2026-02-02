-- ============================================================================
-- MIGRATION: Add vize_format and final_format columns to reviews table
-- ============================================================================

-- Add vize_format column
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS vize_format TEXT;

-- Add final_format column
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS final_format TEXT;

-- Migrate existing exam_format data to vize_format (for backward compatibility)
UPDATE reviews SET vize_format = exam_format WHERE vize_format IS NULL AND exam_format IS NOT NULL;

-- Set default final_format to 'written' for existing reviews
UPDATE reviews SET final_format = 'written' WHERE final_format IS NULL;
