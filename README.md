# AKPsi Nu Chapter Portal

A full-stack chapter management platform built for **Alpha Kappa Psi Nu Chapter** at Boston University. The portal centralizes everything a chapter needs: an interactive family-tree visualizer spanning **9 pledge classes and 80+ brothers**, a Google OAuth–authenticated alumni network with real-time mentor matching, a rules-engine–powered Life Points leaderboard tracking **12 distinct activity categories**, and a resource hub surfacing chapter documents and contacts. Built on React 18 + Vite, Node.js/Express, PostgreSQL (Supabase), and Firebase—serving the full brotherhood on a single deployment with zero per-member setup beyond a Google login.

---

## Screenshots

> *Family Tree — interactive pan/zoom canvas with collapsible subtrees and member profile modals*

![Family Tree](client/public/images/family-selection-background.jpg)

---

## Features

### Interactive Family Tree Visualization
- Renders the complete Nu Chapter lineage across **9 pledge classes and 80+ brothers** on a zoomable canvas
- Tap any node to open a two-column profile modal: photo (Supabase Storage CDN), bio, major, graduation year, LinkedIn, Instagram
- Collapsible subtrees, search-to-highlight, and mobile-responsive pan/pinch gestures
- Brother photos auto-populate from Google OAuth profile images on first portal login — no manual upload required for members already in the roster

### Alumni & Mentor Network
- Google OAuth sign-in via Firebase; alumni and active brothers have separate role flows with distinct dashboards
- Real-time Firestore database of alumni profiles with industry, company, graduation year, and LinkedIn
- Three-step mentorship flow: Submit Interests → VPAR Review → Shared Workspace
- Profile photo auto-sync: captures `user.photoURL` from Google and writes to the Supabase brother record if empty, preserving manual overrides

### Life Points Leaderboard
- Tracks **12 activity categories** — professional events, community service, brotherhood events, academics, and more
- Streak engine (`streakEngine.ts`) awards multiplier bonuses for consecutive weekly participation
- Family standings view aggregates individual scores into team rankings with delta indicators across **5 chapter families**
- Admin panel for officers to award, adjust, and audit point events with a searchable roster
- All category weights and point thresholds are configured in `pointSystemConfig.ts` — no code deploy needed for rule changes
- Dual storage: writes to Supabase when configured, falls back to `localStorage` + bundled JSON for offline demos

### Information & Resource Hub
- Chapter documents, officer contacts, and key links surfaced in a single tabbed view
- Google Sheets integration (`googleSheetsService.ts`) pulls live roster and event data without a custom CMS
- Archive navigation lets members browse past pledge class rosters by semester

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 5, CSS custom properties / design tokens |
| Backend | Node.js 20, Express 4 |
| Primary DB | PostgreSQL via Supabase (brothers, families, points) |
| Authentication | Firebase Authentication (Google OAuth provider) |
| Realtime / Alumni DB | Firebase Firestore |
| File Storage | Supabase Storage (`profile-photos` bucket, public CDN) |
| External Data | Google Sheets API v4 |
| Deployment target | Vercel (frontend) + Railway or Render (Express API) |

---

## Local Setup

### Prerequisites
- Node.js ≥ 20
- Supabase project with `brothers`, `families`, `points_members`, `points_events`, `points_awards` tables
- Firebase project with Authentication (Google provider) and Firestore enabled
- Google Cloud project with Sheets API enabled

### 1. Clone & install

```bash
git clone https://github.com/brianmmaina/AKPsi-Nu-Chapter-Portal.git
cd AKPsi-Nu-Chapter-Portal
cd client && npm install
```

### 2. Environment variables

Create `client/.env.local`:

```env
VITE_API_URL=http://localhost:3001
VITE_SUPABASE_URL=https://<your-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
VITE_GOOGLE_SHEETS_ID=<your-sheet-id>
VITE_GOOGLE_SHEETS_API_KEY=<your-sheets-api-key>
```

Set `DATABASE_URL` as a system env var or in a `server/.env` file:

```env
DATABASE_URL=postgresql://postgres:<password>@db.<ref>.supabase.co:5432/postgres
PORT=3001
```

### 3. Supabase Storage bucket

Run once to create the `profile-photos` public bucket:

```bash
SUPABASE_SERVICE_ROLE_KEY=<service-role-key> node scripts/setup-storage.mjs
```

### 4. Firebase portal config

Edit `client/public/portal/firebase-config.js` with your Firebase project credentials (apiKey, authDomain, projectId, etc.).

### 5. Run

```bash
# Terminal 1 — Express API
cd server && node server.js

# Terminal 2 — Vite dev server
cd client && npm run dev
```

App runs at `http://localhost:5173`. Vite proxies `/api/*` to Express on port 3001 in development.

---

## Architecture Notes

### Dual-database design
Active brother data (family tree, points, photos) lives in **PostgreSQL/Supabase** — relational, strongly typed, easy joins across families and members. Alumni and mentor data lives in **Firebase Firestore** — schema-flexible and real-time, suited to the looser alumni data model where fields differ by user. The Express API is the single backend for PostgreSQL reads and writes; Firestore is accessed directly from the browser via the Firebase JS SDK.

### Portal iframe integration
The alumni network (`/portal/`) is a standalone vanilla-JS SPA (Firebase auth + Firestore) served as static files from `client/public/portal/`. The React frontend wraps it in `ProfessionalNetwork.jsx` using an `<iframe>`, giving it React nav chrome (Back / Home buttons) while leaving the portal's own auth and Firestore calls unchanged. This keeps the two codebases decoupled — the portal can be developed and tested independently.

### Google photo sync on login
When a brother authenticates through the portal with Google, `app.js` fires a background `POST /api/brothers/sync-photo` with their email and `user.photoURL`. The Express endpoint:
1. Validates the URL originates from `lh3.googleusercontent.com` (Google's photo CDN)
2. Updates the `profile_image_url` column **only if it is currently `NULL` or empty** — manual uploads are never overwritten
3. Responds synchronously so the login flow isn't blocked

### Points rules engine
`streakEngine.ts` evaluates a member's event history to compute streak multipliers before scores are aggregated by `PointsContext`. `pointSystemConfig.ts` defines category weights, required event flags, checkpoint values, and the current term label as a single config object — officers adjust scoring rules by editing one file, not JSX.

### Tree layout algorithm
`treeLayout.js` computes x/y coordinates for the family tree using a custom bottom-up pass that respects sibling spacing and subtree-collapsed state, then returns a flat node list that `FamilyTreeView.jsx` renders as positioned elements on a scrollable canvas. Collapsing a subtree re-runs the layout pass in O(n) time.

---

## Points System — VPAA Reference

- **Source of truth:** When `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` are set, `pointsService.ts` reads/writes Supabase tables. Without them it falls back to `client/src/data/points.json` + `localStorage` for offline demos.
- **Admin flow:** Open the Points tab → click the Admin chip → search for a brother to unlock write actions. Use Record Attendance, Event Builder, and Manual Adjustments tabs.
- **New term:** Update `semester` in `pointSystemConfig.ts`, then truncate or archive `points_awards` in Supabase (or clear `akpsi_points_admin_state_v1` in localStorage for offline mode).
- **Adding categories:** Add to the catalog in `pointSystemConfig.ts`; the rules panel and admin templates update automatically.

---

## Deployment

```bash
# Build frontend
cd client && npm run build   # outputs to client/dist

# Serve dist from Express (or upload to Vercel/Netlify)
# Deploy server/ to Railway / Render with DATABASE_URL set
# Set VITE_API_URL to your deployed Express URL and rebuild
```
