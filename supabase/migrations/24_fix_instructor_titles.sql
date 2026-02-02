-- FIX Migration: Properly clean instructor names and titles
-- Run this to fix the mess from the previous migration

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

-- Step 7: Show the current state for verification
SELECT name, title, created_at FROM instructors ORDER BY name LIMIT 30;
