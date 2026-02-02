-- Migration: Add title column to instructors and deduplicate entries
-- Run this complete script from scratch

-- Step 1: Add title column
ALTER TABLE instructors ADD COLUMN IF NOT EXISTS title TEXT;

-- Step 2: Create a function to extract title from name
CREATE OR REPLACE FUNCTION extract_instructor_title(full_name TEXT)
RETURNS TEXT AS $$
DECLARE
    match_result TEXT[];
BEGIN
    -- Match Turkish academic titles at the start (case insensitive)
    -- Order matters: longer patterns first
    match_result := regexp_match(full_name, '^(Prof\.?\s*Dr\.?|Doç\.?\s*Dr\.?|Yrd\.?\s*Doç\.?\s*Dr\.?|Dr\.?\s*Öğr\.?\s*Üyesi|Öğr\.?\s*Gör\.?|Arş\.?\s*Gör\.?|Prof\.?|Doç\.?|Dr\.?|Yrd\.?)\s*', 'i');
    IF match_result IS NOT NULL THEN
        RETURN TRIM(match_result[1]);
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create a function to extract clean name (without title)
CREATE OR REPLACE FUNCTION extract_instructor_clean_name(full_name TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN TRIM(regexp_replace(full_name, '^(Prof\.?\s*Dr\.?|Doç\.?\s*Dr\.?|Yrd\.?\s*Doç\.?\s*Dr\.?|Dr\.?\s*Öğr\.?\s*Üyesi|Öğr\.?\s*Gör\.?|Arş\.?\s*Gör\.?|Prof\.?|Doç\.?|Dr\.?|Yrd\.?)\s*', '', 'i'));
END;
$$ LANGUAGE plpgsql;

-- Step 4: Update existing instructors - extract title and clean name
UPDATE instructors
SET 
    title = extract_instructor_title(name),
    name = extract_instructor_clean_name(name);

-- Step 5: Merge duplicate instructors
-- Update course_instructors to point to canonical instructor (first one created)
WITH duplicates AS (
    SELECT 
        LOWER(TRIM(name)) as clean_name,
        (ARRAY_AGG(id ORDER BY created_at))[1] as canonical_id,
        ARRAY_AGG(id) as all_ids
    FROM instructors
    GROUP BY LOWER(TRIM(name))
    HAVING COUNT(*) > 1
)
UPDATE course_instructors ci
SET instructor_id = d.canonical_id
FROM duplicates d
WHERE ci.instructor_id = ANY(d.all_ids)
  AND ci.instructor_id != d.canonical_id;

-- Step 6: Delete duplicate instructor entries (keep canonical)
WITH duplicates AS (
    SELECT 
        LOWER(TRIM(name)) as clean_name,
        (ARRAY_AGG(id ORDER BY created_at))[1] as canonical_id,
        ARRAY_AGG(id) as all_ids
    FROM instructors
    GROUP BY LOWER(TRIM(name))
    HAVING COUNT(*) > 1
),
to_delete AS (
    SELECT UNNEST(all_ids) as id, canonical_id
    FROM duplicates
)
DELETE FROM instructors
WHERE id IN (
    SELECT id FROM to_delete WHERE id != canonical_id
);

-- Step 7: Add unique constraint on lowercase name to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_instructors_name_unique 
ON instructors (LOWER(TRIM(name)));

-- Add comment for documentation
COMMENT ON COLUMN instructors.title IS 'Academic title (Prof., Dr., Öğr. Gör., etc.)';
