-- FORCE FIX: Update Environmental Engineering specifically
-- UUID from your debug info: 7569e4c3-ce59-49d0-9a4b-e5c423b469ff

-- 1. Get/Create Parent Faculty
INSERT INTO faculties (name, parent_id)
VALUES ('Mühendislik Fakültesi', NULL)
ON CONFLICT DO NOTHING;

-- 2. Force Update the specific department (and others)
-- We remove the 'AND parent_id IS NULL' check to force override
UPDATE faculties
SET parent_id = (SELECT id FROM faculties WHERE name = 'Mühendislik Fakültesi' LIMIT 1)
WHERE id = '7569e4c3-ce59-49d0-9a4b-e5c423b469ff';

-- 3. Also force update others just in case
UPDATE faculties
SET parent_id = (SELECT id FROM faculties WHERE name = 'Mühendislik Fakültesi' LIMIT 1)
WHERE (
    name ILIKE '%engineering%' 
    OR name ILIKE '%mühendislik%' 
)
AND name != 'Mühendislik Fakültesi';
