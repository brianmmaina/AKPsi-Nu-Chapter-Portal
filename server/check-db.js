import dotenv from 'dotenv';
import pg from 'pg';

const { Pool } = pg;

dotenv.config();

// Initialize PostgreSQL connection
if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable must be set');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('render.com') || process.env.DATABASE_URL?.includes('supabase') 
    ? { rejectUnauthorized: false } 
    : false,
});

async function checkDatabase() {
  try {
    console.log('🔍 Checking database connection...\n');
    
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful\n');
    
    // Check families
    const familiesResult = await pool.query('SELECT * FROM families ORDER BY id');
    console.log(`📊 Families (${familiesResult.rows.length}):`);
    familiesResult.rows.forEach(f => {
      console.log(`   ID: ${f.id}, Name: ${f.name}, Theme: ${f.theme}`);
    });
    console.log('');
    
    // Check brothers
    const brothersResult = await pool.query(`
      SELECT b.*, f.name as family_name 
      FROM brothers b 
      JOIN families f ON b.family_id = f.id 
      ORDER BY b.created_at DESC 
      LIMIT 10
    `);
    console.log(`👥 Recent Brothers (showing last ${brothersResult.rows.length}):`);
    if (brothersResult.rows.length === 0) {
      console.log('   No brothers found in database');
    } else {
      brothersResult.rows.forEach(b => {
        console.log(`   ID: ${b.id}, Name: ${b.name}, Family: ${b.family_name}, Status: ${b.status}`);
        console.log(`      Created: ${b.created_at}`);
      });
    }
    console.log('');
    
    // Check relationships
    const relsResult = await pool.query(`
      SELECT r.*, 
             b1.name as big_name, 
             b2.name as little_name,
             f.name as family_name
      FROM relationships r
      JOIN families f ON r.family_id = f.id
      LEFT JOIN brothers b1 ON r.big_id = b1.id
      JOIN brothers b2 ON r.little_id = b2.id
      ORDER BY r.created_at DESC
      LIMIT 10
    `);
    console.log(`🔗 Recent Relationships (showing last ${relsResult.rows.length}):`);
    if (relsResult.rows.length === 0) {
      console.log('   No relationships found in database');
    } else {
      relsResult.rows.forEach(r => {
        console.log(`   Family: ${r.family_name}`);
        console.log(`   ${r.big_name || 'ROOT'} → ${r.little_name}`);
        console.log(`   Created: ${r.created_at}`);
      });
    }
    console.log('');
    
    // Count totals
    const totals = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM families) as families_count,
        (SELECT COUNT(*) FROM brothers) as brothers_count,
        (SELECT COUNT(*) FROM relationships) as relationships_count
    `);
    const counts = totals.rows[0];
    console.log('📈 Totals:');
    console.log(`   Families: ${counts.families_count}`);
    console.log(`   Brothers: ${counts.brothers_count}`);
    console.log(`   Relationships: ${counts.relationships_count}`);
    
  } catch (error) {
    console.error('❌ Error checking database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

checkDatabase().catch(err => {
  console.error(err);
  process.exit(1);
});

