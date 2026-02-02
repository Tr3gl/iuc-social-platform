-- ============================================================================
-- SAMPLE DATA: Matematik I (CEMU1902) with Final vs Resit (Büt) history
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Step 1: Create 12 test users (idempotent)
DO $$
DECLARE
  test_users UUID[] := ARRAY[]::UUID[];
  new_user_id UUID;
  i INTEGER;
BEGIN
  FOR i IN 1..12 LOOP
    SELECT id INTO new_user_id FROM auth.users WHERE email = 'testuser' || i || '@test.iuc.edu.tr' LIMIT 1;
    
    IF new_user_id IS NULL THEN
      INSERT INTO auth.users (
        id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, role, aud
      )
      VALUES (
        gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'testuser' || i || '@test.iuc.edu.tr',
        crypt('TestPassword123!', gen_salt('bf')), NOW(), NOW(), NOW(),
        '{"provider": "email", "providers": ["email"]}', '{}', FALSE, 'authenticated', 'authenticated'
      )
      RETURNING id INTO new_user_id;
    END IF;
  END LOOP;
END $$;

-- Step 2: Create/update the course and insert reviews
DO $$
DECLARE
  course_uuid UUID;
  faculty_uuid UUID;
  test_user_record RECORD;
  
  -- Data pattern: 
  -- 2022: Final Normal, Büt Harder
  -- 2023: Final Hard, Büt Easier
  -- 2024: Final Easy, No Büt data (simulated missing)
  -- 2025: Final Normal, Büt Very Hard
  
  dates DATE[] := ARRAY[
    -- 2022
    '2022-01-15', '2022-01-20', '2022-01-25', (DATE '2022-02-15'), (DATE '2022-02-20'),
    -- 2023
    '2023-01-15', '2023-01-20', (DATE '2023-02-15'), (DATE '2023-02-20'),
    -- 2024 (Only Finals)
    '2024-01-10', '2024-01-15', '2024-01-20',
    -- 2025
    '2025-01-10', '2025-01-15', (DATE '2025-02-10'), (DATE '2025-02-15')
  ];
  
  gradings INTEGER[] := ARRAY[
    -- 2022 (Final: 3,4,4 -> Avg ~3.6 -> Normal curve) | (Büt: 2,2 -> Avg 2 -> High curve/Hard)
    3, 4, 4, 2, 2,
    -- 2023 (Final: 2,2 -> Avg 2 -> Hard) | (Büt: 5,4 -> Avg 4.5 -> Easy) 
    2, 2, 5, 4,
    -- 2024 (Final: 5,5,4 -> Avg 4.6 -> Very Easy)
    5, 5, 4,
    -- 2025 (Final: 3,4 -> Normal) | (Büt: 1,2 -> Very Hard)
    3, 4, 1, 2
  ];
  
  idx INTEGER := 1;
BEGIN
  SELECT id INTO faculty_uuid FROM faculties LIMIT 1;
  SELECT id INTO course_uuid FROM courses WHERE code = 'CEMU1902' LIMIT 1;
  
  IF course_uuid IS NULL THEN
    INSERT INTO courses (name, code, faculty_id, credit_theory, ects, course_type, semester, term)
    VALUES ('Matematik I', 'CEMU1902', faculty_uuid, 4, 6, 'Zorunlu', 1, 'Güz')
    RETURNING id INTO course_uuid;
  END IF;
  
  DELETE FROM reviews WHERE course_id = course_uuid;
  
  idx := 1;
  FOR test_user_record IN SELECT id FROM auth.users WHERE email LIKE 'testuser%@test.iuc.edu.tr' ORDER BY email LIMIT 14 LOOP
    IF idx <= array_length(dates, 1) THEN
      INSERT INTO reviews (
        course_id, user_id, difficulty, usefulness, workload, exam_clarity,
        grading_fairness, attendance, material_relevance, exam_predictability,
        difficulty_value_alignment, exam_format, vize_format, final_format,
        comment, created_at, updated_at
      )
      VALUES (
        course_uuid, test_user_record.id, 3, 4, 4, 3,
        gradings[idx], 4, 4, 3,
        'well_balanced', 'written', 'written', 'written',
        'Review for ' || dates[idx],
        dates[idx]::TIMESTAMP, dates[idx]::TIMESTAMP
      );
      idx := idx + 1;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Added historical reviews including Finals (Jan) and Resits (Feb)';
END $$;
