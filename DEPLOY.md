# Free Manual Deployment Guide

## Option 1: Render Free Tier (Manual - No Blueprint)

### Backend (Web Service - FREE)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New +** → **Web Service** (NOT Blueprint)
3. Connect GitHub repo: `brianmmaina/akpsi-family-tree`
4. Configure:
   - **Name**: `akpsi-family-trees-api`
   - **Environment**: `Node`
   - **Region**: Choose closest
   - **Branch**: `main`
   - **Root Directory**: (leave empty)
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && node server.js`
   - **Plan**: Select **Free** (important!)
5. **Environment Variables**:
   - Key: `PASSWORD`, Value: `your-secure-password`
6. Click **Create Web Service**
7. Wait for deployment (copy the URL when done)

### Frontend (Static Site - FREE)

1. In Render Dashboard, click **New +** → **Static Site**
2. Connect same GitHub repo: `brianmmaina/akpsi-family-tree`
3. Configure:
   - **Name**: `akpsi-family-trees-frontend`
   - **Branch**: `main`
   - **Root Directory**: (leave empty)
   - **Build Command**: `cd client && npm install && npm run build`
   - **Publish Directory**: `client/dist`
   - **Plan**: Free (automatic for static sites)
4. **Environment Variables**:
   - Key: `VITE_API_URL`
   - Value: Your backend URL (e.g., `https://akpsi-family-trees-api.onrender.com`)
5. Click **Create Static Site**

✅ **Total Cost: $0** - Both on free tier!

---

## Option 2: Railway (Completely Free Tier)

### Setup Railway

1. Sign up at [railway.app](https://railway.app) (free tier)
2. **New Project** → **Deploy from GitHub repo**
3. Select: `brianmmaina/akpsi-family-tree`

### Backend Service

1. Click **+ New** → **GitHub Repo**
2. Same repo, add service
3. Settings:
   - **Root Directory**: `server`
   - **Start Command**: `node server.js`
   - **Build Command**: `npm install`
4. **Variables** tab:
   - `PASSWORD` = your password
5. Railway will auto-deploy

### Frontend Service

1. Click **+ New** → **Static File**
2. Or use GitHub service with:
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
   - **Output Directory**: `dist`

Or deploy frontend separately:
- Use **Vercel** (always free) for frontend
- Keep Railway for backend only

---

## Option 3: Vercel (Frontend) + Railway (Backend)

### Frontend on Vercel (FREE)

1. Go to [vercel.com](https://vercel.com)
2. **New Project** → Import GitHub repo
3. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **Environment Variables**:
   - `VITE_API_URL` = your Railway backend URL
5. Deploy

### Backend on Railway (FREE)

Follow Railway steps above.

---

## Quick Comparison

| Platform | Free Tier | Wake Time | Best For |
|----------|-----------|-----------|----------|
| **Render** | ✅ Yes | 30-60s | Easy setup |
| **Railway** | ✅ Yes | Instant | Fast, easy |
| **Vercel** | ✅ Yes | Instant | Frontend only |

---

## Recommendation

**Use Railway** - Completely free, no spin-down, instant wake, easier than Render manual setup!

