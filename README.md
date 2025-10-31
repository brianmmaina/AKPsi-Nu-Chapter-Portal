# Alpha Kappa Psi Family Trees

Interactive family tree visualization for fraternity families.

## Quick Start

```bash
# Install dependencies
npm run install:all

# Setup environment
cd server && cp .env.example .env
# Edit .env and set PASSWORD

# Initialize database
cd server && npm run init-db

# Start development
npm run dev
```

## Free Deployment

See `DEPLOY_MANUAL_FREE.md` for step-by-step guides:
- **Render Free Tier** (manual setup)
- **Railway** (recommended - instant, free)
- **Vercel + Railway** (fastest option)

## Project Structure

```
.
├── client/          # React frontend
│   └── src/
│       ├── components/    # React components
│       ├── api.js         # API client
│       └── themes.js      # Theme configurations
└── server/          # Express backend
    ├── server.js    # API server (auto-inits DB)
    └── init-db.js   # Manual DB init (optional)
```
