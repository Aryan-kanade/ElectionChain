/**
 * tests/candidate.test.js
 * Tests: GET/POST candidates, admin-only protection
 */

require('./setup');
const request   = require('supertest');
const app       = require('../app');
const jwt       = require('jsonwebtoken');
const { Candidate } = require('../models');

const SECRET = process.env.JWT_SECRET || 'dev_secret_change_in_production';
const ADMIN  = '0xadmin000000000000000000000000000000000001';

function adminToken()  { return jwt.sign({ address: ADMIN, role: 'admin' },  SECRET, { expiresIn: '1h' }); }
function voterToken()  { return jwt.sign({ address: '0xvoter000000000000000000000000000000000001', role: 'voter' }, SECRET, { expiresIn: '1h' }); }

beforeEach(() => { process.env.ADMIN_ADDRESS = ADMIN; });

describe('GET /api/candidates', () => {
  it('returns empty array when no candidates', async () => {
    const res = await request(app).get('/api/candidates');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.candidates).toEqual([]);
  });

  it('returns candidates from database', async () => {
    await Candidate.create({ candidateId: 1, name: 'Alice', party: 'Party A', approved: true });
    await Candidate.create({ candidateId: 2, name: 'Bob',   party: 'Party B', approved: true });
    const res = await request(app).get('/api/candidates');
    expect(res.status).toBe(200);
    expect(res.body.candidates).toHaveLength(2);
    expect(res.body.candidates[0].name).toBe('Alice');
  });

  it('returns candidates without auth token (public route)', async () => {
    const res = await request(app).get('/api/candidates');
    expect(res.status).toBe(200); // must NOT be 401
  });
});

describe('POST /api/candidates', () => {
  it('returns 401 without auth token', async () => {
    const res = await request(app).post('/api/candidates').send({ name: 'Eve', party: 'Party E' });
    expect(res.status).toBe(401);
  });

  it('returns 403 for voter trying to add candidate', async () => {
    const res = await request(app).post('/api/candidates')
      .set('Authorization', `Bearer ${voterToken()}`)
      .send({ name: 'Eve', party: 'Party E' });
    expect(res.status).toBe(403);
  });

  it('returns 400 if name is missing', async () => {
    const res = await request(app).post('/api/candidates')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ party: 'Party X' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/name/i);
  });

  it('admin can add candidate successfully', async () => {
    const res = await request(app).post('/api/candidates')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ name: 'Carol', party: 'Party C' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.candidate.name).toBe('Carol');
    expect(res.body.candidate.party).toBe('Party C');
    expect(res.body.candidate.id).toBe(1);
  });

  it('auto-increments candidateId', async () => {
    await Candidate.create({ candidateId: 1, name: 'First', party: 'P1', approved: true });
    const res = await request(app).post('/api/candidates')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ name: 'Second', party: 'P2' });
    expect(res.body.candidate.id).toBe(2);
  });

  it('defaults party to Independent when not provided', async () => {
    const res = await request(app).post('/api/candidates')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ name: 'Independent Dan' });
    expect(res.status).toBe(201);
    expect(res.body.candidate.party).toBe('Independent');
  });
});

/**
 * tests/middleware.test.js (inline — tests auth + validation middleware)
 */
describe('Auth middleware', () => {
  it('returns 401 for malformed Bearer token', async () => {
    const res = await request(app).get('/api/audit')
      .set('Authorization', 'Bearer this.is.not.valid');
    expect(res.status).toBe(401);
  });

  it('returns 401 when Authorization header is missing', async () => {
    const res = await request(app).get('/api/audit');
    expect(res.status).toBe(401);
  });

  it('returns 401 for expired JWT', async () => {
    const expiredToken = jwt.sign({ address: '0x123', role: 'voter' }, SECRET, { expiresIn: '-1s' });
    const res = await request(app).get('/api/audit')
      .set('Authorization', `Bearer ${expiredToken}`);
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/expired/i);
  });
});

describe('Input validation middleware', () => {
  it('rejects NoSQL injection in email field', async () => {
    const res = await request(app).post('/api/auth/send-otp')
      .send({ email: { $gt: '' } });
    expect(res.status).toBe(400); // mongoSanitize strips $gt, email becomes invalid
  });

  it('rejects short candidate names', async () => {
    const res = await request(app).post('/api/candidates')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ name: 'A', party: 'P' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/2 characters/);
  });

  it('validates election times — end before start returns 400', async () => {
    const res = await request(app).post('/api/election/set-times')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ startTime: Date.now() + 10000, endTime: Date.now() + 1000 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/before endTime/);
  });
});

describe('GET /api/health', () => {
  it('returns ok status without auth', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.version).toBe('4.0.0');
  });
});

describe('404 handler', () => {
  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/api/doesnotexist');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
