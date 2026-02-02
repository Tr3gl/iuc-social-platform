-- FIX Migration V2: Fix duplicate key error and properly clean data
-- This script replaces 24_fix_instructor_titles.sql completely

-- Step 0: DROP the unique index first to avoid "duplicate key value" errors during update
DROP INDEX IF EXISTS idx_instructors_name_unique;

-- Step 1: Comprehensive function to extract ALL title variations
CREATE OR REPLACE FUNCTION extract_instructor_title_v2(full_name TEXT)
RETURNS TEXT AS $$
DECLARE
    match_result TEXT[];
    title_pattern TEXT;
BEGIN
    -- Comprehensive pattern for Turkish academic titles
    -- Order: longer, more specific patterns first
    title_pattern := '^(' ||
        'Assoc\.?\s*Prof\.?\s*Dr\.?|' ||    -- Assoc. Prof. Dr.
        'Prof\.?\s*Dr\.?|' ||                -- Prof. Dr.
        'Doç\.?\s*Dr\.?|' ||                 -- Doç. Dr.
        'Yrd\.?\s*Doç\.?\s*Dr\.?|' ||        -- Yrd. Doç. Dr.
        'Dr\.?\s*Öğr\.?\s*Üyesi|' ||         -- Dr. Öğr. Üyesi
        'Öğr\.?\s*Gör\.?|' ||                -- Öğr. Gör.
        'Öğr\.?\s*Ü\.?|' ||                  -- Öğr. Ü.
        'Arş\.?\s*Gör\.?|' ||                -- Arş. Gör.
        'Prof\.?|' ||                         -- Prof.
        'Doç\.?|' ||                          -- Doç.
        'Dr\.?' ||                            -- Dr.
    ')\s*';
    
    match_result := regexp_match(full_name, title_pattern, 'i');
    IF match_result IS NOT NULL THEN
        RETURN TRIM(match_result[1]);
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Function to extract clean name (remove ALL title variations)
CREATE OR REPLACE FUNCTION extract_instructor_clean_name_v2(full_name TEXT)
RETURNS TEXT AS $$
DECLARE
    title_pattern TEXT;
    result TEXT;
BEGIN
    title_pattern := '^(' ||
        'Assoc\.?\s*Prof\.?\s*Dr\.?|' ||
        'Prof\.?\s*Dr\.?|' ||
        'Doç\.?\s*Dr\.?|' ||
        'Yrd\.?\s*Doç\.?\s*Dr\.?|' ||
        'Dr\.?\s*Öğr\.?\s*Üyesi|' ||
        'Öğr\.?\s*Gör\.?|' ||
        'Öğr\.?\s*Ü\.?|' ||
        'Arş\.?\s*Gör\.?|' ||
        'Prof\.?|' ||
        'Doç\.?|' ||
        'Dr\.?' ||
    ')\s*';
    
    result := regexp_replace(full_name, title_pattern, '', 'i');
    RETURN TRIM(result);
END;
$$ LANGUAGE plpgsql;

-- Step 3: Reset the data - put back original names first
-- We need to reconstruct: if title exists, prepend it to name
-- This handles running on partially migrated data
UPDATE instructors
SET name = CASE 
    WHEN title IS NOT NULL AND title != '' THEN CONCAT(title, ' ', name)
    ELSE name
END,
title = NULL;

-- Step 4: Now properly clean names and extract titles
UPDATE instructors
SET 
    title = extract_instructor_title_v2(name),
    name = extract_instructor_clean_name_v2(name);

-- Step 5: Handle the remaining edge case where title still appears in name
-- (In case the pattern didn't match perfectly)
UPDATE instructors
SET name = TRIM(regexp_replace(name, 
    '^(Assoc\.?\s*|Prof\.?\s*|Doç\.?\s*|Yrd\.?\s*|Dr\.?\s*|Öğr\.?\s*|Gör\.?\s*|Arş\.?\s*|Ü\.?\s*|Üyesi\s*)+', 
    '', 'gi'))
WHERE name ~ '^(Assoc|Prof|Doç|Yrd|Dr|Öğr|Gör|Arş|Ü\.|Üyesi)';

-- Step 6: Remove any leading/trailing commas, periods, spaces
UPDATE instructors
SET name = TRIM(BOTH ', .' FROM name);

-- Step 7: MERGE DUPLICATES (Now that names are cleaner, we have new duplicates)
WITH duplicates AS (
    SELECT 
        LOWER(TRIM(name)) as clean_name,
        (ARRAY_AGG(id ORDER BY created_at))[1] as canonical_id,
        ARRAY_AGG(id) as all_ids
    FROM instructors
    GROUP BY LOWER(TRIM(name))
    HAVING COUNT(*) > 1
)
-- Update course_instructors to point to canonical instructor
UPDATE course_instructors ci
SET instructor_id = d.canonical_id
FROM duplicates d
WHERE ci.instructor_id = ANY(d.all_ids)
  AND ci.instructor_id != d.canonical_id;

-- Step 8: Delete duplicate instructor entries (keep canonical)
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

-- Step 9: Re-create the unique index to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_instructors_name_unique 
ON instructors (LOWER(TRIM(name)));

-- Verify results
SELECT name, title, created_at FROM instructors ORDER BY name LIMIT 30;
