-- ============================================================================
-- MIGRATION: Expand Courses Table
-- ============================================================================

ALTER TABLE courses
ADD COLUMN IF NOT EXISTS credit_theory INTEGER,
ADD COLUMN IF NOT EXISTS ects INTEGER,
ADD COLUMN IF NOT EXISTS term TEXT, -- 'Güz', 'Bahar' or '1', '2'
ADD COLUMN IF NOT EXISTS semester INTEGER, -- 1, 2, 3... 8
ADD COLUMN IF NOT EXISTS course_type TEXT, -- 'Zorunlu', 'Seçmeli'
ADD COLUMN IF NOT EXISTS class_type TEXT; -- 'Ders', 'Uygulama'
