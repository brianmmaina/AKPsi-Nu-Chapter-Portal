# Vercel Environment Variable Setup

## Set VITE_API_URL in Vercel

1. Go to https://vercel.com/dashboard
2. Click on your project: `akpsi-family-tree`
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Add:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://akpsi-family-tree-production.up.railway.app`
   - **Environment**: Select all (Production, Preview, Development)
6. Click **Save**
7. **IMPORTANT**: Go to **Deployments** tab
8. Click the **3 dots** (⋯) on the latest deployment
9. Click **Redeploy** → **Redeploy**

This will rebuild the frontend with the correct Railway backend URL.

After redeploy, your login should work!

