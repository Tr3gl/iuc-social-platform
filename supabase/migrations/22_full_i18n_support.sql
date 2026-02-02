-- ============================================================================
-- MIGRATION: Full i18n Support
-- Adds bilingual support for tags and fixes remaining Turkish faculty names
-- ============================================================================

-- 1. Add name_tr column to tags table
ALTER TABLE tags ADD COLUMN IF NOT EXISTS name_tr TEXT;

-- 2. Populate name_tr with Turkish translations for existing English tags
UPDATE tags SET name_tr = CASE name
  WHEN 'High Grades' THEN 'Yüksek Notlar'
  WHEN 'Helpful Prof' THEN 'Yardımcı Hoca'
  WHEN 'Clear Slides' THEN 'Anlaşılır Slaytlar'
  WHEN 'No Final' THEN 'Final Yok'
  WHEN 'Interactive' THEN 'Etkileşimli'
  WHEN 'Heavy HW' THEN 'Ağır Ödev'
  WHEN 'Exam Focus' THEN 'Sınav Odaklı'
  WHEN 'Strict Curve' THEN 'Katı Eğri'
  WHEN 'Outdated Books' THEN 'Eski Kitaplar'
  WHEN 'Long Lectures' THEN 'Uzun Dersler'
  ELSE name
END WHERE name_tr IS NULL;

-- 3. Translate remaining Turkish faculty names to English
UPDATE faculties SET name = 'Faculty of Education', name_tr = 'Eğitim Fakültesi' WHERE name = 'Eğitim Fakültesi';
UPDATE faculties SET name = 'Faculty of Medicine', name_tr = 'Tıp Fakültesi' WHERE name = 'Tıp Fakültesi';
