/**
 * models/index.js
 * All Mongoose schemas & models in one place.
 * Import individual models: const { User, OTP } = require('./models');
 */

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// ── USER ──────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  address:          { type: String, required: true, unique: true, lowercase: true, trim: true },
  name:             { type: String, required: true, trim: true, maxlength: 100 },
  email:            { type: String, required: true, unique: true, lowercase: true, trim: true },
  faceHash:         { type: String, required: true },
  emailHash:        { type: String, required: true },
  faceDescriptor:   { type: [Number], required: true },
  photoUrl:         { type: String, default: '' },
  role:             { type: String, enum: ['voter', 'admin'], default: 'voter' },
  hasVoted:         { type: Boolean, default: false, index: true },
  votedCandidateId: { type: Number, default: null },
  registeredAt:     { type: Date, default: Date.now },
}, { timestamps: true });

// Compound index speeds up address+hasVoted lookup in the atomic vote query
userSchema.index({ address: 1, hasVoted: 1 });

// ── OTP ───────────────────────────────────────────────────────────
const otpSchema = new mongoose.Schema({
  email:    { type: String, required: true, unique: true, lowercase: true },
  otpHash:  { type: String, required: true },
  expiry:   { type: Date,   required: true, index: { expireAfterSeconds: 0 } },
  verified: { type: Boolean, default: false },
  attempts: { type: Number,  default: 0 },
}, { timestamps: true });

// ── CANDIDATE ─────────────────────────────────────────────────────
const candidateSchema = new mongoose.Schema({
  candidateId: { type: Number, required: true, unique: true },
  name:        { type: String, required: true, trim: true, maxlength: 100 },
  party:       { type: String, default: 'Independent', trim: true, maxlength: 100 },
  approved:    { type: Boolean, default: true },
  voteCount:   { type: Number,  default: 0 },
  addedBy:     { type: String },
  addedAt:     { type: Date, default: Date.now },
}, { timestamps: true });

// ── AUDIT LOG ─────────────────────────────────────────────────────
const auditSchema = new mongoose.Schema({
  id:          { type: String, default: () => uuidv4(), index: true },
  action:      { type: String, required: true, index: true },
  address:     { type: String, index: true },
  voterHash:   { type: String, index: true },
  candidateId: { type: Number },
  voteHash:    { type: String },
  refNo:       { type: String },
  blockchain:  { type: Boolean },
  data:        { type: mongoose.Schema.Types.Mixed },
  timestamp:   { type: Date, default: Date.now, index: true },
}, { timestamps: false });

// ── ADMIN LOG ─────────────────────────────────────────────────────
const adminLogSchema = new mongoose.Schema({
  id:        { type: String, default: () => uuidv4() },
  address:   { type: String, required: true, index: true },
  action:    { type: String, required: true },
  timestamp: { type: Date, default: Date.now, index: true },
});

// ── RESULT PROPOSAL ───────────────────────────────────────────────
const resultProposalSchema = new mongoose.Schema({
  approvedBy: [{ type: String }],
  executed:   { type: Boolean, default: false },
  executedAt: { type: Date },
}, { timestamps: true });

// ── ELECTION CONFIG ───────────────────────────────────────────────
const electionConfigSchema = new mongoose.Schema({
  key:       { type: String, default: 'main', unique: true },
  startTime: { type: Date },
  endTime:   { type: Date },
  updatedBy: { type: String },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = {
  User:           mongoose.model('User',           userSchema),
  OTP:            mongoose.model('OTP',            otpSchema),
  Candidate:      mongoose.model('Candidate',      candidateSchema),
  AuditLog:       mongoose.model('AuditLog',       auditSchema),
  AdminLog:       mongoose.model('AdminLog',       adminLogSchema),
  ResultProposal: mongoose.model('ResultProposal', resultProposalSchema),
  ElectionConfig: mongoose.model('ElectionConfig', electionConfigSchema),
};
