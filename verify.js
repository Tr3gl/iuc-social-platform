require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Read from process env (we will pass them when running)
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(url, key);

async function main() {
    const { data, error } = await supabase.rpc('get_check_constraints');
    if (error) {
        // Fallback: direct sql querying if possible via REST, but usually not.
        console.error("RPC failed:", error.message);
        
        // Let's just try to insert a dummy review and see the exact error
        console.log("Attempting test inserts...");
        const payload = {
            course_id: "f81d4fae-7dec-11d0-a765-00a0c91e6bf6", 
            user_id: "f81d4fae-7dec-11d0-a765-00a0c91e6bf6", 
            difficulty: 3,
            usefulness: 3,
            workload: 3,
            exam_clarity: 3,
            attendance: 3,
            material_relevance: 3,
            exam_predictability: 3,
            difficulty_value_alignment: "well_balanced"
        };

        const formats = ["classical", "written", "test", "mix", "mixed", "project"];
        
        const valid = [];
        for (const mFormat of formats) {
            for (const fFormat of formats) {
                const { error: err } = await supabase.from('reviews').insert({ 
                    ...payload, 
                    midterm_format: mFormat,
                    final_format: fFormat,
                    exam_format: mFormat 
                });
                
                if (err) {
                    if (err.message.includes('reviews_user_id_fkey') || err.message.includes('reviews_course_id_fkey')) {
                        valid.push(`[${mFormat}, ${fFormat}]`);
                    }
                } else {
                    valid.push(`[${mFormat}, ${fFormat}]`);
                }
            }
        }
        console.log("----- VALID FORMATS -----");
        for (const v of valid) {
            console.log(v);
        }
        console.log("----- END -----");
    } else {
        console.log(data);
    }
}
main();
