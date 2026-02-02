
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================================
// HIERARCHY MAPPING CONFIGURATION
// ============================================================================
// Define which faculties should contain which departments (regex or string match)

const HIERARCHY_MAP: Record<string, (string | RegExp)[]> = {
    'Mühendislik Fakültesi': [
        /Engineering/i,
        /Mühendislik/i,
        /Mühendisliği/i,
        /Computer/i,
        /Bilgisayar/i,
        /Electrical/i,
        /Elektrik/i,
        /Electronic/i,
        /Elektronik/i,
        /Industrial/i,
        /Endüstri/i,
        /Chemical/i,
        /Kimya Müh/i,
        /Civil/i,
        /İnşaat/i,
        /Mechanical/i,
        /Makine/i,
        /Mining/i,
        /Maden/i,
        /Geological/i,
        /Jeoloji/i,
        /Environmental/i,
        /Çevre/i,
        /Metallurgical/i,
        /Metalurji/i,
        /Bioengineering/i,
        /Biyomühendislik/i
    ],
    'Edebiyat Fakültesi': [
        /Literature/i,
        /Edebiyat/i,
        /History/i,
        /Tarih/i,
        /Psychology/i,
        /Psikoloji/i,
        /Sociology/i,
        /Sosyoloji/i,
        /Philosophy/i,
        /Felsefe/i
    ],
    'Fen Fakültesi': [
        /Science Faculty/i,
        /Physics/i,
        /Fizik/i,
        /Chemistry/i,
        /Kimya Bölümü/i, // Distinguish from Kimya Mühendisliği
        /Biology/i,
        /Biyoloji/i,
        /Mathematics/i,
        /Matematik/i,
        /Astronomy/i,
        /Astronomi/i
    ],
    'İktisat Fakültesi': [
        /Economics/i,
        /İktisat/i,
        /Economy/i
    ],
    'İşletme Fakültesi': [
        /Business/i,
        /İşletme/i
    ],
    'Siyasal Bilgiler Fakültesi': [
        /Political/i,
        /Siyasal/i
    ],
    'Orman Fakültesi': [
        /Forest/i,
        /Orman/i
    ],
    'Eğitim Fakültesi': [
        /Education/i,
        /Eğitim/i,
        /Teaching/i,
        /Öğretmenliği/i
    ],
    'Tıp Fakültesi': [
        /Medicine/i,
        /Tıp/i
    ]
};

// ============================================================================
// MAIN SCRIPT
// ============================================================================

async function fixHierarchy(dryRun = true) {
    console.log(`🚀 Starting Hierarchy Fix ${dryRun ? '(DRY RUN)' : '(LIVE FIX)'}...\n`);

    // 1. Fetch all faculties
    const { data: faculties, error } = await supabase
        .from('faculties')
        .select('*');

    if (error) {
        console.error('Error fetching faculties:', error);
        return;
    }

    // 2. Map Parent Names to IDs
    const parentMap = new Map<string, string>(); // Name -> ID
    const normalizedParentNames = Object.keys(HIERARCHY_MAP);

    // Pre-fill existing parents
    for (const f of faculties) {
        if (normalizedParentNames.includes(f.name)) {
            parentMap.set(f.name, f.id);
        }
    }

    // Create missing parent faculties if not dry run
    for (const parentName of normalizedParentNames) {
        if (!parentMap.has(parentName)) {
            console.log(`✨ Parent Faculty '${parentName}' not found.`);
            if (!dryRun) {
                const { data: newF, error: createErr } = await supabase
                    .from('faculties')
                    .insert({ name: parentName, parent_id: null })
                    .select('id')
                    .single();

                if (createErr) {
                    console.error(`Status: FAILED to create ${parentName}:`, createErr);
                } else {
                    parentMap.set(parentName, newF.id);
                    console.log(`   Created with ID: ${newF.id}`);
                }
            } else {
                console.log(`   [Action] Would create '${parentName}'`);
            }
        }
    }

    // 3. Iterate departments and link them
    let changesCount = 0;

    for (const f of faculties) {
        // Skip if it's one of the Top-Level Parents
        if (normalizedParentNames.includes(f.name)) continue;

        let matchedParentName: string | null = null;

        // Check against rules
        for (const [pName, rules] of Object.entries(HIERARCHY_MAP)) {
            for (const rule of rules) {
                if (rule instanceof RegExp) {
                    if (rule.test(f.name)) matchedParentName = pName;
                } else {
                    if (f.name.includes(rule as string)) matchedParentName = pName;
                }
                if (matchedParentName) break;
            }
            if (matchedParentName) break;
        }

        if (matchedParentName) {
            // Check if already correct
            const parentId = parentMap.get(matchedParentName);

            if (!parentId && dryRun) {
                // Parent doesn't exist yet in dry run
                // console.log(`   [Pending] Link '${f.name}' -> New '${matchedParentName}'`);
                continue;
            }

            if (f.parent_id !== parentId) {
                console.log(`🔗 Linking '${f.name}' -> '${matchedParentName}'`);
                changesCount++;

                if (!dryRun && parentId) {
                    const { error: updateErr } = await supabase
                        .from('faculties')
                        .update({ parent_id: parentId })
                        .eq('id', f.id);

                    if (updateErr) {
                        console.error(`   ❌ Failed to link: ${updateErr.message}`);
                    } else {
                        console.log(`   ✅ Success`);
                    }
                } else if (dryRun) {
                    console.log(`   [Action] Update parent_id to ${parentId || '(New Parent)'}`);
                }
            }
        }
    }

    console.log(`\n-----------------------------------`);
    if (changesCount === 0) {
        console.log(`✅ Hierarchy is clean. No changes needed.`);
    } else {
        console.log(`⚠️  Found ${changesCount} departments needing re-linking.`);
        if (dryRun) console.log(`   Run with 'npx tsx scripts/fix_hierarchy_map.ts --live' to apply changes.`);
    }
}

// Check args
const isLive = process.argv.includes('--live');
fixHierarchy(!isLive);
