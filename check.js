const { Client } = require('pg');
const client = new Client({
  connectionString: "postgresql://postgres:kovan2026@db.zaynrjwwbroyljslysvl.supabase.co:5432/postgres" // Using password from .env.local
});

async function run() {
  try {
    await client.connect();
    const res = await client.query(`
      SELECT pg_get_constraintdef(c.oid) AS def 
      FROM pg_constraint c 
      JOIN pg_class t ON c.conrelid = t.oid 
      WHERE c.conname = 'reviews_exam_format_check';
    `);
    console.log("CONSTRAINT DEFINITION:", res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
run();
