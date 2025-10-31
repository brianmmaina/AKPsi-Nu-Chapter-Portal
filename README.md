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

## Project Structure

```
.
├── client/          # React frontend
│   └── src/
│       ├── components/    # React components
│       ├── api.js         # API client
│       └── themes.js      # Theme configurations
└── server/          # Express backend
    ├── server.js    # API server
    ├── init-db.js   # Database initialization
    └── database.sqlite    # SQLite database (auto-generated)
```

## Deployment (Render)

### Backend (Web Service)
- **Build**: `cd server && npm install`
- **Start**: `cd server && node server.js`
- **Env Vars**: `PORT` (auto), `PASSWORD` (your password)

### Frontend (Static Site)
- **Build**: `cd client && npm install && npm run build`
- **Publish**: `client/dist`
- **Env Vars**: `VITE_API_URL` (your backend URL)

## Adding Brothers

Use the web interface (click brother → "Add Little") or modify `server/add-brother-example.js`.

