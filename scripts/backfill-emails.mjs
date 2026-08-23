/**
 * One-shot script: fills the `email` column on the `brothers` table from a
 * local JSON file of { name, email } pairs, matching on a normalised name.
 *
 * The chapter roster carries emails for only a fraction of its brothers, which
 * blocks anything that identifies a person by their address. The source data
 * is PII and deliberately lives OUTSIDE this repo — pass it in by path.
 *
 * Run once:
 *   DATABASE_URL=<supabase_session_pooler_url> \
 *     node scripts/backfill-emails.mjs ./email-backfill.json
 *
 * Add --commit to actually write; without it the script only reports what it
 * would change. Existing non-empty emails are never overwritten.
 */

import { readFileSync } from 'node:fs';
import pg from 'pg';

const [, , dataPath] = process.argv;
const COMMIT = process.argv.includes('--commit');

if (!process.env.DATABASE_URL) {
  console.error('ERROR: set DATABASE_URL before running.');
  process.exit(1);
}
if (!dataPath) {
  console.error('ERROR: pass the path to the { name, email } JSON file.');
  console.error('  node scripts/backfill-emails.mjs ./email-backfill.json [--commit]');
  process.exit(1);
}

const norm = (n) => (n || '').toLowerCase().replace(/[^a-z]/g, '');

const pairs = JSON.parse(readFileSync(dataPath, 'utf8'));
const byName = new Map();
for (const { name, email } of pairs) {
  if (name && email && !byName.has(norm(name))) byName.set(norm(name), email.trim());
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const { rows } = await pool.query(
  "SELECT id, name FROM brothers WHERE email IS NULL OR TRIM(email) = ''",
);

const updates = [];
for (const row of rows) {
  const email = byName.get(norm(row.name));
  if (email) updates.push({ id: row.id, name: row.name, email });
}

console.log(`${rows.length} brothers have no email on record.`);
console.log(`${updates.length} of them can be matched by name.`);
console.log(`${rows.length - updates.length} will still have none — they need collecting by hand.`);

if (!COMMIT) {
  console.log('\nDry run. Re-run with --commit to write these:');
  for (const u of updates.slice(0, 10)) console.log(`  ${u.name} → ${u.email}`);
  if (updates.length > 10) console.log(`  ...and ${updates.length - 10} more`);
} else {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const u of updates) {
      await client.query(
        'UPDATE brothers SET email = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [u.email, u.id],
      );
    }
    await client.query('COMMIT');
    console.log(`\nWrote ${updates.length} emails.`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Rolled back:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
  }
}

await pool.end();
