# Render Web Service Setup (Step-by-Step)

## Backend Web Service Configuration

### Step 1: Create Web Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New +** → **Web Service**
3. Connect GitHub repository: `brianmmaina/akpsi-family-tree`

### Step 2: Configure Settings

**Basic Settings:**
- **Name**: `akpsi-family-trees-api` (or any name you prefer)
- **Region**: Choose closest to you
- **Branch**: `main`
- **Root Directory**: (leave empty)
- **Environment**: `Node`

**Build & Deploy:**
- **Build Command**: `cd server && npm install`
- **Start Command**: `cd server && node server.js`

**Plan:**
- **IMPORTANT**: Select **Free** (not Starter!)

**Health Check:**
- **Path**: `/api/families`

### Step 3: Environment Variables

Click **Environment** tab, add:
- **Key**: `PASSWORD`
- **Value**: Your secure password (e.g., `changeme123`)
- Click **Save Changes**

### Step 4: Deploy

1. Click **Create Web Service**
2. Render will start building (takes 2-3 minutes)
3. Once deployed, copy your service URL:
   - Example: `https://akpsi-family-trees-api.onrender.com`

### Step 5: Test Backend

Visit: `https://your-service-url.onrender.com/api/families`

Should return:
```json
[
  {"id":1,"name":"WOLFPACK","theme":"wolfpack"},
  {"id":2,"name":"PRIDE","theme":"pride"},
  ...
]
```

## Important Notes

- ✅ Database auto-initializes on first start
- ✅ All 5 families are created automatically
- ⚠️ Free tier spins down after 15min inactivity (wakes automatically)
- ⚠️ First request after spin-down takes ~30-60 seconds

## Next: Deploy Frontend

After backend is working, deploy frontend as Static Site:
- Build: `cd client && npm install && npm run build`
- Publish: `client/dist`
- Env Var: `VITE_API_URL` = your backend URL

