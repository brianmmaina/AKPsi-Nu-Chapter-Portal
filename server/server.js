import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Database from 'better-sqlite3';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const PASSWORD = process.env.PASSWORD || 'changeme';

app.use(cors());
app.use(express.json());

// Initialize database connection
const dbPath = process.env.DATABASE_PATH || 'database.sqlite';
const db = new Database(dbPath);

// Ensure database is initialized (safe to run multiple times)
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS families (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      theme TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
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
    );
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
    );
  `);
  
  // Insert families if they don't exist
  const insertFamily = db.prepare(`INSERT OR IGNORE INTO families (name, theme) VALUES (?, ?)`);
  insertFamily.run('WOLFPACK', 'wolfpack');
  insertFamily.run('PRIDE', 'pride');
  insertFamily.run('POWER', 'power');
  insertFamily.run('GREED', 'greed');
  insertFamily.run('EMPIRE', 'empire');
} catch (error) {
  console.error('Database initialization error:', error);
}

// Password check middleware
const checkPassword = (req, res, next) => {
  const { password } = req.body;
  if (password === PASSWORD) {
    next();
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
};

// Auth endpoint
app.post('/api/auth', (req, res) => {
  const { password } = req.body;
  if (password === PASSWORD) {
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

// Get all families
app.get('/api/families', (req, res) => {
  const families = db.prepare('SELECT * FROM families ORDER BY name').all();
  res.json(families);
});

// Get family tree data
app.get('/api/families/:familyId/tree', (req, res) => {
  const { familyId } = req.params;
  
  // Get all brothers in this family
  const brothers = db.prepare(`
    SELECT * FROM brothers WHERE family_id = ?
  `).all(familyId);
  
  // Get all relationships in this family
  const relationships = db.prepare(`
    SELECT * FROM relationships WHERE family_id = ?
  `).all(familyId);
  
  res.json({ brothers, relationships });
});

// Get single brother
app.get('/api/brothers/:id', (req, res) => {
  const { id } = req.params;
  const brother = db.prepare('SELECT * FROM brothers WHERE id = ?').get(id);
  if (brother) {
    res.json(brother);
  } else {
    res.status(404).json({ error: 'Brother not found' });
  }
});

// Create new brother
app.post('/api/brothers', checkPassword, (req, res) => {
  const { family_id, name, pledge_class, graduation_year, major, career_aspirations, fun_facts, status, is_transfer, big_id } = req.body;
  
  const insert = db.prepare(`
    INSERT INTO brothers (family_id, name, pledge_class, graduation_year, major, career_aspirations, fun_facts, status, is_transfer)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const result = insert.run(
    family_id,
    name,
    pledge_class || null,
    graduation_year || null,
    major || null,
    career_aspirations || null,
    fun_facts || null,
    status || 'studying',
    is_transfer ? 1 : 0
  );
  
  const brotherId = result.lastInsertRowid;
  
  // Create relationship if big_id is provided
  if (big_id) {
    const insertRel = db.prepare(`
      INSERT INTO relationships (family_id, big_id, little_id)
      VALUES (?, ?, ?)
    `);
    insertRel.run(family_id, big_id, brotherId);
  }
  
  res.json({ id: brotherId, success: true });
});

// Update brother
app.put('/api/brothers/:id', checkPassword, (req, res) => {
  const { id } = req.params;
  const { name, pledge_class, graduation_year, major, career_aspirations, fun_facts, status, is_transfer } = req.body;
  
  const update = db.prepare(`
    UPDATE brothers 
    SET name = ?, pledge_class = ?, graduation_year = ?, major = ?, 
        career_aspirations = ?, fun_facts = ?, status = ?, is_transfer = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  
  update.run(
    name,
    pledge_class || null,
    graduation_year || null,
    major || null,
    career_aspirations || null,
    fun_facts || null,
    status || 'studying',
    is_transfer ? 1 : 0,
    id
  );
  
  res.json({ success: true });
});

// Update relationship (change Big)
app.put('/api/relationships/:littleId', checkPassword, (req, res) => {
  const { littleId } = req.params;
  const { family_id, big_id } = req.body;
  
  const update = db.prepare(`
    UPDATE relationships 
    SET big_id = ?
    WHERE family_id = ? AND little_id = ?
  `);
  
  update.run(big_id || null, family_id, littleId);
  
  res.json({ success: true });
});

// Create relationship (add Little to existing Big)
app.post('/api/relationships', checkPassword, (req, res) => {
  const { family_id, big_id, little_id } = req.body;
  
  const insert = db.prepare(`
    INSERT OR REPLACE INTO relationships (family_id, big_id, little_id)
    VALUES (?, ?, ?)
  `);
  
  insert.run(family_id, big_id, little_id);
  
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

