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

**Frontend — Vercel** (config in `vercel.json`): builds `client/`, SPA rewrite to `index.html`. Set env vars from `client/.env.example` in the Vercel dashboard — `VITE_API_URL` must point at the deployed server.

**Backend — Render** (web service: root directory `server`, start command `node server.js`): the server already handles Render's proxy headers and SSL. Required env vars, set in the Render dashboard:

| Var | Purpose |
|---|---|
| `DATABASE_URL` | Supabase Postgres connection string (Session Pooler URL preferred on IPv4-only hosts; direct URLs are auto-converted) |
| `PASSWORD` | Member password |
| `ADMIN_PASSWORD` | Officer password (falls back to `PASSWORD` with a warning — set it) |
| `JWT_SECRET` | Token signing secret — **required in production; server exits without it** |
| `FRONTEND_URL` | Deployed frontend origin — locks CORS to it |
| `NODE_ENV` | `production` |

Tables are created/migrated automatically on server start (`initializeDatabase`), including the `posts` table for the Information Hub.

`railway.json`, `server/Dockerfile`, and `server/fly.toml` are leftovers from other hosts and can be ignored; Vercel + Render is the canonical pair.

## Fall launch checklist

1. Set a fresh `PASSWORD` and a distinct `ADMIN_PASSWORD`; set `JWT_SECRET` and `FRONTEND_URL` on the server.
2. Deploy server → confirm `GET /health` responds; deploy client with `VITE_API_URL` set.
3. Log in with the member password → confirm read-only (Officer Tools rejects it).
4. Unlock Officer Tools with the officer password → **Roster & Trees**: mark the graduating class as Graduated, add the new pledge class, fix any Big links.
5. **Hub Posts**: publish the welcome announcement / newsletter / first deadlines and confirm they appear under Resources & Records.
6. Verify Firestore security rules on the `nu-chapter-connect-portal` Firebase project (alumni directory + mentor requests).
7. Walk every screen on a phone — the wash/scrim system should keep text readable over every chapter photo.
