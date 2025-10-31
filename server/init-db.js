import Database from 'better-sqlite3';
import fs from 'fs';

const db = new Database('database.sqlite');

// Create families table
db.exec(`
  CREATE TABLE IF NOT EXISTS families (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    theme TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Create brothers table
db.exec(`
  CREATE TABLE IF NOT EXISTS brothers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    family_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    pledge_class TEXT,
    graduation_year INTEGER,
    major TEXT,
    career_aspirations TEXT,
    fun_facts TEXT,
    status TEXT NOT NULL DEFAULT 'studying' CHECK(status IN ('studying', 'graduated')),
    is_transfer INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (family_id) REFERENCES families(id)
  )
`);

// Create relationships table (Big-Little connections)
db.exec(`
  CREATE TABLE IF NOT EXISTS relationships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    family_id INTEGER NOT NULL,
    big_id INTEGER,
    little_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (family_id) REFERENCES families(id),
    FOREIGN KEY (big_id) REFERENCES brothers(id),
    FOREIGN KEY (little_id) REFERENCES brothers(id),
    UNIQUE(family_id, little_id)
  )
`);

// Insert default families
const insertFamily = db.prepare(`
  INSERT OR IGNORE INTO families (name, theme) VALUES (?, ?)
`);

insertFamily.run('WOLFPACK', 'wolfpack');
insertFamily.run('PRIDE', 'pride');
insertFamily.run('POWER', 'power');
insertFamily.run('GREED', 'greed');
insertFamily.run('EMPIRE', 'empire');

console.log('Database initialized successfully!');
console.log('Families created: WOLFPACK, PRIDE, POWER, GREED, EMPIRE');

db.close();

