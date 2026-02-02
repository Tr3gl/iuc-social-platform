-- UNIVERSAL FIX: Link ALL Engineering Departments
-- This script dynamically finds the parent faculty and links all matching departments

DO $$
DECLARE
  parent_uuid UUID;
BEGIN
  -- 1. Find or Create "Mühendislik Fakültesi"
  SELECT id INTO parent_uuid FROM faculties WHERE name = 'Mühendislik Fakültesi' LIMIT 1;
  
  IF parent_uuid IS NULL THEN
    INSERT INTO faculties (name, parent_id)
    VALUES ('Mühendislik Fakültesi', NULL)
    RETURNING id INTO parent_uuid;
  END IF;

  -- 2. Update ALL departments that look like engineering
  -- Using TRIM and ILIKE for maximum matching
  UPDATE faculties
  SET parent_id = parent_uuid
  WHERE 
    id != parent_uuid -- Don't link parent to itself
    AND (
      TRIM(name) ILIKE '%engineering%' 
      OR TRIM(name) ILIKE '%mühendislik%' 
      OR TRIM(name) ILIKE '%bilgisayar%'
      OR TRIM(name) ILIKE '%computer%'
      OR TRIM(name) ILIKE '%elektrik%'
      OR TRIM(name) ILIKE '%electrical%'
      OR TRIM(name) ILIKE '%çevre%'
      OR TRIM(name) ILIKE '%environmental%'
      OR TRIM(name) ILIKE '%kimya%'
      OR TRIM(name) ILIKE '%chemical%'
      OR TRIM(name) ILIKE '%inşaat%'
      OR TRIM(name) ILIKE '%civil%'
      OR TRIM(name) ILIKE '%makine%'
      OR TRIM(name) ILIKE '%mechanical%'
      OR TRIM(name) ILIKE '%endüstri%'
      OR TRIM(name) ILIKE '%industrial%'
      OR TRIM(name) ILIKE '%maden%'
      OR TRIM(name) ILIKE '%mining%'
      OR TRIM(name) ILIKE '%jeoloji%'
      OR TRIM(name) ILIKE '%geology%'
      OR TRIM(name) ILIKE '%metal%'
    );
    
END $$;
