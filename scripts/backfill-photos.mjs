/**
 * One-shot script: fills `profile_image_url` on the `brothers` table from
 * the portal's Firestore `alumni`/`brothers` collections (field
 * `profileImageUrl`), matching by lowercased email.
 *
 * Real, officer-reviewed profile photos already exist in that Firestore
 * project (its own upload-and-approval workflow) — this pulls them in
 * rather than waiting for everyone to sign into Google here individually.
 * Mirrors the same "don't clobber a good photo" rule as the sync-photo
 * route in server/server.js: only writes when the current value is empty
 * or a known-dead LinkedIn CDN URL (those expire a few months after import).
 *
 * Run once:
 *   DATABASE_URL=<supabase_session_pooler_url> \
 *   GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json \
 *     node scripts/backfill-photos.mjs
 *
 * Add --commit to actually write; without it the script only reports what
 * it would change.
 */

import pg from 'pg';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'node:fs';

const COMMIT = process.argv.includes('--commit');

if (!process.env.DATABASE_URL) {
  console.error('ERROR: set DATABASE_URL before running.');
  process.exit(1);
}
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('ERROR: set GOOGLE_APPLICATION_CREDENTIALS to the service account key path.');
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const norm = (email) => (email || '').toLowerCase().trim();

const byEmail = new Map();
for (const collectionName of ['alumni', 'brothers']) {
  const snap = await db.collection(collectionName).get();
  snap.forEach((doc) => {
    const data = doc.data();
    const email = norm(data.email);
    const photoUrl = (data.profileImageUrl || '').trim();
    if (email && photoUrl && !byEmail.has(email)) byEmail.set(email, photoUrl);
  });
}

console.log(`Found ${byEmail.size} Firestore profiles with a photo.`);

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const { rows } = await pool.query(`
  SELECT id, name, email FROM brothers
  WHERE email IS NOT NULL AND TRIM(email) != ''
    AND (
      profile_image_url IS NULL
      OR profile_image_url = ''
      OR profile_image_url LIKE '%media.licdn.com%'
    )
`);

const updates = [];
for (const row of rows) {
  const photoUrl = byEmail.get(norm(row.email));
  if (photoUrl) updates.push({ id: row.id, name: row.name, photoUrl });
}

console.log(`${rows.length} brothers have an email but no usable photo on record.`);
console.log(`${updates.length} of them can be matched to a Firestore photo.`);
console.log(`${rows.length - updates.length} will still have none — likely never uploaded one there either.`);

if (!COMMIT) {
  console.log('\nDry run. Re-run with --commit to write these:');
  for (const u of updates.slice(0, 10)) console.log(`  ${u.name} → ${u.photoUrl}`);
  if (updates.length > 10) console.log(`  ...and ${updates.length - 10} more`);
} else {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const u of updates) {
      await client.query(
        'UPDATE brothers SET profile_image_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [u.photoUrl, u.id],
      );
    }
    await client.query('COMMIT');
    console.log(`\nWrote ${updates.length} photos.`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Rolled back:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
  }
}

await pool.end();
