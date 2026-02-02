-- FIX Migration: Normalize multi-instructors and separate titles
-- This migration splits comma-separated instructors and normalizes names

-- Step 0: Pre-cleanup
DROP INDEX IF EXISTS idx_instructors_name_unique;

-- Step 1: Ensure Helper Functions Exist
CREATE OR REPLACE FUNCTION extract_instructor_title_v3(full_name TEXT)
RETURNS TEXT AS $$
DECLARE
    match_result TEXT[];
    title_pattern TEXT;
BEGIN
    title_pattern := '^(' ||
        'Assist\.?\s*Prof\.?\s*Dr\.?|' ||
        'Asst\.?\s*Prof\.?\s*Dr\.?|' ||
        'Assoc\.?\s*Prof\.?\s*Dr\.?|' ||
        'Prof\.?\s*Dr\.?|' ||
        'Doç\.?\s*Dr\.?|' ||
        'Yrd\.?\s*Doç\.?\s*Dr\.?|' ||
        'Dr\.?\s*Öğr\.?\s*Üyesi|' ||
        'Araş\.?\s*Gör\.?\s*Dr\.?|' ||
        'Araş\.?\s*Gör\.?|' ||
        'Öğr\.?\s*Gör\.?|' ||
        'Ögr\.?\s*Gör\.?|' || 
        'Öğr\.?\s*Ü\.?|' ||
        'Arş\.?\s*Gör\.?\s*Dr\.?|' ||
        'Arş\.?\s*Gör\.?|' ||
        'Prof\.?|' ||
        'Doç\.?|' ||
        'Dr\.?' ||
    ')\s*';
    
    match_result := regexp_match(full_name, title_pattern, 'i');
    IF match_result IS NOT NULL THEN
        RETURN TRIM(match_result[1]);
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION extract_instructor_clean_name_v3(full_name TEXT)
RETURNS TEXT AS $$
DECLARE
    title_pattern TEXT;
    result TEXT;
BEGIN
    title_pattern := '^(' ||
        'Assist\.?\s*Prof\.?\s*Dr\.?|' ||
        'Asst\.?\s*Prof\.?\s*Dr\.?|' ||
        'Assoc\.?\s*Prof\.?\s*Dr\.?|' ||
        'Prof\.?\s*Dr\.?|' ||
        'Doç\.?\s*Dr\.?|' ||
        'Yrd\.?\s*Doç\.?\s*Dr\.?|' ||
        'Dr\.?\s*Öğr\.?\s*Üyesi|' ||
        'Araş\.?\s*Gör\.?\s*Dr\.?|' ||
        'Araş\.?\s*Gör\.?|' ||
        'Öğr\.?\s*Gör\.?|' ||
        'Ögr\.?\s*Gör\.?|' || 
        'Öğr\.?\s*Ü\.?|' ||
        'Arş\.?\s*Gör\.?\s*Dr\.?|' ||
        'Arş\.?\s*Gör\.?|' ||
        'Prof\.?|' ||
        'Doç\.?|' ||
        'Dr\.?' ||
    ')\s*';
    
    result := regexp_replace(full_name, title_pattern, '', 'i');
    -- Also remove any stray title fragments that might be left
    result := regexp_replace(result, '^(Assist|Asst|Assoc|Prof|Doç|Yrd|Dr|Öğr|Ögr|Araş|Arş|Ü\.|Üyesi)\s*', '', 'gi');
    RETURN TRIM(result);
END;
$$ LANGUAGE plpgsql;

-- Step 2: Process "Multi-Instructors" (containing comma)
DO $$
DECLARE
    rec RECORD;
    raw_name TEXT;
    part_name TEXT;
    extracted_title TEXT;
    extracted_name TEXT;
    new_inst_id UUID;
    course_rec RECORD;
