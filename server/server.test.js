import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

// pg is mocked so tests never touch the real Supabase database — only the
// route handlers, auth, and middleware are under test here.
const queryMock = vi.fn().mockResolvedValue({ rows: [], rowCount: 0 });

vi.mock('pg', () => {
  class Pool {
    query = queryMock;
    on = vi.fn();
    end = vi.fn();
  }
  return { default: { Pool } };
});

process.env.PASSWORD = 'test-member-password';
process.env.ADMIN_PASSWORD = 'test-admin-password';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET = 'test-jwt-secret-for-vitest';
process.env.NODE_ENV = 'test';
delete process.env.FRONTEND_URL;

// Fresh module (and fresh in-memory rate-limit state) per test, since
// server.js keeps rateLimitStore as module-level state.
async function freshApp() {
  vi.resetModules();
  const mod = await import('./server.js');
  return mod.default;
}

beforeEach(() => {
  queryMock.mockReset();
  queryMock.mockResolvedValue({ rows: [], rowCount: 0 });
});

describe('GET /health', () => {
  it('responds healthy', async () => {
    const app = await freshApp();
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
  });
});

describe('POST /api/auth', () => {
  it('issues a member token for the member password', async () => {
    const app = await freshApp();
    const res = await request(app).post('/api/auth').send({ password: 'test-member-password' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.role).toBe('member');
    expect(typeof res.body.token).toBe('string');
  });

  it('issues an admin token for the admin password', async () => {
    const app = await freshApp();
    const res = await request(app).post('/api/auth').send({ password: 'test-admin-password' });
    expect(res.status).toBe(200);
    expect(res.body.role).toBe('admin');
  });

  it('rejects a wrong password', async () => {
    const app = await freshApp();
    const res = await request(app).post('/api/auth').send({ password: 'not-the-password' });
    expect(res.status).toBe(401);
  });

  it('rate-limits after repeated failed attempts', async () => {
    const app = await freshApp();
    let lastRes;
    for (let i = 0; i < 21; i += 1) {
      lastRes = await request(app).post('/api/auth').send({ password: 'still-wrong' });
    }
    expect(lastRes.status).toBe(429);
  });
});

describe('GET /api/families', () => {
  it('requires a token', async () => {
    const app = await freshApp();
    const res = await request(app).get('/api/families');
    expect(res.status).toBe(401);
  });

  it('returns families for a valid member token', async () => {
    const app = await freshApp();
    const login = await request(app).post('/api/auth').send({ password: 'test-member-password' });
    const token = login.body.token;

    queryMock.mockResolvedValueOnce({ rows: [{ id: 1, name: 'WOLFPACK' }], rowCount: 1 });

    const res = await request(app).get('/api/families').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: 1, name: 'WOLFPACK' }]);
  });
});

describe('requireAdmin', () => {
  it('rejects a member token on an admin write route', async () => {
    const app = await freshApp();
    const login = await request(app).post('/api/auth').send({ password: 'test-member-password' });
    const token = login.body.token;

    const res = await request(app)
      .post('/api/brothers')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Brother', family: 'WOLFPACK' });
    expect(res.status).toBe(403);
  });

  it('accepts an admin token on the same route shape (auth passes; may still fail downstream)', async () => {
    const app = await freshApp();
    const login = await request(app).post('/api/auth').send({ password: 'test-admin-password' });
    const token = login.body.token;

    const res = await request(app)
      .post('/api/brothers')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    // requireAdmin passes; the empty body should fail validation, not auth.
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
  });
});
