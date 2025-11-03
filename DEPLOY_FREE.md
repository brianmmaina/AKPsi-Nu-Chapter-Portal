# Free Hosting Deployment Guide

This guide will help you deploy the AKPsi Family Trees app on free hosting platforms.

## Architecture

- **Frontend**: Vercel (static React app)
- **Backend**: Fly.io (Express API)
- **Database**: Supabase (free PostgreSQL)

## Step 1: Set Up Database (Supabase) 🗄️

1. Go to [supabase.com](https://supabase.com) and sign up (free)
2. Create a new project:
   - Name: `akpsi-family-trees`
   - Database password: **Save this!** (you'll need it)
   - Region: Choose closest to you
3. Wait for project to finish setting up (~2 minutes)
4. Go to **Settings** → **Database**
5. Copy the **Connection string** (URI format)
   - It will look like: `postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres`
   - Replace `[PASSWORD]` with your actual database password

## Step 2: Deploy Backend (Fly.io) 🚀

1. Install Fly CLI:
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. Login to Fly.io:
   ```bash
   flyctl auth login
   ```

3. Navigate to server directory:
   ```bash
   cd server
   ```

4. Launch your app (from project root):
   ```bash
   cd ..
   flyctl launch
   ```
   - When prompted:
     - App name: `akpsi-family-trees-api` (or choose your own)
     - Region: Choose closest to you
     - Create Postgres? **No** (we're using Supabase)
     - Copy config? **Yes**

5. Set environment variables:
   ```bash
   flyctl secrets set PASSWORD="your-secure-password-here"
   flyctl secrets set DATABASE_URL="your-supabase-connection-string"
   flyctl secrets set JWT_SECRET="your-secure-password-here"  # Can be same as PASSWORD
   flyctl secrets set NODE_ENV="production"
   ```

6. Deploy:
   ```bash
   flyctl deploy
   ```

7. Get your backend URL:
   ```bash
   flyctl status
   ```
   - Your API will be at: `https://akpsi-family-trees-api.fly.dev`

## Step 3: Deploy Frontend (Vercel) 🌐

1. Go to [vercel.com](https://vercel.com) and sign up (free, use GitHub)
2. Click **Add New Project**
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Output Directory**: `dist`
5. Add environment variable:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://akpsi-family-trees-api.fly.dev` (your Fly.io backend URL)
6. Click **Deploy**
7. Once deployed, copy your frontend URL (e.g., `https://your-app.vercel.app`)

## Step 4: Update Backend CORS

Update your backend to allow your Vercel frontend:

```bash
flyctl secrets set FRONTEND_URL="https://your-app.vercel.app"
```

## Step 5: Initialize Database

The database will auto-initialize on first request, but you can also run:

```bash
# SSH into Fly.io app
flyctl ssh console

# Run initialization (will auto-create tables)
curl http://localhost:3001/health
```

## Step 6: Test Everything

1. Visit your Vercel frontend URL
2. Login with your password
3. Check that families load
4. Verify admin panel works at `/admin.html`

## Admin Panel Setup

The admin panel is deployed with the frontend at:
- `https://your-app.vercel.app/admin.html`

Update the default API URL in `admin.html` if needed (it auto-detects).

## Troubleshooting

### Backend won't start?
- Check logs: `flyctl logs`
- Verify secrets: `flyctl secrets list`
- Make sure `DATABASE_URL` includes your Supabase password

### Frontend can't connect to backend?
- Check `VITE_API_URL` in Vercel settings
- Make sure CORS is set correctly: `FRONTEND_URL` in Fly.io

### Database connection issues?
- Verify Supabase project is active
- Check connection string format
- Make sure Supabase allows connections from anywhere (Settings → Database → Connection Pooling)

## Free Tier Limits

### Vercel
- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ Auto SSL certificates
- ✅ Edge network

### Fly.io
- ✅ 3 shared-cpu-1x VMs (256MB each)
- ✅ 3GB persistent volume storage
- ✅ 160GB outbound data transfer
- ⚠️ Apps sleep after inactivity (wake on request)

### Supabase
- ✅ 500MB database storage
- ✅ 2GB bandwidth
- ✅ Unlimited API requests
- ✅ Auto backups

## Cost: $0/month! 🎉

All services are completely free within these limits, which should be more than enough for your family tree app.

