# Railway Setup - Simple & Fast 🚂

Railway is much simpler than Fly.io - no Docker, no sleep issues, just works!

## Step 1: Create Railway Account (2 minutes)
1. Go to https://railway.app
2. Click "Start a New Project"
3. Sign up with GitHub (free)

## Step 2: Deploy Backend (5 minutes)
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your repository: `akpsi-family-tree`
4. Railway will auto-detect it's Node.js

## Step 3: Configure the Service
1. Railway will detect the `server/` folder automatically
2. If not, click on the service → Settings → Change Root Directory to `server`

## Step 4: Set Environment Variables
Click on your service → Variables tab → Add these:

```
NODE_ENV=production
PASSWORD=(your password here)
DATABASE_URL=postgresql://postgres:(your-password)@db.rooqchdttrsvzjcumgtk.supabase.co:5432/postgres
JWT_SECRET=(use a random string, like: akpsi-jwt-secret-2024)
FRONTEND_URL=https://akpsi-family-tree.vercel.app
PORT=3001
```

## Step 5: Get Your Railway URL
1. Click on your service → Settings
2. Copy the "Public Domain" (e.g., `your-app.up.railway.app`)
3. Your backend URL will be: `https://your-app.up.railway.app`

## Step 6: Update Frontend
1. Go to Vercel dashboard → Your project → Settings → Environment Variables
2. Add/Update: `VITE_API_URL` = `https://your-app.up.railway.app`
3. Redeploy frontend (or push a commit to trigger auto-deploy)

## Step 7: Update Admin Panel
Edit `admin.html` and `client/public/admin.html`:
- Change line 291: `const API_BASE = 'https://your-app.up.railway.app';`

That's it! Railway auto-deploys on every git push. No Docker, no sleep issues!

## Why Railway?
- ✅ Simpler setup (no Dockerfile needed)
- ✅ Stays awake (no cold starts)
- ✅ Auto-deploys from GitHub
- ✅ Free tier is generous
- ✅ Better for Node.js apps

