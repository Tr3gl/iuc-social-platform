-- FIX: Ensure "Mühendislik Fakültesi" exists and link departments to it

-- 1. Create or Find Parent Faculty
INSERT INTO faculties (name, parent_id)
SELECT 'Mühendislik Fakültesi', NULL
WHERE NOT EXISTS (
    SELECT 1 FROM faculties WHERE name = 'Mühendislik Fakültesi'
);

-- 2. Update Departments
UPDATE faculties
SET parent_id = (SELECT id FROM faculties WHERE name = 'Mühendislik Fakültesi')
WHERE (
    name ILIKE '%engineering%' 
    OR name ILIKE '%mühendislik%' 
    OR name ILIKE '%bilgisayar%'
    OR name ILIKE '%elektrik%'
    OR name ILIKE '%çevre%'
    OR name ILIKE '%kimya%'
    OR name ILIKE '%inşaat%'
    OR name ILIKE '%endüstri%'
    OR name ILIKE '%makine%'
    OR name ILIKE '%jeoloji%'
    OR name ILIKE '%geology%'
    OR name ILIKE '%maden%'
    OR name ILIKE '%mining%'
)
AND name != 'Mühendislik Fakültesi'
AND parent_id IS NULL;
