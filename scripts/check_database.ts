import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
    // 1. Fetch all faculties
    const { data: faculties, error: facultiesError } = await supabase
        .from('faculties')
        .select('*')
        .order('name');

    if (facultiesError) {
        console.error(`Error fetching faculties: ${facultiesError.message}`);
        return;
    }

    // Separate top-level faculties and departments
    const topLevel = faculties?.filter(f => !f.parent_id) || [];
    const departments = faculties?.filter(f => f.parent_id) || [];

    // 2. Check courses
    const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('id, name, code, faculty_id')
        .order('name')
        .limit(30);

    // Check which entries have Turkish characters in name
    const turkishChars = ['g', 'u', 's', 'i', 'o', 'c']; // simplified
    const hasTurkish = (name: string) => {
        const turkishPatterns = ['Fakültesi', 'Mühendisliği', 'Bölümü', 'ğ', 'ü', 'ş', 'ı', 'ö', 'ç', 'İ'];
        return turkishPatterns.some(p => name.includes(p));
    };

    const untranslatedFaculties = faculties?.filter(f => hasTurkish(f.name)) || [];

    const result = {
        topLevelFaculties: topLevel.map(f => ({
            name: f.name,
            name_tr: f.name_tr,
            hasTurkish: hasTurkish(f.name)
        })),
        departments: departments.map(f => {
            const parent = faculties?.find(p => p.id === f.parent_id);
            return {
                name: f.name,
                name_tr: f.name_tr,
                parent: parent?.name || 'Unknown',
                hasTurkish: hasTurkish(f.name)
            };
        }),
        sampleCourses: courses?.map(c => {
            const faculty = faculties?.find(f => f.id === c.faculty_id);
            return {
                name: c.name,
                code: c.code,
                faculty: faculty?.name || 'Unknown'
            };
        }) || [],
        summary: {
            totalFaculties: topLevel.length,
            totalDepartments: departments.length,
            totalCourses: courses?.length || 0,
            untranslatedCount: untranslatedFaculties.length,
            untranslatedNames: untranslatedFaculties.map(f => f.name)
        }
    };

    // Write to JSON file
    fs.writeFileSync(
        path.resolve(__dirname, 'database_check_result.json'),
        JSON.stringify(result, null, 2),
        'utf8'
    );

    console.log('Database check complete. Results written to scripts/database_check_result.json');
    console.log(JSON.stringify(result.summary, null, 2));
}

checkDatabase();
