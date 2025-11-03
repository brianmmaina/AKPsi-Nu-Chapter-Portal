# Debugging "Load Failed" on Static Site

Since your environment variables are set, let's check other issues:

## Step 1: Check Build Logs

1. Go to Render dashboard
2. Click on **"akpsi-family-trees-site"** (static site)
3. Click **"Logs"** tab
4. Scroll to the **Build** section
5. Look for errors:
   - ❌ "Build failed" or "npm ERR"
   - ❌ Missing dependencies
   - ❌ Build command errors

**What to look for:**
- ✅ Should see: "Build succeeded" or similar
- ❌ If you see errors, share them

## Step 2: Check Browser Console

1. Visit: https://akpsi-family-trees-site.onrender.com
2. Press **F12** (or right-click → Inspect)
3. Click **"Console"** tab
4. Look for red errors:
   - CORS errors
   - Network errors
   - JavaScript errors
   - 404 errors

**Common errors:**
- `Failed to fetch` → API connection issue
- `CORS error` → Backend CORS not configured
- `Module not found` → Build issue
- `Cannot read property...` → JavaScript error

## Step 3: Check Network Tab

1. In browser DevTools, click **"Network"** tab
2. Refresh the page
3. Look for failed requests (red):
   - Which file is failing?
   - What's the status code? (404, 500, etc.)

## Step 4: Verify Render Static Site Settings

In Render dashboard, check your static site:

**Settings that MUST be correct:**
- **Root Directory:** `client` ⚠️
- **Build Command:** `npm install && npm run build` ⚠️
- **Publish Directory:** `dist` ⚠️ (NOT `client/dist` if root is `client`)

**If Root Directory = `client`:**
- Build Command runs in `client/` folder
- Build outputs to `client/dist/`
- Publish Directory should be: `dist` (relative to root directory)

**If Root Directory = `.` (root):**
- Build Command: `cd client && npm install && npm run build`
- Publish Directory: `client/dist`

## Step 5: Test Build Locally

```bash
cd client
npm install
npm run build
ls dist/  # Should see index.html, assets/, etc.
```

If build fails locally, fix those errors first.

## Common Issues & Fixes

### Issue: "404 Not Found" on main page
**Fix:** Publish Directory is wrong
- Should be `dist` if Root Directory is `client`
- Should be `client/dist` if Root Directory is root

### Issue: "White screen" or blank page
**Fix:** JavaScript error - check Console tab

### Issue: "CORS error"
**Fix:** 
- Backend needs `FRONTEND_URL` = `https://akpsi-family-trees-site.onrender.com`
- Check backend logs to confirm CORS is configured

### Issue: "Failed to fetch /api/..."
**Fix:**
- Check `VITE_API_URL` is set correctly
- Should be: `https://akpsi-family-tree.onrender.com` (no trailing slash)
- Open browser console, type: `import.meta.env.VITE_API_URL`
- Should show your backend URL

### Issue: Build succeeds but site is blank
**Fix:** 
- Check if `index.html` exists in `dist/`
- Check if assets are loading (Network tab)
- Verify all file paths are correct

---

## Quick Test

1. Open: https://akpsi-family-trees-site.onrender.com
2. Open DevTools (F12) → Console
3. Type: `console.log(import.meta.env.VITE_API_URL)`
4. Should show: `https://akpsi-family-tree.onrender.com`

If it shows `undefined`, the environment variable isn't being read properly.

---

## Most Likely Issue

Based on your setup, most likely problems:

1. **Publish Directory wrong** → Should be `dist` (if Root = `client`)
2. **Build failed silently** → Check build logs
3. **Environment variable not applied** → Rebuild after setting VITE_API_URL
4. **JavaScript error on load** → Check browser console

Share what you see in:
- Build logs
- Browser console
- Network tab

And I can help fix the exact issue!

