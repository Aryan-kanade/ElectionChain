/**
 * tests/vote.test.js
 * Tests: castVote atomic logic, face token validation, double-vote prevention
 */

require('./setup');
const request  = require('supertest');
const app      = require('../app');
const jwt      = require('jsonwebtoken');
const { User, Candidate, AuditLog } = require('../models');

const SECRET = process.env.JWT_SECRET || 'dev_secret_change_in_production';

function makeVoterToken(address) {
  return jwt.sign({ address, role: 'voter' }, SECRET, { expiresIn: '2h' });
}
function makeAdminToken(address) {
  return jwt.sign({ address, role: 'admin' }, SECRET, { expiresIn: '2h' });
}
function makeFaceToken(address, expiresIn = '5m') {
  return jwt.sign({ address, faceVerified: true }, SECRET, { expiresIn });
}

const VOTER_ADDR = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';

async function seedVoterAndCandidate() {
  await User.create({
    address: VOTER_ADDR,
    name: 'Test Voter', email: 'voter@test.com',
    faceHash: 'abc', emailHash: 'def',
    faceDescriptor: Array(128).fill(0.1),
    role: 'voter', hasVoted: false,
  });
  await Candidate.create({ candidateId: 1, name: 'Alice', party: 'Party A', approved: true, voteCount: 0 });
}

describe('POST /api/vote', () => {
  beforeEach(seedVoterAndCandidate);

  it('returns 401 without auth token', async () => {
    const res = await request(app).post('/api/vote').send({ candidateId: 1, faceToken: 'x' });
    expect(res.status).toBe(401);
  });

  it('returns 401 with missing faceToken', async () => {
    const res = await request(app).post('/api/vote')
      .set('Authorization', `Bearer ${makeVoterToken(VOTER_ADDR)}`)
      .send({ candidateId: 1 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Face verification token required/);
  });

  it('returns 401 with expired face token', async () => {
    const expiredFaceToken = makeFaceToken(VOTER_ADDR, '-1s');
    const res = await request(app).post('/api/vote')
      .set('Authorization', `Bearer ${makeVoterToken(VOTER_ADDR)}`)
      .send({ candidateId: 1, faceToken: expiredFaceToken });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Face verification token invalid/);
  });

  it('returns 401 when face token address does not match voter', async () => {
    const wrongFaceToken = makeFaceToken('0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef');
    const res = await request(app).post('/api/vote')
      .set('Authorization', `Bearer ${makeVoterToken(VOTER_ADDR)}`)
      .send({ candidateId: 1, faceToken: wrongFaceToken });
    expect(res.status).toBe(401);
  });

  it('casts vote successfully and returns refNo + voteHash', async () => {
    const faceToken = makeFaceToken(VOTER_ADDR);
    const res = await request(app).post('/api/vote')
      .set('Authorization', `Bearer ${makeVoterToken(VOTER_ADDR)}`)
      .send({ candidateId: 1, faceToken });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.refNo).toMatch(/^EC-/);
    expect(res.body.voteHash).toBeTruthy();
  });

  it('increments candidate voteCount after successful vote', async () => {
    const faceToken = makeFaceToken(VOTER_ADDR);
    await request(app).post('/api/vote')
      .set('Authorization', `Bearer ${makeVoterToken(VOTER_ADDR)}`)
      .send({ candidateId: 1, faceToken });
    const cand = await Candidate.findOne({ candidateId: 1 });
    expect(cand.voteCount).toBe(1);
  });

  it('marks voter hasVoted=true after successful vote', async () => {
    const faceToken = makeFaceToken(VOTER_ADDR);
    await request(app).post('/api/vote')
      .set('Authorization', `Bearer ${makeVoterToken(VOTER_ADDR)}`)
      .send({ candidateId: 1, faceToken });
    const user = await User.findOne({ address: VOTER_ADDR });
    expect(user.hasVoted).toBe(true);
    expect(user.votedCandidateId).toBe(1);
  });

  it('writes VOTE_CAST audit log entry', async () => {
    const faceToken = makeFaceToken(VOTER_ADDR);
    await request(app).post('/api/vote')
      .set('Authorization', `Bearer ${makeVoterToken(VOTER_ADDR)}`)
      .send({ candidateId: 1, faceToken });
    const log = await AuditLog.findOne({ action: 'VOTE_CAST' });
    expect(log).toBeTruthy();
    expect(log.candidateId).toBe(1);
    expect(log.refNo).toMatch(/^EC-/);
  });

  it('prevents double voting — second vote returns 400', async () => {
    const faceToken = makeFaceToken(VOTER_ADDR);
    await request(app).post('/api/vote')
      .set('Authorization', `Bearer ${makeVoterToken(VOTER_ADDR)}`)
      .send({ candidateId: 1, faceToken });

    const faceToken2 = makeFaceToken(VOTER_ADDR);
    const res = await request(app).post('/api/vote')
      .set('Authorization', `Bearer ${makeVoterToken(VOTER_ADDR)}`)
      .send({ candidateId: 1, faceToken: faceToken2 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already voted/);
  });

  it('voteCount does not increment on double-vote attempt', async () => {
    const ft1 = makeFaceToken(VOTER_ADDR);
    await request(app).post('/api/vote')
      .set('Authorization', `Bearer ${makeVoterToken(VOTER_ADDR)}`)
      .send({ candidateId: 1, faceToken: ft1 });

    const ft2 = makeFaceToken(VOTER_ADDR);
    await request(app).post('/api/vote')
      .set('Authorization', `Bearer ${makeVoterToken(VOTER_ADDR)}`)
      .send({ candidateId: 1, faceToken: ft2 });

    const cand = await Candidate.findOne({ candidateId: 1 });
    expect(cand.voteCount).toBe(1); // must stay at 1, not 2
  });

  it('returns 403 when admin tries to vote', async () => {
    const adminAddr = '0xadmin000000000000000000000000000000000000';
    process.env.ADMIN_ADDRESS = adminAddr;
    const faceToken = makeFaceToken(adminAddr);
    const res = await request(app).post('/api/vote')
      .set('Authorization', `Bearer ${makeAdminToken(adminAddr)}`)
      .send({ candidateId: 1, faceToken });
    expect(res.status).toBe(403);
  });

  it('returns 400 for non-existent candidateId', async () => {
    const faceToken = makeFaceToken(VOTER_ADDR);
    const res = await request(app).post('/api/vote')
      .set('Authorization', `Bearer ${makeVoterToken(VOTER_ADDR)}`)
      .send({ candidateId: 999, faceToken });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Candidate not found/);
  });
});
