# Fixing Supabase Connection on Railway

If you're still getting IPv6 connection errors, try these steps:

## Option 1: Use Supabase Transaction Pooler (Recommended)

In Railway → Variables → `DATABASE_URL`, use:

```
postgresql://postgres.ROOQCHDTTRSVZJCUMGTK:alphamusrgoated@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

**Note**: This uses Supabase's pooler which is better for Railway. You need to:
1. Go to Supabase Dashboard → Settings → Database
2. Find "Connection Pooling" section
3. Copy the "Connection string" (Transaction mode)
4. Use that instead of the direct connection

## Option 2: Check Supabase Network Settings

1. Go to Supabase Dashboard → Settings → Database
2. Check "Network Restrictions"
3. Make sure Railway IPs are allowed (or disable restrictions temporarily)
4. Supabase might be blocking Railway's IP range

## Option 3: Verify Your DATABASE_URL Format

Make sure it's exactly:
```
postgresql://postgres:alphamusrgoated@db.rooqchdttrsvzjcumgtk.supabase.co:6543/postgres
```

**Check:**
- No quotes around the URL
- No spaces
- Password is correct: `alphamusrgoated`
- Port is `6543` (pooler) or `5432` (direct)

## Option 4: Test Connection Locally First

Run this locally to verify the connection works:
```bash
cd server
DATABASE_URL="postgresql://postgres:alphamusrgoated@db.rooqchdttrsvzjcumgtk.supabase.co:6543/postgres" node check-db.js
```

If this works locally, the issue is Railway's network.

## Option 5: Check Railway Logs

In Railway dashboard:
1. Click on your service
2. Go to "Deployments" tab
3. Click on the latest deployment
4. Check "Logs" to see the exact error

The error message will tell us what's wrong.

