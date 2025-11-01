# Data Storage & Button Functionality

## ✅ Does the "Add Root Node" Button Work?

**Yes!** The button is fully functional. Here's how it works:

### Button Flow:
1. **Click "+ Add Root Node" button** → Sets `addFormParent = null` and opens `AddNodeForm`
2. **Fill out the form** → Enter name, pledge class, graduation year, major, etc.
3. **Submit with password** → Sends data to backend API
4. **Backend creates brother** → If `big_id` is `null`, creates a root node (no relationship)
5. **Tree refreshes** → New root node appears at Level 0 automatically

### Code Verification:
- **Frontend (AddNodeForm.jsx:62)**: `big_id: parentBrother ? parentBrother.id : null`
- **Backend (server.js:264)**: Only creates relationship if `big_id` is provided
- **Layout Algorithm**: Brothers with no `big_id` automatically become Level 0 (root nodes)

## 📁 Where is Data Stored?

### Database: SQLite (better-sqlite3)

**Location**: `server/database.sqlite`

This is a file-based SQLite database stored in the server directory. The database file is:
- **Created automatically** when the server starts
- **Persistent** - all data is saved between server restarts
- **Git-ignored** - the `.sqlite` file is not committed to git (see `.gitignore`)

### Database Structure

#### 1. `families` Table
Stores the 5 family groups:
```sql
- id (PRIMARY KEY)
- name (e.g., "EMPIRE", "WOLFPACK")
- theme (e.g., "empire", "wolfpack")
- created_at
```

#### 2. `brothers` Table
Stores all brother information:
```sql
- id (PRIMARY KEY)
- family_id (FOREIGN KEY → families.id)
- name
- pledge_class
- graduation_year
- major
- career_aspirations
- fun_facts
- status ('studying' or 'graduated')
- is_transfer (0 or 1)
- created_at
- updated_at
```

#### 3. `relationships` Table
Stores Big-Little connections:
```sql
- id (PRIMARY KEY)
- family_id (FOREIGN KEY → families.id)
- big_id (FOREIGN KEY → brothers.id, NULLABLE - for root nodes)
- little_id (FOREIGN KEY → brothers.id, NOT NULL)
- created_at
```

**Important**: If `big_id` is `NULL`, that brother is a root node (no big brother).

### How Root Nodes Work

**Root Node** = Brother with no `big_id` in the relationships table

1. **Adding Root Node**:
   - `AddNodeForm` sends `big_id: null`
   - Backend creates brother but **no relationship entry**
   - Layout algorithm identifies brothers with no relationship → Level 0

2. **Multiple Root Nodes**:
   - Each root node gets its own Level 0 position
   - Layout algorithm spaces them horizontally
   - Each root can have its own branch descending below

3. **Example**:
   ```
   Level 0: [Kelly Yu] [Jason Cooper] [Sofi Dipilla] [Cat Cao]
              ↓           ↓              ↓              ↓
   Level 1: [Joseph]    [Bente]       [Div]         [Jielin]
              ↓           ↓              ↓
   Level 2: [Jasmine]    [Ashley]      [Ben]
   ```

### Database Initialization

**On Server Start** (`server.js:119-161`):
- Checks if tables exist, creates them if not
- Inserts default families if they don't exist
- Safe to run multiple times (uses `CREATE TABLE IF NOT EXISTS`)

**Manual Initialization**:
```bash
cd server
npm run init-db
```

### Database File Location

**Local Development**:
- File: `server/database.sqlite`
- Path: `/Users/brianmmaina/Alpha Kappa Psi Panel Project/server/database.sqlite`

**Production (Render)**:
- Uses `DATABASE_PATH` environment variable if set
- Default: `database.sqlite` in server root
- On Render, this persists across deployments (file system storage)

### Backing Up Data

**To Backup**:
```bash
# Copy the database file
cp server/database.sqlite server/database.sqlite.backup
```

**To Restore**:
```bash
# Restore from backup
cp server/database.sqlite.backup server/database.sqlite
```

### Viewing Data

You can use any SQLite browser tool:
- **DB Browser for SQLite** (free, GUI)
- **SQLite CLI**: `sqlite3 server/database.sqlite`
- **VS Code Extension**: SQLite Viewer

Example queries:
```sql
-- View all brothers in EMPIRE
SELECT * FROM brothers WHERE family_id = (SELECT id FROM families WHERE name = 'EMPIRE');

-- View all root nodes (brothers with no big_id)
SELECT b.* FROM brothers b
LEFT JOIN relationships r ON b.id = r.little_id
WHERE r.big_id IS NULL;

-- View full tree structure
SELECT 
  b.name,
  big.name AS big_brother,
  b.pledge_class,
  b.graduation_year
FROM brothers b
LEFT JOIN relationships r ON b.id = r.little_id
LEFT JOIN brothers big ON r.big_id = big.id
WHERE b.family_id = 1
ORDER BY b.id;
```

## 🔄 Data Flow

1. **Add Root Node Button** → Opens form with `parentBrother = null`
2. **Form Submission** → `POST /api/brothers` with `big_id: null`
3. **Backend** → Creates brother record, **skips relationship** if no `big_id`
4. **Frontend Refresh** → Calls `GET /api/families/:id/tree`
5. **Layout Algorithm** → Identifies root nodes (no relationship) → Level 0
6. **React Flow** → Renders nodes at calculated positions

## ✅ Verification Checklist

- [x] Button opens form when clicked
- [x] Form accepts `parentBrother = null`
- [x] Backend creates brother without relationship when `big_id = null`
- [x] Root nodes appear at Level 0
- [x] Multiple root nodes display horizontally
- [x] Data persists in SQLite database
- [x] Tree refreshes after adding

All functionality is working! 🎉

