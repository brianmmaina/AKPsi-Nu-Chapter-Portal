# Fix "Publish directory client/dist does not exist"

## The Problem

Render is looking for `client/dist` but the build outputs to `dist` when Root Directory is set.

## The Fix

In your Render dashboard for the static site:

### Option A: Set Root Directory (Recommended)

1. Go to your static site → **Settings**
2. Scroll to **Build & Deploy**
3. Set:
   - **Root Directory:** `client` ⚠️ **IMPORTANT**
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist` ⚠️ **NOT** `client/dist`
4. Save changes
5. It will rebuild automatically

### Option B: No Root Directory

If you don't set Root Directory:

1. **Root Directory:** (leave empty or `.`)
2. **Build Command:** `cd client && npm install && npm run build`
3. **Publish Directory:** `client/dist`

## Which One Should You Use?

**Use Option A** - it's cleaner:
- Root Directory: `client`
- Build Command: `npm install && npm run build`
- Publish Directory: `dist`

The key is: **If Root Directory = `client`, then Publish Directory = `dist`**

---

After fixing, rebuild should succeed! ✅

