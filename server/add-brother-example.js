// Example script for adding brothers manually
// Usage: node add-brother-example.js

import Database from 'better-sqlite3';

const db = new Database('database.sqlite');

// Example: Add a brother to WOLFPACK family
const addBrother = db.prepare(`
  INSERT INTO brothers (family_id, name, pledge_class, graduation_year, major, career_aspirations, fun_facts, status, is_transfer)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

// Example: Create a relationship (Big -> Little)
const addRelationship = db.prepare(`
  INSERT INTO relationships (family_id, big_id, little_id)
  VALUES (?, ?, ?)
`);

// Get family ID
const getFamily = db.prepare('SELECT id FROM families WHERE name = ?');

// Example usage:
try {
  // Find WOLFPACK family
  const wolfpack = getFamily.get('WOLFPACK');
  
  if (!wolfpack) {
    console.log('WOLFPACK family not found. Make sure to run init-db.js first.');
    process.exit(1);
  }

  // Add a brother
  const result = addBrother.run(
    wolfpack.id,              // family_id
    'John Doe',              // name
    'Alpha Alpha',           // pledge_class
    2026,                    // graduation_year
    'Computer Science',      // major
    'Software Engineer',     // career_aspirations
    'Loves coding and dogs', // fun_facts
    'studying',              // status (studying or graduated)
    0                        // is_transfer (0 or 1)
  );

  const newBrotherId = result.lastInsertRowid;
  console.log(`Added brother with ID: ${newBrotherId}`);

  // If this brother has a Big (parent), create the relationship
  // Uncomment and modify the big_id below:
  // const bigId = 1; // Replace with the ID of the Big
  // addRelationship.run(wolfpack.id, bigId, newBrotherId);
  // console.log(`Created relationship: Big ID ${bigId} -> Little ID ${newBrotherId}`);

} catch (error) {
  console.error('Error:', error.message);
} finally {
  db.close();
}

