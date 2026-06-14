import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pg from 'pg';
import jwt from 'jsonwebtoken';

const { Pool } = pg;

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ============================================================================
// CONSTANTS
// ============================================================================
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const MAX_ATTEMPTS = 20;
const SESSION_EXPIRY_HOURS = 24;
const JWT_EXPIRY_HOURS = 24;
const REQUEST_SIZE_LIMIT = '10mb';
const INIT_DB_RETRIES = 5;
const INIT_DB_INITIAL_DELAY = 2000;

// ============================================================================
// ENVIRONMENT VARIABLE VALIDATION
// ============================================================================
const requiredEnvVars = {
  PASSWORD: 'Password for API authentication',
  DATABASE_URL: 'PostgreSQL connection string',
};

for (const [key, description] of Object.entries(requiredEnvVars)) {
  if (!process.env[key]) {
    console.error(`ERROR: ${key} environment variable must be set`);
    console.error(`Description: ${description}`);
    process.exit(1);
  }
}

const PASSWORD = process.env.PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET || process.env.PASSWORD; // Fallback to password if not set
const FRONTEND_URL = process.env.FRONTEND_URL;

// ============================================================================
// LOGGING UTILITY (replaces console.log)
// ============================================================================
const logger = {
  info: (message, ...args) => {
    if (NODE_ENV === 'development') {
      console.log(`[INFO] ${message}`, ...args);
    }
  },
  error: (message, ...args) => {
    console.error(`[ERROR] ${message}`, ...args);
  },
  warn: (message, ...args) => {
    console.warn(`[WARN] ${message}`, ...args);
  },
};

// ============================================================================
// SECURITY MIDDLEWARE
// ============================================================================

