require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(url, key);

async function inspectDb() {
    // If we want to read pg_constraint without psql, we can temporarily create a Postgres Function using raw REST via HTTP proxy, but Supabase blocks this via JS.
    // Instead, let's insert intentional failures to SEE the error messages of constraint violations!
    
    // We already know it fails with "new row for relation "reviews" violates check constraint "reviews_exam_format_check""
    // Let's insert a row with VERY intentional values:
    const payload = {
            course_id: "f81d4fae-7dec-11d0-a765-00a0c91e6bf6",
            user_id: "f81d4fae-7dec-11d0-a765-00a0c91e6bf6",
            difficulty: 3, usefulness: 3, workload: 3, exam_clarity: 3,
            attendance: 3, material_relevance: 3, exam_predictability: 3,
            difficulty_value_alignment: "well_balanced"
    };

    const fs = require('fs');
    const errors = {};

    console.log("Testing completely invalid string 'INVALID_STR'");
    let res = await supabase.from('reviews').insert({ ...payload, exam_format: 'INVALID_STR', midterm_format: 'written', final_format: 'written' });
    errors.INVALID_STR = res.error?.message;

    console.log("Testing INVALID_FIN for final_format");
    res = await supabase.from('reviews').insert({ ...payload, exam_format: 'written', midterm_format: 'written', final_format: 'INVALID_FIN' });
    errors.INVALID_FIN = res.error?.message;

    console.log("Testing classical for exam_format");
    res = await supabase.from('reviews').insert({ ...payload, exam_format: 'classical', midterm_format: 'written', final_format: 'written' });
    errors.CLASSICAL = res.error?.message;

    fs.writeFileSync('errors.json', JSON.stringify(errors, null, 2));
    console.log("Done");
}

inspectDb();