BEGIN
    -- Loop through instructors that look like multiple people (contain comma)
    FOR rec IN SELECT * FROM instructors WHERE name LIKE '%,%' LOOP
        
        -- Loop through the split parts
        FOR part_name IN SELECT trim(unnest(string_to_array(rec.name, ','))) LOOP
            
            IF length(part_name) > 2 THEN
                extracted_title := extract_instructor_title_v3(part_name);
                extracted_name := extract_instructor_clean_name_v3(part_name);
                
                -- Check if this individual already exists (by clean name)
                SELECT id INTO new_inst_id 
                FROM instructors 
                WHERE LOWER(name) = LOWER(extracted_name) 
                AND id != rec.id -- Don't match self if name equals part
                LIMIT 1;

                -- If not exists, create them
                IF new_inst_id IS NULL THEN
                    INSERT INTO instructors (name, title)
                    VALUES (extracted_name, extracted_title)
                    RETURNING id INTO new_inst_id;
                ELSE
                    -- Update title if existing one is null but we found one
                    UPDATE instructors 
                    SET title = COALESCE(title, extracted_title)
                    WHERE id = new_inst_id;
                END IF;

                -- Link to all courses that the original "multi" record was linked to
                FOR course_rec IN SELECT course_id FROM course_instructors WHERE instructor_id = rec.id LOOP
                    -- Insert collision safe
                    BEGIN
                        INSERT INTO course_instructors (course_id, instructor_id)
                        VALUES (course_rec.course_id, new_inst_id);
                    EXCEPTION WHEN unique_violation THEN
                        -- Already linked, ignore
                    END;
                END LOOP;

            END IF;
        END LOOP;

        -- We handled the parts, now mark the original "multi" record name with a flag to delete later
        -- (We can't delete immediately inside loop easily)
        UPDATE instructors SET name = '__DELETE_ME__' WHERE id = rec.id;
        
    END LOOP;
END;
$$;

-- Step 3: Delete the processed "multi" records
DELETE FROM instructors WHERE name = '__DELETE_ME__';

-- Step 4: Normalize Single Instructors (remaining ones)
UPDATE instructors
SET 
    title = COALESCE(extract_instructor_title_v3(name), title),
    name = extract_instructor_clean_name_v3(name)
WHERE title IS NULL OR name ~* '^(Assist|Asst|Assoc|Prof|Doç|Dr|Öğr|Ögr|Araş|Arş)'; 

-- Step 5: Final Cleanup of any formatting artifacts
UPDATE instructors
SET name = TRIM(BOTH ', ."' FROM name)
WHERE name IS NOT NULL;

-- Step 6: Merge any remaining Single Duplicates
-- (e.g. if we had "Dr. Ali" and "Ali" separately)
DO $$ 
DECLARE
    dup_rec RECORD;
BEGIN
    FOR dup_rec IN 
        SELECT 
            LOWER(name) as clean_name,
            (array_agg(id ORDER BY CASE WHEN title IS NOT NULL THEN 0 ELSE 1 END, created_at))[1] as keep_id,
            array_agg(id) as all_ids
        FROM instructors 
        GROUP BY LOWER(name) 
        HAVING count(*) > 1
    LOOP
        -- Move links to the keeper
        UPDATE course_instructors 
        SET instructor_id = dup_rec.keep_id
        WHERE instructor_id = ANY(dup_rec.all_ids) AND instructor_id != dup_rec.keep_id
        AND course_id NOT IN (SELECT course_id FROM course_instructors WHERE instructor_id = dup_rec.keep_id);
        
        -- Delete others
        DELETE FROM instructors 
        WHERE id = ANY(dup_rec.all_ids) AND id != dup_rec.keep_id;
    END LOOP;
END;
$$;

-- Step 7: Re-create Unique Index
CREATE UNIQUE INDEX IF NOT EXISTS idx_instructors_name_unique 
ON instructors (LOWER(TRIM(name)));

-- Verify
SELECT name, title, count(*) as course_count 
FROM instructors i
JOIN course_instructors ci ON i.id = ci.instructor_id
GROUP BY i.id, i.name, i.title
ORDER BY i.name
LIMIT 50;