// Explicit CORS headers before any other middleware so Render's proxy
// doesn't strip them on preflight requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// HTTPS enforcement in production (after CORS so preflight works)
if (NODE_ENV === 'production') {
  app.use((req, res, next) => {
    // Skip redirect for OPTIONS requests (CORS preflight)
    if (req.method === 'OPTIONS') {
      return next();
    }
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}

// Request size limits
app.use(express.json({ limit: REQUEST_SIZE_LIMIT }));

// Trust proxy for proper IP extraction (important for rate limiting)
app.set('trust proxy', 1);

// ============================================================================
// RATE LIMITING
// ============================================================================
const rateLimitStore = new Map();

// Improved IP extraction (handles proxy headers correctly)
const getClientIP = (req) => {
  // Trust proxy is set, so req.ip should work correctly
  // But also check x-forwarded-for and parse it properly
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    // X-Forwarded-For can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.connection.remoteAddress || 'unknown';
};

const checkRateLimit = (ip) => {
  const key = `rate_limit_${ip}`;
  const now = Date.now();
  
  const record = rateLimitStore.get(key);
  if (record) {
    const recentAttempts = record.attempts.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
    
    if (recentAttempts.length >= MAX_ATTEMPTS) {
      return { rateLimited: true, timeLeft: Math.ceil((RATE_LIMIT_WINDOW - (now - recentAttempts[0])) / 1000 / 60) };
    }
  }
  
  return { rateLimited: false };
};

const recordFailedAttempt = (ip) => {
  const key = `rate_limit_${ip}`;
  const now = Date.now();
  
  const record = rateLimitStore.get(key);
  if (record) {
    const recentAttempts = record.attempts.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
    recentAttempts.push(now);
    rateLimitStore.set(key, { attempts: recentAttempts });
  } else {
    rateLimitStore.set(key, { attempts: [now] });
  }
  
  // Cleanup old entries (1% chance per request)
  if (Math.random() < 0.01) {
    for (const [k, v] of rateLimitStore.entries()) {
      const filtered = v.attempts.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
      if (filtered.length === 0) {
        rateLimitStore.delete(k);
      }
    }
  }
};

const clearRateLimit = (ip) => {
  const key = `rate_limit_${ip}`;
  rateLimitStore.delete(key);
};

// ============================================================================
// JWT AUTHENTICATION
// ============================================================================

// Generate JWT token
const generateToken = (ip) => {
  return jwt.sign(
    { 
      authenticated: true,
      ip: ip,
      timestamp: Date.now()
    },
    JWT_SECRET,
    { expiresIn: `${JWT_EXPIRY_HOURS}h` }
  );
};

// Verify JWT token middleware
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired. Please login again.' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Legacy password check middleware (for backward compatibility with admin.html)
const checkPassword = (req, res, next) => {
  // First try JWT token
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return verifyToken(req, res, next);
  }
  
  // Fallback to password in body (for admin.html compatibility)
  const { password } = req.body;
  const trimmedPassword = password && typeof password === 'string' ? password.trim() : '';
  if (trimmedPassword === PASSWORD) {
    next();
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
};

// ============================================================================
// INPUT VALIDATION
// ============================================================================
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

// ============================================================================
// DATABASE CONNECTION
// ============================================================================
// Improved SSL configuration - verify certificates when possible
const getSSLConfig = () => {
  const dbUrl = process.env.DATABASE_URL || '';
  
  // Supabase requires SSL but may have certificate chain issues
  if (dbUrl.includes('supabase')) {
    // Supabase connection - allow self-signed certificates in chain
    return { rejectUnauthorized: false };
  }
  
  // Render uses valid SSL certificates
  if (dbUrl.includes('render.com')) {
    return { rejectUnauthorized: true };
  }
  
  // Local development - no SSL needed
  return false;
};

// Create connection pool with better error handling
// Handle Supabase connection issues - Railway needs Session Pooler (IPv4 compatible)
let dbUrl = process.env.DATABASE_URL || '';

// For Supabase on Railway, must use Session Pooler (IPv4 compatible)
// Direct connection is IPv6-only, convert to Session Pooler format
// Only convert if it's a direct connection (contains @db. and .supabase.co)
// Skip if already using pooler (contains pooler.supabase.com)
if (dbUrl.includes('supabase') && 
    dbUrl.includes('@db.') && 
    dbUrl.includes('.supabase.co:5432') &&
    !dbUrl.includes('pooler.supabase.com')) {
  // Extract project ref from direct connection URL
  // Format: postgresql://postgres:PASSWORD@db.PROJECTREF.supabase.co:5432/postgres
  const directMatch = dbUrl.match(/@db\.([^.]+)\.supabase\.co:5432/);
  if (directMatch) {
    const projectRef = directMatch[1].toLowerCase();
    // Convert to Session Pooler format:
    // postgresql://postgres.PROJECTREF:PASSWORD@aws-1-us-east-1.pooler.supabase.com:5432/postgres
    dbUrl = dbUrl
      .replace(/postgres@db\./, `postgres.${projectRef}@`)
      .replace(/@db\.([^.]+)\.supabase\.co:5432/, '@aws-1-us-east-1.pooler.supabase.com:5432');
    logger.info('Converted to Supabase Session Pooler (IPv4 compatible)');
  }
}

const poolConfig = {
  connectionString: dbUrl,
  ssl: getSSLConfig(),
  connectionTimeoutMillis: 20000,
  idleTimeoutMillis: 30000,
  max: 5, // Reduce pool size for pooler
  // Additional options to help with connection
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
};

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// ============================================================================
// DATABASE INITIALIZATION
// ============================================================================
async function initializeDatabase() {
  let retries = INIT_DB_RETRIES;
  let delay = INIT_DB_INITIAL_DELAY;
  
  while (retries > 0) {
    try {
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

      // Add updated_at to relationships table (migration)
      await pool.query(`
        CREATE TABLE IF NOT EXISTS relationships (
          id SERIAL PRIMARY KEY,
          family_id INTEGER NOT NULL,
          big_id INTEGER,
          little_id INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (family_id) REFERENCES families(id),
          FOREIGN KEY (big_id) REFERENCES brothers(id),
          FOREIGN KEY (little_id) REFERENCES brothers(id),
          UNIQUE(family_id, little_id)
        );
      `);
      
      // Add updated_at column if it doesn't exist (migration)
      await pool.query(`
        ALTER TABLE relationships 
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
      `);
      
      // Add profile_image_url column if it doesn't exist (migration)
      await pool.query(`
        ALTER TABLE brothers 
        ADD COLUMN IF NOT EXISTS profile_image_url TEXT;
      `);
      
      // Add links/social media columns if they don't exist (migration)
      await pool.query(`
        ALTER TABLE brothers 
        ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
        ADD COLUMN IF NOT EXISTS instagram_url TEXT,
        ADD COLUMN IF NOT EXISTS personal_website_url TEXT,
        ADD COLUMN IF NOT EXISTS email TEXT;
      `);
      
      // Create indexes for performance
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_brothers_family_id ON brothers(family_id);
      `);
      
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_relationships_family_id ON relationships(family_id);
      `);
      
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_relationships_little_id ON relationships(little_id);
      `);
      
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_relationships_big_id ON relationships(big_id);
      `);
      
      // Insert families
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
      
      logger.info('Database initialized successfully');
      return;
    } catch (error) {
      retries--;
      if (retries === 0) {
        logger.error('Database initialization failed after retries:', error.message);
        throw error;
      }
      logger.warn(`Database connection failed, retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 1.5;
    }
  }
}

initializeDatabase().catch(err => {
  logger.error('Failed to initialize database on startup:', err.message);
  logger.error('The server will start but API requests may fail until database is connected.');
});

// ============================================================================
// ERROR HANDLING MIDDLEWARE
// ============================================================================
const sanitizeError = (error, req) => {
  if (NODE_ENV === 'development') {
    return {
      error: error.message || 'An error occurred',
      stack: error.stack,
    };
  }
  
  // Production: generic error messages only
  if (error.code && error.code.startsWith('23')) {
    // PostgreSQL constraint violations
    return { error: 'Invalid data provided' };
  }
  
  return { error: 'An error occurred. Please try again later.' };
};

// ============================================================================
// ROUTES
// ============================================================================

// Health check endpoint - simple and fast
app.get('/health', (req, res) => {
  // Just return healthy - don't check database (it's slow and causes timeouts)
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Alpha Kappa Psi Family Trees API',
    status: 'running',
    endpoints: {
      health: '/health',
      families: '/api/families',
      familyTree: '/api/families/:familyId/tree',
      auth: '/api/auth'
    }
  });
});

// Auth endpoint (with rate limiting and JWT token generation)
app.post('/api/auth', (req, res) => {
  const ip = getClientIP(req);
  
  const rateLimitCheck = checkRateLimit(ip);
  if (rateLimitCheck.rateLimited) {
    return res.status(429).json({ 
      error: `Too many failed attempts. Please try again in ${rateLimitCheck.timeLeft} minute(s).` 
    });
  }
  
  const { password } = req.body;
  if (!password || typeof password !== 'string') {
    recordFailedAttempt(ip);
    return res.status(400).json({ error: 'Password required' });
  }
  
  const trimmedPassword = password.trim();
  
  if (trimmedPassword === PASSWORD) {
    clearRateLimit(ip);
    const token = generateToken(ip);
    res.json({ 
      success: true,
      token: token,
      expiresIn: `${JWT_EXPIRY_HOURS}h`
    });
  } else {
    recordFailedAttempt(ip);
    res.status(401).json({ error: 'Invalid password' });
  }
});

// Get all families
app.get('/api/families', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM families ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching families:', error.message);
    const sanitized = sanitizeError(error, req);
    res.status(500).json(sanitized);
  }
});

// Get family tree data
app.get('/api/families/:familyId/tree', async (req, res) => {
  try {
    const { familyId } = req.params;
    
    const brothersResult = await pool.query(
      'SELECT * FROM brothers WHERE family_id = $1',
      [familyId]
    );
    
    const relationshipsResult = await pool.query(
      'SELECT * FROM relationships WHERE family_id = $1',
      [familyId]
    );
    
    res.json({ 
      brothers: brothersResult.rows, 
      relationships: relationshipsResult.rows 
    });
  } catch (error) {
    logger.error('Error fetching family tree:', error.message);
    const sanitized = sanitizeError(error, req);
    res.status(500).json(sanitized);
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
    logger.error('Error fetching brother:', error.message);
    const sanitized = sanitizeError(error, req);
    res.status(500).json(sanitized);
  }
});

// Validate that big_id belongs to the same family
async function validateBigIdInFamily(familyId, bigId) {
  if (!bigId) return true; // null is valid (root node)
  
  const result = await pool.query(
    'SELECT family_id FROM brothers WHERE id = $1',
    [bigId]
  );
  
  if (result.rows.length === 0) {
    throw new Error('Big brother not found');
  }
  
  if (result.rows[0].family_id !== familyId) {
    throw new Error('Big brother must belong to the same family');
  }
  
  return true;
}

// Create new brother
app.post('/api/brothers', checkPassword, async (req, res) => {
  try {
    const {
      family_id,
      name,
      pledge_class,
      graduation_year,
      major,
      career_aspirations,
      fun_facts,
      status,
      is_transfer,
      big_id,
      profile_image_url,
      linkedin_url,
      instagram_url,
      personal_website_url,
      email,
    } = req.body;
    
    const familyIdNum = parseInt(family_id, 10);
    if (!family_id || isNaN(familyIdNum) || familyIdNum < 1) {
      return res.status(400).json({ error: 'Invalid family_id' });
    }
    
    // Validate big_id belongs to same family
    if (big_id) {
      await validateBigIdInFamily(familyIdNum, parseInt(big_id, 10));
    }
    
    let validatedName,
      validatedPledgeClass,
      validatedMajor,
      validatedCareerAspirations,
      validatedFunFacts,
      validatedGraduationYear,
      validatedStatus,
      validatedIsTransfer,
      validatedProfileImageUrl,
      validatedLinkedInUrl,
      validatedInstagramUrl,
      validatedPersonalWebsiteUrl,
      validatedEmail;
    
    try {
      validatedName = validateString(name, 'Name', 100);
      if (!validatedName) {
        return res.status(400).json({ error: 'Name is required and cannot be empty' });
      }
      
      validatedPledgeClass = validateString(pledge_class, 'Pledge Class', 50);
      validatedMajor = validateString(major, 'Major', 100);
      validatedCareerAspirations = validateString(career_aspirations, 'Career Aspirations', 1000);
      validatedFunFacts = validateString(fun_facts, 'Fun Facts', 1000);
      validatedGraduationYear = validateInteger(graduation_year, 'Graduation Year', 1950, 2100);
      validatedStatus = status === 'graduated' ? 'graduated' : 'studying';
      validatedIsTransfer = is_transfer === true || is_transfer === 1 ? 1 : 0;
      validatedProfileImageUrl = validateString(profile_image_url, 'Profile Image URL', 500);
      validatedLinkedInUrl = validateString(linkedin_url, 'LinkedIn URL', 500);
      validatedInstagramUrl = validateString(instagram_url, 'Instagram URL', 500);
      validatedPersonalWebsiteUrl = validateString(personal_website_url, 'Personal Website URL', 500);
      validatedEmail = validateString(email, 'Email', 255);
    } catch (validationError) {
      return res.status(400).json({ error: validationError.message });
    }
    
    const insertResult = await pool.query(`
      INSERT INTO brothers (
        family_id,
        name,
        pledge_class,
        graduation_year,
        major,
        career_aspirations,
        fun_facts,
        status,
        is_transfer,
        profile_image_url,
        linkedin_url,
        instagram_url,
        personal_website_url,
        email
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id
    `, [
      familyIdNum,
      validatedName,
      validatedPledgeClass,
      validatedGraduationYear,
      validatedMajor,
      validatedCareerAspirations,
      validatedFunFacts,
      validatedStatus,
      validatedIsTransfer,
      validatedProfileImageUrl,
      validatedLinkedInUrl,
      validatedInstagramUrl,
      validatedPersonalWebsiteUrl,
      validatedEmail
    ]);
    
    const brotherId = insertResult.rows[0].id;
    
    const bigIdNum = big_id ? parseInt(big_id, 10) : null;
    if (bigIdNum && !isNaN(bigIdNum) && bigIdNum > 0) {
      try {
        await pool.query(`
          INSERT INTO relationships (family_id, big_id, little_id)
          VALUES ($1, $2, $3)
        `, [familyIdNum, bigIdNum, brotherId]);
      } catch (relError) {
        logger.error('Error creating relationship (brother still created):', relError.message);
        // Don't fail the whole request if relationship creation fails
      }
    }
    
    res.json({ id: brotherId, success: true });
  } catch (error) {
    logger.error('Error creating brother:', error.message);
    const sanitized = sanitizeError(error, req);
    res.status(error.message && error.message.includes('Big brother') ? 400 : 500).json(sanitized);
  }
});

// Sync Google profile photo on portal sign-in (only fills empty profile_image_url)
app.post('/api/brothers/sync-photo', async (req, res) => {
  try {
    const { email, photoUrl } = req.body || {};

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'email is required' });
    }
    if (!photoUrl || typeof photoUrl !== 'string') {
      return res.status(400).json({ error: 'photoUrl is required' });
    }

    // Only accept Google CDN URLs — never arbitrary URLs from callers
    const isGooglePhoto = photoUrl.startsWith('https://lh3.googleusercontent.com') ||
                          photoUrl.startsWith('https://googleusercontent.com');
    if (!isGooglePhoto) {
      return res.status(400).json({ error: 'photoUrl must be a Google profile photo URL' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Only update rows where profile_image_url is NULL or empty — manual uploads always win
    const result = await pool.query(
      `UPDATE brothers
       SET profile_image_url = $1
       WHERE LOWER(TRIM(email)) = $2
         AND (profile_image_url IS NULL OR profile_image_url = '')
       RETURNING id`,
      [photoUrl, normalizedEmail]
    );

    res.json({ updated: result.rowCount });
  } catch (error) {
    const sanitized = sanitizeError(error, req);
    res.status(500).json(sanitized);
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
    
    const { name, pledge_class, graduation_year, major, career_aspirations, fun_facts, status, is_transfer, profile_image_url, linkedin_url, instagram_url, personal_website_url, email } = req.body;
    
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
    const validatedProfileImageUrl = validateString(profile_image_url, 'Profile Image URL', 500);
    const validatedLinkedInUrl = validateString(linkedin_url, 'LinkedIn URL', 500);
    const validatedInstagramUrl = validateString(instagram_url, 'Instagram URL', 500);
    const validatedPersonalWebsiteUrl = validateString(personal_website_url, 'Personal Website URL', 500);
    const validatedEmail = validateString(email, 'Email', 255);
    
    const result = await pool.query(`
      UPDATE brothers 
      SET name = $1, pledge_class = $2, graduation_year = $3, major = $4, 
          career_aspirations = $5, fun_facts = $6, status = $7, is_transfer = $8,
          profile_image_url = $9, linkedin_url = $10, instagram_url = $11, 
          personal_website_url = $12, email = $13, updated_at = CURRENT_TIMESTAMP
      WHERE id = $14
    `, [
      validatedName,
      validatedPledgeClass,
      validatedGraduationYear,
      validatedMajor,
      validatedCareerAspirations,
      validatedFunFacts,
      validatedStatus,
      validatedIsTransfer,
      validatedProfileImageUrl,
      validatedLinkedInUrl,
      validatedInstagramUrl,
      validatedPersonalWebsiteUrl,
      validatedEmail,
      brotherId
    ]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Brother not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    logger.error('Error updating brother:', error.message);
    const sanitized = sanitizeError(error, req);
    res.status(400).json(sanitized);
  }
});

// Update relationship (change Big)
app.put('/api/relationships/:littleId', checkPassword, async (req, res) => {
  try {
    const { littleId } = req.params;
    const { family_id, big_id } = req.body;
    
    const littleIdNum = parseInt(littleId, 10);
    const familyIdNum = parseInt(family_id, 10);
    const bigIdNum = big_id ? parseInt(big_id, 10) : null;
    
    if (isNaN(littleIdNum) || littleIdNum < 1 || isNaN(familyIdNum) || familyIdNum < 1) {
      return res.status(400).json({ error: 'Invalid relationship IDs' });
    }
    
    // Validate big_id belongs to same family
    if (bigIdNum) {
      await validateBigIdInFamily(familyIdNum, bigIdNum);
    }
    
    await pool.query(`
      UPDATE relationships 
      SET big_id = $1, updated_at = CURRENT_TIMESTAMP
      WHERE family_id = $2 AND little_id = $3
    `, [bigIdNum, familyIdNum, littleIdNum]);
    
    res.json({ success: true });
  } catch (error) {
    logger.error('Error updating relationship:', error.message);
    const sanitized = sanitizeError(error, req);
    res.status(error.message && error.message.includes('Big brother') ? 400 : 400).json(sanitized);
  }
});

// Create relationship (add Little to existing Big)
app.post('/api/relationships', checkPassword, async (req, res) => {
  try {
    const { family_id, big_id, little_id } = req.body;
    
    const familyIdNum = parseInt(family_id, 10);
    const bigIdNum = big_id ? parseInt(big_id, 10) : null;
    const littleIdNum = parseInt(little_id, 10);
    
    if (isNaN(familyIdNum) || familyIdNum < 1 || isNaN(littleIdNum) || littleIdNum < 1) {
      return res.status(400).json({ error: 'Invalid relationship IDs' });
    }
    
    // Validate big_id belongs to same family
    if (bigIdNum) {
      await validateBigIdInFamily(familyIdNum, bigIdNum);
    }
    
    await pool.query(`
      INSERT INTO relationships (family_id, big_id, little_id)
      VALUES ($1, $2, $3)
      ON CONFLICT (family_id, little_id) 
      DO UPDATE SET big_id = EXCLUDED.big_id, updated_at = CURRENT_TIMESTAMP
    `, [familyIdNum, bigIdNum, littleIdNum]);
    
    res.json({ success: true });
  } catch (error) {
    logger.error('Error creating relationship:', error.message);
    const sanitized = sanitizeError(error, req);
    res.status(error.message && error.message.includes('Big brother') ? 400 : 400).json(sanitized);
  }
});

app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Server running on 0.0.0.0:${PORT}`);
  logger.info(`Environment: ${NODE_ENV}`);
});
