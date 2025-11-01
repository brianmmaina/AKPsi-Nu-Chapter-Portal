import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pg from 'pg';

const { Pool } = pg;

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

// Initialize PostgreSQL connection
// Uses DATABASE_URL from Render PostgreSQL or local .env
if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable must be set');
  console.error('For Render: Make sure PostgreSQL database is created and linked to this service');
  console.error('For local: Set DATABASE_URL in server/.env file');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('render.com') || process.env.DATABASE_URL?.includes('supabase') 
    ? { rejectUnauthorized: false } 
    : false,
});

// Test connection
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Ensure database is initialized (safe to run multiple times)
async function initializeDatabase() {
  let retries = 5;
  let delay = 2000;
  
  while (retries > 0) {
    try {
      // Test connection first
      await pool.query('SELECT NOW()');
      
      // Create tables
      await pool.query(`
      CREATE TABLE IF NOT EXISTS families (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        theme TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

      await pool.query(`
      CREATE TABLE IF NOT EXISTS brothers (
        id SERIAL PRIMARY KEY,
        family_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        pledge_class TEXT,
        graduation_year INTEGER,
        major TEXT,
        career_aspirations TEXT,
        fun_facts TEXT,
        status TEXT NOT NULL DEFAULT 'studying' CHECK(status IN ('studying', 'graduated')),
        is_transfer INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (family_id) REFERENCES families(id)
      );
    `);

      await pool.query(`
      CREATE TABLE IF NOT EXISTS relationships (
        id SERIAL PRIMARY KEY,
        family_id INTEGER NOT NULL,
        big_id INTEGER,
        little_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (family_id) REFERENCES families(id),
        FOREIGN KEY (big_id) REFERENCES brothers(id),
        FOREIGN KEY (little_id) REFERENCES brothers(id),
        UNIQUE(family_id, little_id)
      );
    `);
    
      // Insert families if they don't exist
      await pool.query(`
      INSERT INTO families (name, theme) 
      VALUES 
        ('WOLFPACK', 'wolfpack'),
        ('PRIDE', 'pride'),
        ('POWER', 'power'),
        ('GREED', 'greed'),
        ('EMPIRE', 'empire')
      ON CONFLICT (name) DO NOTHING;
    `);
    
      console.log('Database initialized successfully');
      return; // Success, exit retry loop
    } catch (error) {
      retries--;
      if (retries === 0) {
        console.error('Database initialization failed after retries:', error);
        console.error('DATABASE_URL:', process.env.DATABASE_URL ? 'Set (hidden)' : 'NOT SET');
        throw error;
      }
      console.warn(`Database connection failed, retrying in ${delay}ms... (${retries} retries left)`);
      console.warn('Error:', error.message);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 1.5; // Exponential backoff
    }
  }
}

// Initialize on startup (don't exit on failure - let server start and retry on first request)
initializeDatabase().catch(err => {
  console.error('Failed to initialize database on startup:', err);
  console.error('The server will start but API requests may fail until database is connected.');
  console.error('');
  console.error('To fix this:');
  console.error('1. Ensure PostgreSQL database is created in Render');
  console.error('2. Link the database to this web service in Render dashboard');
  console.error('3. The DATABASE_URL environment variable will be auto-set by Render');
});

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
app.get('/api/families', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM families ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching families:', error);
    res.status(500).json({ error: 'Failed to fetch families' });
  }
});

// Get family tree data
app.get('/api/families/:familyId/tree', async (req, res) => {
  try {
    const { familyId } = req.params;
    
    // Get all brothers in this family
    const brothersResult = await pool.query(
      'SELECT * FROM brothers WHERE family_id = $1',
      [familyId]
    );
    
    // Get all relationships in this family
    const relationshipsResult = await pool.query(
      'SELECT * FROM relationships WHERE family_id = $1',
      [familyId]
    );
    
    res.json({ 
      brothers: brothersResult.rows, 
      relationships: relationshipsResult.rows 
    });
  } catch (error) {
    console.error('Error fetching family tree:', error);
    res.status(500).json({ error: 'Failed to fetch family tree' });
  }
});

// Get single brother
app.get('/api/brothers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM brothers WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Brother not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching brother:', error);
    res.status(500).json({ error: 'Failed to fetch brother' });
  }
});

// Create new brother
app.post('/api/brothers', checkPassword, async (req, res) => {
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
    
    const insertResult = await pool.query(`
      INSERT INTO brothers (family_id, name, pledge_class, graduation_year, major, career_aspirations, fun_facts, status, is_transfer)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `, [
      family_id,
      validatedName,
      validatedPledgeClass,
      validatedGraduationYear,
      validatedMajor,
      validatedCareerAspirations,
      validatedFunFacts,
      validatedStatus,
      validatedIsTransfer
    ]);
    
    const brotherId = insertResult.rows[0].id;
    
    // Create relationship if big_id is provided
    if (big_id && Number.isInteger(big_id) && big_id > 0) {
      await pool.query(`
        INSERT INTO relationships (family_id, big_id, little_id)
        VALUES ($1, $2, $3)
      `, [family_id, big_id, brotherId]);
    }
    
    res.json({ id: brotherId, success: true });
  } catch (error) {
    console.error('Error creating brother:', error);
    res.status(400).json({ error: error.message || 'Invalid input data' });
  }
});

// Update brother
app.put('/api/brothers/:id', checkPassword, async (req, res) => {
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
    
    const result = await pool.query(`
      UPDATE brothers 
      SET name = $1, pledge_class = $2, graduation_year = $3, major = $4, 
          career_aspirations = $5, fun_facts = $6, status = $7, is_transfer = $8,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
    `, [
      validatedName,
      validatedPledgeClass,
      validatedGraduationYear,
      validatedMajor,
      validatedCareerAspirations,
      validatedFunFacts,
      validatedStatus,
      validatedIsTransfer,
      brotherId
    ]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Brother not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating brother:', error);
    res.status(400).json({ error: error.message || 'Invalid input data' });
  }
});

// Update relationship (change Big)
app.put('/api/relationships/:littleId', checkPassword, async (req, res) => {
  try {
    const { littleId } = req.params;
    const { family_id, big_id } = req.body;
    
    await pool.query(`
      UPDATE relationships 
      SET big_id = $1
      WHERE family_id = $2 AND little_id = $3
    `, [big_id || null, family_id, littleId]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating relationship:', error);
    res.status(400).json({ error: error.message || 'Invalid input data' });
  }
});

// Create relationship (add Little to existing Big)
app.post('/api/relationships', checkPassword, async (req, res) => {
  try {
    const { family_id, big_id, little_id } = req.body;
    
    await pool.query(`
      INSERT INTO relationships (family_id, big_id, little_id)
      VALUES ($1, $2, $3)
      ON CONFLICT (family_id, little_id) 
      DO UPDATE SET big_id = EXCLUDED.big_id
    `, [family_id, big_id, little_id]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error creating relationship:', error);
    res.status(400).json({ error: error.message || 'Invalid input data' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
