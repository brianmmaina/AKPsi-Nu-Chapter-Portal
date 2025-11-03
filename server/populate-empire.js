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

// Get Empire family ID
async function getEmpireFamilyId() {
  const result = await pool.query("SELECT id FROM families WHERE name = 'EMPIRE'");
  if (result.rows.length === 0) {
    throw new Error('EMPIRE family not found in database');
  }
  return result.rows[0].id;
}

// Create a brother
async function createBrother(familyId, data) {
  const {
    name,
    pledge_class = null,
    graduation_year = null,
    major = null,
    career_aspirations = null,
    fun_facts = null,
    status = 'studying',
    is_transfer = false,
    big_id = null
  } = data;

  if (!name) {
    throw new Error('Name is required');
  }

  // Insert brother
  const insertResult = await pool.query(`
    INSERT INTO brothers (family_id, name, pledge_class, graduation_year, major, career_aspirations, fun_facts, status, is_transfer)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING id
  `, [
    familyId,
    name,
    pledge_class || null,
    graduation_year || null,
    major || null,
    career_aspirations || null,
    fun_facts || null,
    status,
    is_transfer ? 1 : 0
  ]);

  const brotherId = insertResult.rows[0].id;
  console.log(`✓ Created brother: ${name} (ID: ${brotherId})`);

  // Create relationship if big_id is provided
  if (big_id) {
    await pool.query(`
      INSERT INTO relationships (family_id, big_id, little_id)
      VALUES ($1, $2, $3)
      ON CONFLICT (family_id, little_id) DO NOTHING
    `, [familyId, big_id, brotherId]);
    console.log(`  └─ Linked as little of ID ${big_id}`);
  }

  return brotherId;
}

// Main function to populate Empire family
async function populateEmpire() {
  try {
    console.log('🌆 Populating EMPIRE Family Tree...\n');
    
    const familyId = await getEmpireFamilyId();
    console.log(`Found EMPIRE family (ID: ${familyId})\n`);

    // EXAMPLE DATA STRUCTURE - Replace with actual Empire family members
    // You can organize this hierarchically by providing big_id references
    
    const empireMembers = [
      // Root members (no big_id)
      {
        name: 'Example Founder',
        pledge_class: 'Alpha',
        graduation_year: 2020,
        major: 'Business Administration',
        status: 'graduated',
        is_transfer: false,
        big_id: null
      },
      // Add more members here...
      // {
      //   name: 'Example Little',
      //   pledge_class: 'Beta',
      //   graduation_year: 2021,
      //   major: 'Finance',
      //   status: 'graduated',
      //   big_id: <ID of big brother>
      // },
    ];

    if (empireMembers.length === 0) {
      console.log('⚠️  No members defined in the script.');
      console.log('📝 Edit server/populate-empire.js to add Empire family members.\n');
      console.log('Example structure:');
      console.log(`
const empireMembers = [
  {
    name: 'Member Name',
    pledge_class: 'Alpha',
    graduation_year: 2024,
    major: 'Business',
    status: 'studying',
    big_id: null  // null for root members
  },
  {
    name: 'Little Member',
    pledge_class: 'Beta',
    graduation_year: 2025,
    big_id: 1  // ID of the big brother (will be set automatically)
  }
];
      `);
      return;
    }

    const idMap = new Map(); // Map to track created IDs for relationships
    
    for (const member of empireMembers) {
      // If big_id is a string/name, resolve it to an actual ID
      let resolvedBigId = member.big_id;
      if (typeof member.big_id === 'string') {
        // Look for the big brother by name in our created members
        const bigBrotherEntry = empireMembers.find(m => m.name === member.big_id);
        if (bigBrotherEntry && idMap.has(bigBrotherEntry.name)) {
          resolvedBigId = idMap.get(bigBrotherEntry.name);
        } else {
          console.log(`⚠️  Warning: Could not find big brother "${member.big_id}" for ${member.name}`);
          resolvedBigId = null;
        }
      }
      
      const createdId = await createBrother(familyId, {
        ...member,
        big_id: resolvedBigId
      });
      
      // Store the created ID if we have a name reference
      if (member.name) {
        idMap.set(member.name, createdId);
      }
    }

    console.log('\n✅ Empire family tree populated successfully!');
    console.log(`📊 Created ${empireMembers.length} member(s)\n`);

  } catch (error) {
    console.error('❌ Error populating Empire family:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the script
populateEmpire().catch(err => {
  console.error(err);
  process.exit(1);
});

