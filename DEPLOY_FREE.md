# Free Deployment Options

## Option 1: Render Free Tier ⭐ (Recommended)

Render has a **FREE tier** that works perfectly:
- Static sites: Always free
- Web services: Free tier (spins down after 15min inactivity, wakes on request)

**To use free tier:**
1. When creating services, choose **Free** plan (not Starter)
2. Services may take 30-60 seconds to wake up after inactivity
3. Perfect for low-traffic use

**Setup:** Same as DEPLOY.md, just choose "Free" plan instead of paid.

---

## Option 2: Vercel (Frontend) + Render Free (Backend)

**Frontend on Vercel (Free):**
1. Install Vercel CLI: `npm i -g vercel`
2. `cd client && vercel`
3. Follow prompts
4. Set `VITE_API_URL` to your Render backend URL

**Backend on Render (Free):**
- Deploy as Web Service on Free tier

---

## Option 3: Railway (Free Tier)

1. Sign up at [railway.app](https://railway.app) (free tier available)
2. New Project → Deploy from GitHub
3. Add two services:
   - Backend: Root `/server`, Start `node server.js`
   - Frontend: Static site, build `cd client && npm run build`

---

## Option 4: Fly.io (Free Tier)

1. Install Fly CLI
2. `fly launch` in project root
3. Configure `fly.toml` for both services

---

## Recommendation

**Use Render Free Tier** - it's the easiest and the services auto-wake after inactivity. The $7 you saw is probably for the "Starter" plan - make sure to select "Free" instead!

