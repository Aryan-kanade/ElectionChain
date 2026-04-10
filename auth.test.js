/**
 * tests/auth.test.js
 * Tests: OTP send/verify, register, login
 */

require('./setup');
const request = require('supertest');
const app     = require('../app');
const { OTP, User } = require('../models');
const { sha256 }    = require('../utils/crypto');

describe('POST /api/auth/send-otp', () => {
  it('returns 400 for invalid email', async () => {
    const res = await request(app).post('/api/auth/send-otp').send({ email: 'notanemail' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('sends OTP and returns devOTP in non-production', async () => {
    process.env.NODE_ENV = 'test';
    const res = await request(app).post('/api/auth/send-otp').send({ email: 'test@example.com' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.devOTP).toMatch(/^\d{6}$/);
  });

  it('creates OTP record in database', async () => {
    await request(app).post('/api/auth/send-otp').send({ email: 'dbcheck@example.com' });
    const rec = await OTP.findOne({ email: 'dbcheck@example.com' });
    expect(rec).toBeTruthy();
    expect(rec.verified).toBe(false);
    expect(rec.expiry.getTime()).toBeGreaterThan(Date.now());
  });
});

describe('POST /api/auth/verify-otp', () => {
  it('returns 400 if no OTP record exists', async () => {
    const res = await request(app).post('/api/auth/verify-otp').send({ email: 'nobody@example.com', otp: '123456' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/No OTP found/);
  });

  it('returns 400 for wrong OTP', async () => {
    await OTP.create({ email: 'test@example.com', otpHash: sha256('654321'), expiry: new Date(Date.now() + 60000), verified: false });
    const res = await request(app).post('/api/auth/verify-otp').send({ email: 'test@example.com', otp: '000000' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Incorrect OTP/);
  });

  it('verifies correct OTP and marks it used', async () => {
    const otp = '847291';
    await OTP.create({ email: 'correct@example.com', otpHash: sha256(otp), expiry: new Date(Date.now() + 60000), verified: false });
    const res = await request(app).post('/api/auth/verify-otp').send({ email: 'correct@example.com', otp });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const rec = await OTP.findOne({ email: 'correct@example.com' });
    expect(rec.verified).toBe(true);
  });

  it('returns 400 if OTP is already used', async () => {
    await OTP.create({ email: 'used@example.com', otpHash: sha256('111111'), expiry: new Date(Date.now() + 60000), verified: true });
    const res = await request(app).post('/api/auth/verify-otp').send({ email: 'used@example.com', otp: '111111' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already used/);
  });

  it('returns 400 for expired OTP', async () => {
    await OTP.create({ email: 'expired@example.com', otpHash: sha256('999999'), expiry: new Date(Date.now() - 1000), verified: false });
    const res = await request(app).post('/api/auth/verify-otp').send({ email: 'expired@example.com', otp: '999999' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/expired/);
  });
});

describe('POST /api/auth/register', () => {
  const validDescriptor = Array(128).fill(0.1);
  const validPayload = {
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    name: 'Test Voter',
    email: 'voter@example.com',
    faceDescriptor: validDescriptor,
  };

  beforeEach(async () => {
    // Pre-verify OTP so register can proceed
    await OTP.create({ email: 'voter@example.com', otpHash: sha256('111111'), expiry: new Date(Date.now() + 60000), verified: true });
  });

  it('returns 400 if email not OTP-verified', async () => {
    const res = await request(app).post('/api/auth/register').send({ ...validPayload, email: 'unverified@example.com' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Email not verified/);
  });

  it('returns 400 for invalid wallet address', async () => {
    const res = await request(app).post('/api/auth/register').send({ ...validPayload, address: 'notanaddress' });
    expect(res.status).toBe(400);
  });

  it('registers voter successfully and returns JWT', async () => {
    const res = await request(app).post('/api/auth/register').send(validPayload);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.role).toBe('voter');
  });

  it('prevents duplicate wallet address registration', async () => {
    await request(app).post('/api/auth/register').send(validPayload);

    await OTP.create({ email: 'other@example.com', otpHash: sha256('222222'), expiry: new Date(Date.now() + 60000), verified: true });
    const res = await request(app).post('/api/auth/register').send({ ...validPayload, email: 'other@example.com' });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already registered/);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await User.create({
      address: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
      name: 'Existing Voter', email: 'existing@example.com',
      faceHash: 'abc', emailHash: 'def',
      faceDescriptor: Array(128).fill(0.1),
    });
  });

  it('returns 404 for unregistered address', async () => {
    const res = await request(app).post('/api/auth/login').send({ address: '0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF' });
    expect(res.status).toBe(404);
  });

  it('logs in registered voter and returns token', async () => {
    const res = await request(app).post('/api/auth/login').send({ address: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.role).toBe('voter');
  });

  it('returns 403 for non-admin address trying admin login', async () => {
    process.env.ADMIN_ADDRESS = '0xadminaddressdeadbeef000000000000000000000';
    const res = await request(app).post('/api/auth/login').send({ address: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266', role: 'admin' });
    expect(res.status).toBe(403);
  });
});
