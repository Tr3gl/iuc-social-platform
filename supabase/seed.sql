-- Seed data for Turkish universities
-- Sample faculties - customize based on your specific university

-- Insert sample faculties
INSERT INTO faculties (name) VALUES
    ('Mühendislik Fakültesi'),
    ('Fen Fakültesi'),
    ('İktisadi ve İdari Bilimler Fakültesi'),
    ('Tıp Fakültesi'),
    ('Hukuk Fakültesi'),
    ('Eğitim Fakültesi'),
    ('İletişim Fakültesi'),
    ('Güzel Sanatlar Fakültesi'),
    ('Mimarlık Fakültesi'),
    ('İşletme Fakültesi')
ON CONFLICT (name) DO NOTHING;

-- Sample courses (optional - for testing)
-- Uncomment and customize based on your university's courses

/*
INSERT INTO courses (faculty_id, name, code)
SELECT 
    f.id,
    'Calculus I',
    'MATH 101'
FROM faculties f
WHERE f.name = 'Mühendislik Fakültesi'
ON CONFLICT (faculty_id, code) DO NOTHING;

INSERT INTO courses (faculty_id, name, code)
SELECT 
    f.id,
    'Introduction to Programming',
    'CS 101'
FROM faculties f
WHERE f.name = 'Mühendislik Fakültesi'
ON CONFLICT (faculty_id, code) DO NOTHING;

-- Sample instructors
INSERT INTO instructors (name) VALUES
    ('Prof. Dr. Ahmet Yılmaz'),
    ('Doç. Dr. Ayşe Demir'),
    ('Dr. Öğr. Üyesi Mehmet Kaya')
ON CONFLICT DO NOTHING;
*/
