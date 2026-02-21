
import { createClient } from'@supabase/supabase-js';
import dotenv from'dotenv';
import path from'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname,'../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
 console.error('Missing Supabase credentials in .env.local');
 process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const fs = require('fs');

function log(message: string) {
 console.log(message);
 fs.appendFileSync('diagnosis_log.txt', message +'\n');
}

async function diagnoseHierarchy() {
 // Clear log file
 fs.writeFileSync('diagnosis_log.txt','');

 log('🔍 Starting Hierarchy Diagnosis...\n');

 // 1. Fetch all faculties
 const { data: faculties, error } = await supabase
 .from('faculties')
 .select('*')
 .order('name');

 if (error) {
 log(`Error fetching faculties: ${error.message}`);
 return;
 }

 if (!faculties || faculties.length === 0) {
 log('No faculties found.');
 return;
 }

 log(`Found ${faculties.length} total faculty/department entries.\n`);

 const facultiesById = new Map(faculties.map(f => [f.id, f]));
 let issuesFound = 0;

 // 2. Identify Potential Roots (Top-Level Faculties)
 const roots = faculties.filter(f => !f.parent_id);
 log(`--- Top Level Faculties (${roots.length}) ---`);
 roots.forEach(f => {
 // Check if it looks like a department (e.g. contains "Mühendisliği", "Engineering")
 const nameLower = f.name.toLowerCase();
 const suspicious = nameLower.includes('mühendisliği') ||
 nameLower.includes('engineering') ||
 nameLower.includes('bölümü') ||
 nameLower.includes('department');

 if (suspicious) {
 log(`⚠️ SUSPICIOUS ROOT: "${f.name}"(ID: ${f.id}) - Looks like a department but has no parent.`);
 issuesFound++;
 } else {
 log(`✅ "${f.name}"`);
 }
 });
 log('');

 // 3. Check for Orphaned Children (Parent ID exists but parent not found)
 log('--- checking Child Validity ---');
 const children = faculties.filter(f => f.parent_id);
 children.forEach(f => {
 if (!facultiesById.has(f.parent_id)) {
 log(`❌ ORPHAN: "${f.name}"points to non-existent parent ${f.parent_id}`);
 issuesFound++;
 } else {
 const parent = facultiesById.get(f.parent_id);
 // Optional: Check if parent looks like a faculty
 // log(` "${f.name}"-> "${parent.name}"`);
 }
 });

 if (children.length === 0) {
 log('No child departments found (Flattened hierarchy?).');
 } else {
 log(`Checked ${children.length} child departments.`);
 }
 log('');

 // 4. Check for Empty Faculties (Roots with no children and no courses - approximate check)
 // We'd need to fetch courses count to be sure, but let's just check children for now.
 const parentIds = new Set(children.map(c => c.parent_id));
 const emptyRoots = roots.filter(r => !parentIds.has(r.id));

 if (emptyRoots.length > 0) {
 log(`--- Potentially Empty Roots (No Child Departments) ---`);
 // Warning: They might have courses directly linked, so checking courses is important usually.
 // But in this strict hierarchy (Faculty -> Dept -> Course), a Faculty shouldn't have courses directly if it's a container.
 // However, the migration said "Top-Level Faculty -> Department -> Courses". 
 // So if a root has no depts, it might be unused.
 emptyRoots.forEach(r => {
 log(`❓ "${r.name}"has no sub-departments.`);
 });
 log('');
 }

 log('--- Diagnosis Complete ---');
 if (issuesFound > 0) {
 log(`found ${issuesFound} potential issues.`);
 } else {
 log('✅ Structure looks consistent (no obvious orphans or suspicious roots).');
 }
}

diagnoseHierarchy();
