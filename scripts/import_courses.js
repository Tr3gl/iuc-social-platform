const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
require('dotenv');

// ============================================================================
// LOAD ENV VARS
// ============================================================================
try {
    require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
} catch (e) {
    console.warn("⚠️ Could not load .env.local file", e);
}

console.log("DEBUG: SUPABASE_URL exists?", !!process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log("DEBUG: SUPABASE_KEY exists?", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// ============================================================================
// CONFIGURATION
// ============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const COURSES_DIR = path.join(__dirname, 'courses');

// ============================================================================
// SCRIPT
// ============================================================================

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function cleanFacultyName(filename) {
    // Extract department name from filename patterns like:
    // "Master Course Database for Computer Engineering 2025-2026 - Table 1.csv"
    // "Master Course Database for the Chemical Engineering Department 25-26..."

    let name = filename.replace(/\.csv$/i, '');

    // Remove common prefixes/suffixes
    name = name.replace(/Master Course Database for (the )?/i, '');
    name = name.replace(/ \d{4}-\d{4}/, ''); // 2025-2026
    name = name.replace(/ \d{2}-\d{2}/, ''); // 25-26
    name = name.replace(/ - Table \d+/, '');
    name = name.replace(/ - Sheet\d+/, '');

    // Clean up
    name = name.trim();

    // Add "Fakültesi" or "Bölümü" if you want localized names, but keeping original for now.
    // Maybe better to map English to Turkish if possible, but let's stick to the file header for now.
    return name;
}

async function getOrCreateFaculty(name) {
    // 1. Check existence
    const { data: existing } = await supabase
        .from('faculties')
        .select('id')
        .ilike('name', name) // Case insensitive check
        .single();

    if (existing) return existing.id;

    // 2. Create if not exists
    console.log(`  ✨ Creating new Faculty: ${name}`);
    const { data: newFaculty, error } = await supabase
        .from('faculties')
        .insert({ name: name })
        .select('id')
        .single();

    if (error) {
        console.error(`  ❌ Error creating faculty ${name}:`, error.message);
        return null;
    }
    return newFaculty.id;
}

async function importCourses() {
    console.log("🚀 Starting import from scripts/courses/ ...");

    if (!fs.existsSync(COURSES_DIR)) {
        console.error(`❌ Directory not found: ${COURSES_DIR}`);
        return;
    }

    const files = fs.readdirSync(COURSES_DIR).filter(f => f.toLowerCase().endsWith('.csv'));

    if (files.length === 0) {
        console.warn("⚠️ No CSV files found in scripts/courses/");
        return;
    }

    console.log(`📂 Found ${files.length} files to process.\n`);

    for (const file of files) {
        const filePath = path.join(COURSES_DIR, file);
        const facultyName = cleanFacultyName(file);

        console.log(`\n---------------------------------------------------`);
        console.log(`📄 Processing File: ${file}`);
        console.log(`🏫 Target Faculty: ${facultyName}`);
        console.log(`---------------------------------------------------`);

        const facultyId = await getOrCreateFaculty(facultyName);
        if (!facultyId) {
            console.warn(`⚠️ Skipping file due to faculty creation error.`);
            continue;
        }

        const fileContent = fs.readFileSync(filePath, 'utf-8');
        // Remove BOM if present (Excel often adds it)
        const cleanContent = fileContent.replace(/^\uFEFF/, '');

        const records = parse(cleanContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
            relax_column_count: true, // Handle messy rows
        });

        console.log(`  Found ${records.length} courses.`);

        for (const row of records) {
            try {
                const courseCode = row['Course Code'] || row['Code'];
                const courseName = row['Course Name'] || row['Name'];

                // Skip header repetitions or empty rows
                if (!courseCode || !courseName || courseCode === 'Course Code') continue;

                // Extract Instructor
                let instructorId = null;
                let instructorName = row['Instructor Name'] || row['Instructor'];

                // Clean instructor name (remove quotes, brackets if any)
                if (instructorName) {
                    instructorName = instructorName.replace(/^"|"$/g, '').trim();

                    if (instructorName.length > 2) { // meaningful name
                        const { data: existingInstr } = await supabase
                            .from('instructors')
                            .select('id')
                            .eq('name', instructorName)
                            .single();

                        if (existingInstr) {
                            instructorId = existingInstr.id;
                        } else {
                            const { data: newInstr } = await supabase
                                .from('instructors')
                                .insert({ name: instructorName })
                                .select('id')
                                .single();
                            if (newInstr) instructorId = newInstr.id;
                        }
                    }
                }

                const courseData = {
                    faculty_id: facultyId,
                    name: courseName,
                    code: courseCode,
                    credit_theory: parseInt(row['TK']) || 0,
                    ects: parseInt(row['AKTS']) || 0,
                    course_type: row['Type'],
                    class_type: row['Class Type'],
                    semester: parseInt(row['Semester']) || null,
                };

                // Check & Upsert Course
                const { data: existingCourse } = await supabase
                    .from('courses')
                    .select('id')
                    .eq('code', courseCode)
                    .eq('faculty_id', facultyId)
                    .single();

                let courseId = existingCourse?.id;

                if (existingCourse) {
                    await supabase.from('courses').update(courseData).eq('id', courseId);
                    // console.log(`    Updated: ${courseCode}`);
                } else {
                    const { data: newCourse } = await supabase.from('courses').insert(courseData).select('id').single();
                    if (newCourse) {
                        courseId = newCourse.id;
                        console.log(`    ✅ Added: ${courseCode}`);
                    }
                }

                // Link Instructor
                if (courseId && instructorId) {
                    const { data: link } = await supabase
                        .from('course_instructors')
                        .select('*')
                        .eq('course_id', courseId)
                        .eq('instructor_id', instructorId)
                        .single();

                    if (!link) {
                        await supabase.from('course_instructors').insert({
                            course_id: courseId,
                            instructor_id: instructorId
                        });
                    }
                }

            } catch (err) {
                console.error(`  ❌ Row Error (${row['Course Code']}):`, err.message);
            }
        }
    }

    console.log("\n✅ Global Import Complete!");
}

importCourses();
