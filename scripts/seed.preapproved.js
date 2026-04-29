'use strict';
/**
 * scripts/seed.preapproved.js
 * Run once: node scripts/seed.preapproved.js
 * Add real Aadhaar+email pairs to VOTERS before running.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const crypto   = require('crypto');
const sha256   = s => crypto.createHash('sha256').update(String(s)).digest('hex');

// ── ADD YOUR VOTERS HERE ─────────────────────────────────────────
const VOTERS = [
  { aadhaarNumber: '123456789012', email: 'voter1@test.com' },
  { aadhaarNumber: '234567890123', email: 'voter2@test.com' },
  { aadhaarNumber: '345678901234', email: 'aryan@demo.com' },
  { aadhaarNumber: '456789012345', email: 'testvoter@gmail.com' },
  { aadhaarNumber: '567890123456', email: 'demo.user@example.com' },
];
// ─────────────────────────────────────────────────────────────────

const Schema = new mongoose.Schema({
  aadhaarHash:  { type: String, required: true, unique: true },
  aadhaarLast4: String,
  email:        { type: String, required: true, unique: true, lowercase: true },
  isRegistered: { type: Boolean, default: false },
}, { timestamps: true });

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/electionchain');
  const PreapprovedUser = mongoose.model('PreapprovedUser', Schema);
  let ok = 0, skip = 0;
  for (const { aadhaarNumber, email } of VOTERS) {
    if (!/^\d{12}$/.test(aadhaarNumber)) { console.warn(`⚠ Skip bad Aadhaar: ${email}`); skip++; continue; }
    try {
      await PreapprovedUser.create({ aadhaarHash: sha256(aadhaarNumber), aadhaarLast4: aadhaarNumber.slice(-4), email: email.toLowerCase() });
      console.log(`✓ Seeded: ${email} (XXXX-XXXX-${aadhaarNumber.slice(-4)})`);
      ok++;
    } catch(e) {
      if (e.code === 11000) { console.log(`↩ Already exists: ${email}`); skip++; }
      else console.error(`✗ Failed ${email}:`, e.message);
    }
  }
  console.log(`\nDone — ${ok} seeded, ${skip} skipped.`);
  await mongoose.disconnect();
}
seed().catch(e => { console.error(e); process.exit(1); });
