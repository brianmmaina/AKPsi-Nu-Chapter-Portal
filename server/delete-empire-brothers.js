/**
 * Script to delete all brothers and relationships for the EMPIRE family
 * 
 * Usage:
 *   node server/delete-empire-brothers.js
 * 
 * Make sure your .env file has DATABASE_URL set
 */

import dotenv from 'dotenv';
import pg from 'pg';
const { Pool } = pg;

dotenv.config();

// Get database URL from environment
const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('ERROR: DATABASE_URL environment variable must be set');
  process.exit(1);
}

// SSL configuration for Supabase
function getSSLConfig() {
  if (dbUrl.includes('supabase')) {
    return { rejectUnauthorized: false };
  }
  return false;
}

const pool = new Pool({
  connectionString: dbUrl,
  ssl: getSSLConfig(),
});

async function deleteEmpireBrothers() {
  try {
    console.log('🗑️  Deleting EMPIRE family brothers and relationships...\n');
    
    // First, get the EMPIRE family ID
    const familyResult = await pool.query(
      "SELECT id FROM families WHERE name = 'EMPIRE'"
    );
    
    if (familyResult.rows.length === 0) {
      console.log('❌ EMPIRE family not found in database');
      return;
    }
    
    const familyId = familyResult.rows[0].id;
    console.log(`Found EMPIRE family (ID: ${familyId})\n`);
    
    // Get list of brothers before deleting
    const brothersResult = await pool.query(
      'SELECT id, name FROM brothers WHERE family_id = $1',
      [familyId]
    );
    
    if (brothersResult.rows.length === 0) {
      console.log('✅ No brothers found in EMPIRE family. Nothing to delete.');
      return;
    }
    
    console.log(`Found ${brothersResult.rows.length} brother(s) to delete:`);
    brothersResult.rows.forEach(b => {
      console.log(`  - ${b.name} (ID: ${b.id})`);
    });
    console.log('');
    
    // Delete relationships first (foreign key constraint)
    const relationshipsResult = await pool.query(
      'DELETE FROM relationships WHERE family_id = $1',
      [familyId]
    );
    console.log(`✓ Deleted ${relationshipsResult.rowCount} relationship(s)`);
    
    // Delete brothers
    const deleteResult = await pool.query(
      'DELETE FROM brothers WHERE family_id = $1',
      [familyId]
    );
    console.log(`✓ Deleted ${deleteResult.rowCount} brother(s)`);
    
    console.log('\n✅ Successfully deleted all EMPIRE brothers and relationships!');
    console.log('You can now re-add them using the admin panel with proper relationships.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

deleteEmpireBrothers().catch(err => {
  console.error(err);
  process.exit(1);
});

