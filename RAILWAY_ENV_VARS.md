# Railway Environment Variables - Exact Setup

Copy and paste these EXACTLY into Railway → Your Service → Variables tab:

## Required Variables:

```
NODE_ENV=production
```

```
PASSWORD=alphamusrgoated
```

```
DATABASE_URL=postgresql://postgres:alphamusrgoated@db.rooqchdttrsvzjcumgtk.supabase.co:6543/postgres
```

**Important**: Notice the port is `6543` (connection pooler) not `5432`. This helps with Railway's network.

```
JWT_SECRET=akpsi-jwt-secret-2024-change-this-to-something-random
```

```
FRONTEND_URL=https://akpsi-family-tree.vercel.app
```

```
PORT=3001
```

## Step-by-Step:

1. Go to Railway dashboard
2. Click on your service (the backend)
3. Click "Variables" tab
4. Click "New Variable" for each one above
5. **Paste EXACTLY** - no quotes, no extra spaces
6. Save each variable
7. Railway will auto-redeploy

## If Database Still Fails:

Try these alternative DATABASE_URL formats:

**Option 1 - Direct connection (if pooler doesn't work):**
```
DATABASE_URL=postgresql://postgres:alphamusrgoated@db.rooqchdttrsvzjcumgtk.supabase.co:5432/postgres
```

**Option 2 - With connection parameters:**
```
DATABASE_URL=postgresql://postgres:alphamusrgoated@db.rooqchdttrsvzjcumgtk.supabase.co:5432/postgres?sslmode=require
```

Make sure:
- No quotes around the URL
- No spaces
- Password is correct
- Port matches (6543 for pooler, 5432 for direct)

