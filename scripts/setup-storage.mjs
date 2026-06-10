/**
 * One-shot script: creates the `profile-photos` Supabase Storage bucket
 * and sets it to public read access.
 *
 * Run once:
 *   SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key> node scripts/setup-storage.mjs
 *
 * Get the service role key from:
 *   Supabase Dashboard → Project Settings → API → service_role (secret)
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://utsdztmgacqvcllgvdgo.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('ERROR: Set SUPABASE_SERVICE_ROLE_KEY env var before running this script.');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=your_key node scripts/setup-storage.mjs');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function main() {
  const BUCKET = 'profile-photos';

  // Check if bucket already exists
  const { data: buckets, error: listErr } = await supabase.storage.listBuckets();
  if (listErr) { console.error('Failed to list buckets:', listErr.message); process.exit(1); }

  const exists = buckets.some(b => b.name === BUCKET);

  if (exists) {
    console.log(`Bucket "${BUCKET}" already exists — updating to public.`);
    const { error } = await supabase.storage.updateBucket(BUCKET, { public: true });
    if (error) { console.error('Failed to update bucket:', error.message); process.exit(1); }
  } else {
    console.log(`Creating bucket "${BUCKET}"...`);
    const { error } = await supabase.storage.createBucket(BUCKET, {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      fileSizeLimit: 5242880, // 5 MB
    });
    if (error) { console.error('Failed to create bucket:', error.message); process.exit(1); }
  }

  console.log(`✓ Bucket "${BUCKET}" is ready with public read access.`);
  console.log('');
  console.log('Next: add your anon key to client/.env.local:');
  console.log('  VITE_SUPABASE_ANON_KEY=<your_anon_key>');
  console.log('');
  console.log('Get both keys from: Supabase Dashboard → Project Settings → API');
}

main();
