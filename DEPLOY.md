# Deployment Guide - Render

## Quick Deploy (Recommended)

### Option 1: Use render.yaml (Easiest)
1. Push code to GitHub
2. On Render Dashboard → **New** → **Blueprint**
3. Connect your GitHub repo
4. Render will auto-detect `render.yaml`
5. Set environment variables when prompted:
   - `PASSWORD`: Your secure password
   - `VITE_API_URL`: (Set after backend deploys)

### Option 2: Manual Setup

## Backend (Web Service)

1. **Create New Web Service** on Render
2. **Connect GitHub** repository
3. **Settings:**
   - **Name**: `akpsi-family-trees-api`
   - **Environment**: `Node`
   - **Root Directory**: (leave empty)
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && node server.js`
   - **Health Check Path**: `/api/families`

4. **Environment Variables:**
   - `PASSWORD`: Your secure password
   - `PORT`: (auto-set by Render, don't set manually)

5. **After deployment:**
   - Copy your backend URL (e.g., `https://akpsi-family-trees-api.onrender.com`)
   - Database auto-initializes on first start

## Frontend (Static Site)

1. **Create New Static Site** on Render
2. **Connect GitHub** repository
3. **Settings:**
   - **Build Command**: `cd client && npm install && npm run build`
   - **Publish Directory**: `client/dist`

4. **Environment Variables:**
   - `VITE_API_URL`: Your backend URL (from step above)
   - Example: `https://akpsi-family-trees-api.onrender.com`

## Post-Deployment

1. **Database is auto-initialized** - All 5 families are created automatically
2. **Populate Data:**
   - Visit your frontend URL
   - Log in with your password
   - Select a family
   - Click "Add First Brother" (if empty) or click any brother → "Add Little"

## Testing

1. Frontend: Visit your static site URL
2. Backend API: Visit `https://your-backend.onrender.com/api/families`
3. Should return: Array of 5 families

## Notes

- Database persists on Render's filesystem
- SQLite works for small-medium scale (consider PostgreSQL for large deployments)
- Frontend proxies to `/api` in development, uses `VITE_API_URL` in production
