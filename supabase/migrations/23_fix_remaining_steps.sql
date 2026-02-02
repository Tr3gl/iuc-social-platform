-- FIX Migration: Run only the steps that failed (5-8)
-- Steps 1-4 were already executed successfully

-- Step 5: Merge duplicate instructors
-- First, identify duplicates and the "canonical" ID (first created, using array_agg)
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
COMMENT ON COLUMN instructors.title IS 'Academic title (Prof., Dr., Öğr. Gör., etc.) - stored separately for deduplication';
