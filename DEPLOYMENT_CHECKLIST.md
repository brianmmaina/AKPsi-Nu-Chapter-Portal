# Deployment Checklist

## ✅ Pre-Deployment (Complete)

- [x] Codebase cleaned and optimized
- [x] Database auto-initialization added to server
- [x] render.yaml configured
- [x] API client production-ready (VITE_API_URL)
- [x] .gitignore configured
- [x] All dependencies optimized
- [x] Git repository initialized

## 🚀 Deployment Steps

### 1. Commit and Push to GitHub

```bash
git add .
git commit -m "Initial deployment-ready version"
git branch -M main
git push -u origin main
```

### 2. Deploy on Render (Option A: Blueprint - Easiest)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New** → **Blueprint**
3. Connect GitHub repository: `brianmmaina/akpsi-family-tree`
4. Render will detect `render.yaml`
5. **Set Environment Variables:**
   - `PASSWORD`: Your secure password (for backend)
   - Click **Apply**
6. After backend deploys (copy the URL):
   - Update frontend service
   - Add `VITE_API_URL`: `https://akpsi-family-trees-api.onrender.com`
7. Both services will deploy automatically

### 3. Deploy on Render (Option B: Manual)

**Backend:**
- New → Web Service
- Connect repo
- Name: `akpsi-family-trees-api`
- Build: `cd server && npm install`
- Start: `cd server && node server.js`
- Env Var: `PASSWORD` = your password
- Health Check: `/api/families`

**Frontend:**
- New → Static Site
- Connect repo
- Build: `cd client && npm install && npm run build`
- Publish: `client/dist`
- Env Var: `VITE_API_URL` = backend URL

## ✅ Post-Deployment Verification

1. **Backend Test:**
   - Visit: `https://akpsi-family-trees-api.onrender.com/api/families`
   - Should return: JSON array with 5 families

2. **Frontend Test:**
   - Visit your static site URL
   - Should see login page
   - Login with your password
   - Should see 5 family options

3. **Database:**
   - Database auto-initializes on first backend start
   - All 5 families are created automatically

## 📝 Adding Brothers After Deployment

1. Log in via frontend
2. Select a family
3. Click "Add First Brother" (if empty) or click any brother → "Add Little"
4. Fill in details and save

## 🔧 Troubleshooting

- **Backend won't start:** Check logs, ensure PASSWORD env var is set
- **Frontend can't connect:** Verify VITE_API_URL matches backend URL exactly
- **Database errors:** Check Render logs, database should auto-initialize

---

**Ready to deploy!** 🎉

