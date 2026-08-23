# The Nu Chapter Record — AKPsi Nu Chapter Portal

A full-stack chapter platform for **Alpha Kappa Psi Nu Chapter** at Boston University, styled as an editorial "chapter record / archive ledger." It holds the family lineage trees, the Life Points ledger and Family Cup, the alumni network, the Information Hub, and a password-gated officer administration portal — one deployment serving the whole brotherhood.

---

## Screens

| Screen | What it does |
|---|---|
| **Gate / Landing** | Password gate (`POST /api/auth`, JWT session) plus a public-facing landing hero |
| **The Index** | Table of contents with live chapter stats |
| **Life Points Ledger** | Leaderboard, Family Cup, streak tiers, checkpoints — synced from Google Sheets / Supabase |
| **Family Lineage / Trees** | Per-family big→little descent charts, any depth, with zoom, fullscreen, and PNG export |
| **The Network** | Firebase Google sign-in, alumni directory, mentor requests, photo sync |
| **Resources & Records** | Google Drive embed plus live announcements, newsletters, and deadlines posted from the admin portal |
| **Chapter Administration** | Officer-gated: attendance, event builder, point adjustments, **Roster & Trees** (edit/bulk-graduate/re-parent/remove brothers), and **Hub Posts** (publish to the Information Hub) |

## Access model

Two passwords, one login endpoint:

- **Member password** (`PASSWORD`) — read access to the archive.
- **Officer password** (`ADMIN_PASSWORD`) — everything above plus writes. The server tags the JWT with a `role` claim; every write route (`/api/brothers*`, `/api/relationships*`, `/api/posts*`) requires the admin role.

Officers unlock the admin portal from **Life Points → Officer Tools** with the officer password.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 7 (deployed on Vercel) |
| Backend | Node.js 20, Express (deployed on Render) |
| Chapter DB | PostgreSQL (Supabase) — families, brothers, relationships, posts |
| Points | Google Sheets API (primary) → Supabase → bundled sample fallback |
| Alumni network | Firebase Auth (Google) + Firestore, lazy-loaded chunk |

---

## Local setup

```bash
npm run install:all           # root + client + server deps

# server/.env  (see server/.env.example)
#   DATABASE_URL, PASSWORD, ADMIN_PASSWORD, JWT_SECRET, PORT=3001

# client/.env.local  (see client/.env.example)
#   VITE_API_URL=http://localhost:3001  (+ optional Sheets/Supabase keys)

npm run dev                   # runs Vite (5173) + Express (3001) together
```

Tests and build:

```bash
cd client && npx vitest run   # unit tests
cd client && npm run build    # production build → client/dist
```

## Deployment

Both halves run on Render as two separate services:

| Service | URL | What it is |
|---|---|---|
| Frontend | `https://akpsi-nu-chapter-portal.onrender.com` | Static site: build `cd client && npm install && npm run build`, publish directory `client/dist`, SPA rewrite via `client/public/_redirects` |
| Backend | `https://akpsi-backend.onrender.com` | Web service: root directory `server`, start command `node server.js` |

**Frontend env** — set from `client/.env.example` in the Render dashboard. `VITE_API_URL` must point at the backend service (`https://akpsi-backend.onrender.com`). Vite inlines it at build time, so changing it requires a rebuild, not just a restart.

**Backend env** — the server already handles Render's proxy headers and SSL. Required vars, set in the Render dashboard:

| Var | Purpose |
|---|---|
| `DATABASE_URL` | Supabase Postgres connection string (Session Pooler URL preferred on IPv4-only hosts; direct URLs are auto-converted) |
| `PASSWORD` | Member password |
| `ADMIN_PASSWORD` | Officer password (falls back to `PASSWORD` with a warning — set it) |
| `JWT_SECRET` | Token signing secret — **required in production; server exits without it** |
| `FRONTEND_URL` | Deployed frontend origin — locks CORS to it |
| `NODE_ENV` | `production` |

Tables are created/migrated automatically on server start (`initializeDatabase`), including the `posts` table for the Information Hub.

### Firebase sign-in on Render

The Network's Google sign-in uses `authDomain: nu-chapter-connect-portal.firebaseapp.com`, which works in every browser except Safari — Safari's storage partitioning strands the popup with "missing initial state".

The fix is to serve the auth handler from our own origin. `vercel.json` has those rewrites, but Render ignores that file, and Render does **not** read `client/public/_redirects` either (which is why the SPA rewrite there is also inert). To finish the fix, add these as **Redirect/Rewrite rules on the frontend static site in the Render dashboard** — Render rewrites may target an external URL, but only when configured there or in `render.yaml`:

| Source | Destination | Action |
|---|---|---|
| `/__/auth/*` | `https://nu-chapter-connect-portal.firebaseapp.com/__/auth/:splat` | Rewrite |
| `/__/firebase/*` | `https://nu-chapter-connect-portal.firebaseapp.com/__/firebase/:splat` | Rewrite |

Then add `akpsi-nu-chapter-portal.onrender.com` to **Firebase Console → Authentication → Settings → Authorized domains**, and switch `authDomain` in `client/src/record/networkService.js` back to `window.location.host`. Verify with `curl -I https://akpsi-nu-chapter-portal.onrender.com/__/auth/handler` — it must return 200, not 404.

`vercel.json`, `railway.json`, `server/Dockerfile`, and `server/fly.toml` are leftovers from other hosts and can be ignored; the two Render services above are the canonical pair.

## Fall launch checklist

1. Set a fresh `PASSWORD` and a distinct `ADMIN_PASSWORD`; set `JWT_SECRET` and `FRONTEND_URL` on the server.
2. Deploy server → confirm `GET /health` responds; deploy client with `VITE_API_URL` pointing at it.
3. Confirm CORS is locked down: a request to the backend from an unknown `Origin` must not echo that origin back.
4. Log in with the member password → confirm read-only (Officer Tools rejects it).
5. Unlock Officer Tools with the officer password → **Roster & Trees**: mark the graduating class as Graduated, add the new pledge class, fix any Big links.
6. **Hub Posts**: publish the welcome announcement / newsletter / first deadlines and confirm they appear under Resources & Records.
7. Verify Firestore security rules on the `nu-chapter-connect-portal` Firebase project (alumni directory + mentor requests).
8. Walk every screen on a phone — the wash/scrim system should keep text readable over every chapter photo.
