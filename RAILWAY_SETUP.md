# Railway Setup Guide

## Environment Variables

Set these in Railway → Your Service → Variables:

- `NODE_ENV=production`
- `PASSWORD=(your password)`
- `DATABASE_URL=(use Session Pooler connection string from Supabase)`
- `JWT_SECRET=(random string)`
- `FRONTEND_URL=https://akpsi-family-tree.vercel.app`
- `PORT=3001`

## Database Connection

**Important**: Use Supabase **Session Pooler** connection (IPv4 compatible), not direct connection.

The code will automatically convert direct connections to pooler format, but it's best to use the pooler string from Supabase directly.

Format: `postgresql://postgres.PROJECTREF:PASSWORD@aws-1-us-east-1.pooler.supabase.com:5432/postgres`
