-- ============================================================================
-- MIGRATION: Consolidate departments under Mühendislik Fakültesi
-- ============================================================================

-- First, ensure Mühendislik Fakültesi exists and get/create its ID
DO $$
DECLARE
  muhendislik_id UUID;
BEGIN
  -- Try to find existing Mühendislik Fakültesi
  SELECT id INTO muhendislik_id FROM faculties WHERE name ILIKE '%mühendislik%' OR name ILIKE '%muhendislik%' LIMIT 1;
  
  -- If not found, create it
  IF muhendislik_id IS NULL THEN
    INSERT INTO faculties (name) VALUES ('Mühendislik Fakültesi') RETURNING id INTO muhendislik_id;
  END IF;
  
  -- Update all courses from engineering-related departments to point to Mühendislik
  UPDATE courses 
  SET faculty_id = muhendislik_id 
  WHERE faculty_id IN (
    SELECT id FROM faculties 
    WHERE name ILIKE '%engineering%' 
       OR name ILIKE '%mühendislik%'
       OR name ILIKE '%Computer%'
       OR name ILIKE '%Electrical%'
       OR name ILIKE '%Environmental%'
       OR name ILIKE '%Bilgisayar%'
       OR name ILIKE '%Elektrik%'
       OR name ILIKE '%Çevre%'
  );
  
  -- Delete the now-empty department "faculties" (keeping only actual faculty)
  DELETE FROM faculties 
  WHERE id != muhendislik_id 
    AND (
      name ILIKE '%engineering%' 
      OR name ILIKE '%Computer%'
      OR name ILIKE '%Electrical%'
      OR name ILIKE '%Environmental%'
      OR name ILIKE '%Bilgisayar%'
      OR name ILIKE '%Elektrik%'
      OR name ILIKE '%Çevre%'
    )
    AND NOT EXISTS (SELECT 1 FROM courses WHERE faculty_id = faculties.id);
    
  RAISE NOTICE 'All engineering departments consolidated under Mühendislik Fakültesi (ID: %)', muhendislik_id;
END $$;
