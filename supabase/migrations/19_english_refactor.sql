-- ============================================================================
-- MIGRATION: English Refactor & Localization Support
-- ============================================================================

-- 1. Rename 'vize_format' to 'midterm_format' in reviews table
DO $$
BEGIN
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'vize_format') THEN
    ALTER TABLE reviews RENAME COLUMN vize_format TO midterm_format;
  END IF;
END $$;

-- 2. Add 'name_tr' to faculties if not exists
ALTER TABLE faculties ADD COLUMN IF NOT EXISTS name_tr TEXT;

-- 3. Populate 'name_tr' with existing 'name' (assuming current names are Turkish)
UPDATE faculties SET name_tr = name WHERE name_tr IS NULL;

-- 4. Add 'name_tr' to courses? Maybe later, for now just faculties usually need translation.
--    Departments are usually faculties' children in this schema, so check if we need it there.
--    Wait, departments are in 'faculties' table (recursive hierarchy). 
--    So adding it to 'faculties' covers departments too.

-- 5. Add 'name_tr' to tags? Tags are user generated. Maybe not now.
