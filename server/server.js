import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Database from 'better-sqlite3';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security: Require password to be set (no default fallback)
const PASSWORD = process.env.PASSWORD;
if (!PASSWORD) {
  console.error('ERROR: PASSWORD environment variable must be set');
  process.exit(1);
}

// CORS: Restrict to frontend domain in production, allow all in dev
const FRONTEND_URL = process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' ? undefined : '*');
if (FRONTEND_URL && FRONTEND_URL !== '*') {
  app.use(cors({
    origin: FRONTEND_URL,
    credentials: true,
  }));
} else {
  app.use(cors());
}

app.use(express.json());

// Rate limiting middleware (simple in-memory store)
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

const rateLimit = (req, res, next) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const key = `rate_limit_${ip}`;
  const now = Date.now();
  
  const record = rateLimitStore.get(key);
  if (record) {
    // Clean old attempts
    const recentAttempts = record.attempts.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
    
    if (recentAttempts.length >= MAX_ATTEMPTS) {
      const timeLeft = Math.ceil((RATE_LIMIT_WINDOW - (now - recentAttempts[0])) / 1000 / 60);
      return res.status(429).json({ 
        error: `Too many attempts. Please try again in ${timeLeft} minute(s).` 
      });
    }
    
    recentAttempts.push(now);
    rateLimitStore.set(key, { attempts: recentAttempts });
  } else {
    rateLimitStore.set(key, { attempts: [now] });
  }
  
  // Cleanup old entries (every 100 requests)
  if (Math.random() < 0.01) {
    for (const [k, v] of rateLimitStore.entries()) {
      const filtered = v.attempts.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
      if (filtered.length === 0) {
        rateLimitStore.delete(k);
      }
    }
  }
  
  next();
};

// Input validation helpers
const validateString = (value, fieldName, maxLength = 500) => {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string`);
  }
  if (value.length > maxLength) {
    throw new Error(`${fieldName} exceeds maximum length of ${maxLength} characters`);
  }
  return value.trim() || null;
};

const validateInteger = (value, fieldName, min = null, max = null) => {
  if (value === undefined || value === null || value === '') return null;
  const num = parseInt(value, 10);
  if (isNaN(num)) {
    throw new Error(`${fieldName} must be a valid number`);
  }
  if (min !== null && num < min) {
    throw new Error(`${fieldName} must be at least ${min}`);
  }
  if (max !== null && num > max) {
    throw new Error(`${fieldName} must be at most ${max}`);
  }
  return num;
};

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Alpha Kappa Psi Family Trees API',
    status: 'running',
    endpoints: {
      families: '/api/families',
      familyTree: '/api/families/:familyId/tree',
      auth: '/api/auth'
    }
  });
});

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

// Auth endpoint (with rate limiting)
app.post('/api/auth', rateLimit, (req, res) => {
  const { password } = req.body;
  if (!password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Password required' });
  }
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
  try {
    const { family_id, name, pledge_class, graduation_year, major, career_aspirations, fun_facts, status, is_transfer, big_id } = req.body;
    
    // Validate inputs
    if (!family_id || !Number.isInteger(family_id) || family_id < 1) {
      return res.status(400).json({ error: 'Invalid family_id' });
    }
    
    const validatedName = validateString(name, 'Name', 100);
    if (!validatedName) {
      return res.status(400).json({ error: 'Name is required and cannot be empty' });
    }
    
    const validatedPledgeClass = validateString(pledge_class, 'Pledge Class', 50);
    const validatedMajor = validateString(major, 'Major', 100);
    const validatedCareerAspirations = validateString(career_aspirations, 'Career Aspirations', 1000);
    const validatedFunFacts = validateString(fun_facts, 'Fun Facts', 1000);
    const validatedGraduationYear = validateInteger(graduation_year, 'Graduation Year', 1950, 2100);
    const validatedStatus = status === 'graduated' ? 'graduated' : 'studying';
    const validatedIsTransfer = is_transfer === true || is_transfer === 1 ? 1 : 0;
    
    const insert = db.prepare(`
      INSERT INTO brothers (family_id, name, pledge_class, graduation_year, major, career_aspirations, fun_facts, status, is_transfer)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = insert.run(
      family_id,
      validatedName,
      validatedPledgeClass,
      validatedGraduationYear,
      validatedMajor,
      validatedCareerAspirations,
      validatedFunFacts,
      validatedStatus,
      validatedIsTransfer
    );
    
    const brotherId = result.lastInsertRowid;
    
    // Create relationship if big_id is provided
    if (big_id && Number.isInteger(big_id) && big_id > 0) {
      const insertRel = db.prepare(`
        INSERT INTO relationships (family_id, big_id, little_id)
        VALUES (?, ?, ?)
      `);
      insertRel.run(family_id, big_id, brotherId);
    }
    
    res.json({ id: brotherId, success: true });
  } catch (error) {
    console.error('Error creating brother:', error);
    res.status(400).json({ error: error.message || 'Invalid input data' });
  }
});

// Update brother
app.put('/api/brothers/:id', checkPassword, (req, res) => {
  try {
    const { id } = req.params;
    const brotherId = parseInt(id, 10);
    
    if (!brotherId || brotherId < 1) {
      return res.status(400).json({ error: 'Invalid brother ID' });
    }
    
    const { name, pledge_class, graduation_year, major, career_aspirations, fun_facts, status, is_transfer } = req.body;
    
    // Validate inputs
    const validatedName = validateString(name, 'Name', 100);
    if (!validatedName) {
      return res.status(400).json({ error: 'Name is required and cannot be empty' });
    }
    
    const validatedPledgeClass = validateString(pledge_class, 'Pledge Class', 50);
    const validatedMajor = validateString(major, 'Major', 100);
    const validatedCareerAspirations = validateString(career_aspirations, 'Career Aspirations', 1000);
    const validatedFunFacts = validateString(fun_facts, 'Fun Facts', 1000);
    const validatedGraduationYear = validateInteger(graduation_year, 'Graduation Year', 1950, 2100);
    const validatedStatus = status === 'graduated' ? 'graduated' : 'studying';
    const validatedIsTransfer = is_transfer === true || is_transfer === 1 ? 1 : 0;
    
    const update = db.prepare(`
      UPDATE brothers 
      SET name = ?, pledge_class = ?, graduation_year = ?, major = ?, 
          career_aspirations = ?, fun_facts = ?, status = ?, is_transfer = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    const result = update.run(
      validatedName,
      validatedPledgeClass,
      validatedGraduationYear,
      validatedMajor,
      validatedCareerAspirations,
      validatedFunFacts,
      validatedStatus,
      validatedIsTransfer,
      brotherId
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Brother not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating brother:', error);
    res.status(400).json({ error: error.message || 'Invalid input data' });
  }
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

