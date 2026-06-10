# CORS Configuration Fix Summary

## Files Changed

### 1. `server/server.js` - CORS Configuration
**Change**: Replaced open CORS policy with production-ready restricted configuration.

**Before**:
```js
app.use(cors({
  origin: true,  // Allow any origin (not production-ready)
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

**After**:
- Added dynamic allowedOrigins list that:
  - Includes `http://localhost:5173` (frontend dev server)
  - Includes `http://localhost:3000` (alternative dev port)
  - Includes `FRONTEND_URL` environment variable (stable production domain)
  - Matches Vercel preview URLs: `https://ak-psi-nu-chapter-portal-*.vercel.app`
- Implemented origin validation callback for regex pattern matching
- Set `credentials: false` (frontend doesn't use cookies, only Authorization header)
- Added `maxAge: 86400` for CORS preflight caching

### 2. `server/server.js` - Server Binding
**Change**: Fixed listen statement to explicitly bind to `0.0.0.0`.

**Before**:
```js
app.listen(PORT, () => { ... });
```

**After**:
```js
app.listen(PORT, '0.0.0.0', () => { ... });
```

This ensures Railway can reach the server on all network interfaces.

### 3. `server/.env.example` - NEW FILE
Created environment variable documentation with placeholders for:
- `PORT` (defaults to 3000)
- `NODE_ENV` (development or production)
- `DATABASE_URL` (PostgreSQL connection)
- `PASSWORD` (API authentication)
- `JWT_SECRET` (optional, falls back to PASSWORD)
- `FRONTEND_URL` (stable production frontend domain)

## How CORS Works Now

1. **Browser sends OPTIONS preflight** for cross-origin requests
2. **Server receives preflight**, checks if Origin matches allowedOrigins
3. **If match found**:
   - Returns `Access-Control-Allow-Origin: [origin]`
   - Returns `Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS`
   - Returns `Access-Control-Allow-Headers: Content-Type, Authorization`
   - Returns 204 status (OK)
4. **Browser receives preflight response**, sees permission granted
5. **Browser sends actual POST/GET/PUT request** with Authorization header
6. **Auth endpoint** validates password and returns JWT token
7. **Subsequent requests** include `Authorization: Bearer [token]` header
8. **Frontend stores token** in sessionStorage

## Deployment Steps

### Step 1: Install Dependencies (if not already done)
```bash
cd server
npm install  # cors is already in package.json
```

### Step 2: Add Railway Environment Variables

In Railway dashboard for your backend service:
```
Backend Service → Variables → Add Variable
```

Add or update these variables:
```
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://ak-psi-nu-chapter-portal.vercel.app
PASSWORD=[your existing password]
JWT_SECRET=[your existing JWT secret, or leave empty to use PASSWORD]
DATABASE_URL=[your existing database URL]
```

**⚠️ NEVER commit DATABASE_URL or PASSWORD to git!**

### Step 3: Commit and Deploy
```bash
git add server/server.js server/.env.example
git commit -m "fix: implement production-ready CORS configuration

- Restrict CORS origins to specific Vercel domains + localhost
- Allow Vercel preview URLs via regex pattern
- Bind server to 0.0.0.0 for Railway networking
- Add .env.example with required variables

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"

git push origin agents-cors-configuration-fix-railway-backend
```

Railway will auto-deploy on push to the linked branch.

## Testing

### Test 1: Health Endpoint (No Auth Required)
```bash
curl -v https://akpsi-nu-chapter-portal-production.up.railway.app/health
```

Expected response:
- Status: `200 OK`
- Body: `{"status":"healthy","timestamp":"..."}`

### Test 2: OPTIONS Preflight Request
```bash
curl -v -X OPTIONS \
  -H "Origin: https://ak-psi-nu-chapter-portal-k8kd-3jdxuu9l3.vercel.app" \
  https://akpsi-nu-chapter-portal-production.up.railway.app/api/auth
```

Expected response:
- Status: `204 No Content`
- Headers include:
  ```
  Access-Control-Allow-Origin: https://ak-psi-nu-chapter-portal-k8kd-3jdxuu9l3.vercel.app
  Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
  Access-Control-Allow-Headers: Content-Type, Authorization
  ```

### Test 3: Actual Login Request
```bash
curl -v -X POST \
  -H "Origin: https://ak-psi-nu-chapter-portal-k8kd-3jdxuu9l3.vercel.app" \
  -H "Content-Type: application/json" \
  -d '{"password":"your_password"}' \
  https://akpsi-nu-chapter-portal-production.up.railway.app/api/auth
```

Expected response:
- Status: `200 OK`
- Headers include: `Access-Control-Allow-Origin: https://ak-psi-nu-chapter-portal-k8kd-3jdxuu9l3.vercel.app`
- Body: `{"success":true,"token":"...","expiresIn":"24h"}`

### Test 4: Browser Check
1. Open https://ak-psi-nu-chapter-portal.vercel.app
2. Open Chrome DevTools (F12)
3. Go to Network tab
4. Try to log in with password
5. Check the OPTIONS request:
   - Should show Status 204
   - Should show `Access-Control-Allow-Origin` header
6. Check the POST request:
   - Should show Status 200
   - Should have token in response

## Troubleshooting

### Still getting CORS error after deployment?
1. Wait 2-3 minutes for Railway to finish deploying
2. Hard refresh browser (Ctrl+Shift+R / Cmd+Shift+R)
3. Check Railway logs for errors
4. Verify `FRONTEND_URL` is set correctly in Railway

### 502 Bad Gateway?
- Railway might be having database connection issues
- Check Railway logs
- Verify DATABASE_URL is correct
- The health endpoint should still respond (doesn't hit DB)

### 405 Method Not Allowed on preflight?
- Ensure CORS middleware is applied BEFORE all routes
- Check that OPTIONS method is in allowedMethods

## What Didn't Change
- ✅ Authentication logic (still validates password)
- ✅ JWT token generation
- ✅ Rate limiting
- ✅ Database queries
- ✅ Health endpoint (no DB dependency)
- ✅ Frontend code
- ✅ UI/UX
