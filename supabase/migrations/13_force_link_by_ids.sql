-- FORCE LINK BY EXACT IDs
-- Mühendislik Fakültesi: f503d230-eb06-48b1-8fb9-c30411b0cbec
-- Environmental Engineering: 7569e4c3-ce59-49d0-9a4b-e5c423b469ff

UPDATE faculties
SET parent_id = 'f503d230-eb06-48b1-8fb9-c30411b0cbec'
WHERE id = '7569e4c3-ce59-49d0-9a4b-e5c423b469ff';

-- Verify the update
SELECT id, name, parent_id FROM faculties WHERE id = '7569e4c3-ce59-49d0-9a4b-e5c423b469ff';
