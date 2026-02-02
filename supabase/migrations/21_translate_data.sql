-- ============================================================================
-- MIGRATION: Translate Faculties & Departments to English
-- ============================================================================

-- Ensure name_tr is populated first (idempotent if already done in 19)
UPDATE faculties SET name_tr = name WHERE name_tr IS NULL;

-- Translate Faculties (Top Level)
UPDATE faculties SET name = 'Faculty of Engineering' WHERE name_tr = 'Mühendislik Fakültesi';
UPDATE faculties SET name = 'Faculty of Forestry' WHERE name_tr = 'Orman Fakültesi';
UPDATE faculties SET name = 'Faculty of Political Sciences' WHERE name_tr = 'Siyasal Bilgiler Fakültesi';
UPDATE faculties SET name = 'Faculty of Business Administration' WHERE name_tr = 'İşletme Fakültesi';
UPDATE faculties SET name = 'Faculty of Health Sciences' WHERE name_tr = 'Sağlık Bilimleri Fakültesi';
UPDATE faculties SET name = 'Faculty of Veterinary Medicine' WHERE name_tr = 'Veteriner Fakültesi';
UPDATE faculties SET name = 'Florence Nightingale Faculty of Nursing' WHERE name_tr = 'Florence Nightingale Hemşirelik Fakültesi';
UPDATE faculties SET name = 'Vocational School of Technical Sciences' WHERE name_tr = 'Teknik Bilimler Meslek Yüksekokulu';


-- Translate Departments (Engineering)
UPDATE faculties SET name = 'Computer Engineering' WHERE name_tr = 'Bilgisayar Mühendisliği';
UPDATE faculties SET name = 'Industrial Engineering' WHERE name_tr = 'Endüstri Mühendisliği';
UPDATE faculties SET name = 'Civil Engineering' WHERE name_tr = 'İnşaat Mühendisliği';
UPDATE faculties SET name = 'Mechanical Engineering' WHERE name_tr = 'Makine Mühendisliği';
UPDATE faculties SET name = 'Chemical Engineering' WHERE name_tr = 'Kimya Mühendisliği';
UPDATE faculties SET name = 'Electrical-Electronics Engineering' WHERE name_tr = 'Elektrik-Elektronik Mühendisliği';
UPDATE faculties SET name = 'Food Engineering' WHERE name_tr = 'Gıda Mühendisliği';
UPDATE faculties SET name = 'Geophysical Engineering' WHERE name_tr = 'Jeofizik Mühendisliği';
UPDATE faculties SET name = 'Geological Engineering' WHERE name_tr = 'Jeoloji Mühendisliği';
UPDATE faculties SET name = 'Mining Engineering' WHERE name_tr = 'Maden Mühendisliği';
UPDATE faculties SET name = 'Metallurgical and Materials Engineering' WHERE name_tr = 'Metalurji ve Malzeme Mühendisliği';
UPDATE faculties SET name = 'Marine Engineering' WHERE name_tr = 'Gemi Makineleri ve İşletme Mühendisliği'; 
UPDATE faculties SET name = 'Environmental Engineering' WHERE name_tr = 'Çevre Mühendisliği';


-- Translate Departments (Forestry)
UPDATE faculties SET name = 'Forest Engineering' WHERE name_tr = 'Orman Mühendisliği';
UPDATE faculties SET name = 'Forest Industrial Engineering' WHERE name_tr = 'Orman Endüstri Mühendisliği';
UPDATE faculties SET name = 'Landscape Architecture' WHERE name_tr = 'Peyzaj Mimarlığı';


-- Translate Departments (Business)
UPDATE faculties SET name = 'Business Administration' WHERE name_tr = 'İşletme';

-- Catch-all for departments ending with "Mühendisliği" that weren't caught above?
-- (Optional: Regex replace to swap "Mühendisliği" -> "Engineering" if you want to be dynamic, but manual is safer)

-- NOTE: Tags Translation
-- If there are system tags like "Kolay", "Zor", we can translate them here.
-- Assuming tags are purely user-generated, we might leave them. But if we want to standardize:
-- UPDATE tags SET name = 'Easy' WHERE name = 'Kolay';
-- UPDATE tags SET name = 'Hard' WHERE name = 'Zor';
-- UPDATE tags SET name = 'Helpful' WHERE name = 'Faydalı';
