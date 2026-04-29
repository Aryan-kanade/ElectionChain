/**
 * models/index.js
 * All Mongoose schemas and models in one place.
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

// ── USER ──────────────────────────────────────────────────────────
const UserSchema = new Schema({
  address:       { type: String, required: true, unique: true, lowercase: true },
  name:          { type: String, required: true, trim: true },
  email:         { type: String, required: true, unique: true, lowercase: true },
  faceHash:      { type: String },
  emailHash:     { type: String },
  faceDescriptor:{ type: [Number], default: [] },
  photoUrl:      { type: String, default: '' },
  role:          { type: String, enum: ['voter', 'admin'], default: 'voter' },
  hasVoted:      { type: Boolean, default: false },
}, { timestamps: true });

// ── OTP ───────────────────────────────────────────────────────────
const OTPSchema = new Schema({
  email:    { type: String, required: true, unique: true, lowercase: true },
  otpHash:  { type: String, required: true },
  expiry:   { type: Date,   required: true },
  verified: { type: Boolean, default: false },
  attempts: { type: Number,  default: 0 },
}, { timestamps: true });

// ── CANDIDATE ─────────────────────────────────────────────────────
const CandidateSchema = new Schema({
  id:        { type: Number, required: true, unique: true },
  name:      { type: String, required: true, trim: true },
  party:     { type: String, default: 'Independent', trim: true },
  voteCount: { type: Number, default: 0 },
  approved:  { type: Boolean, default: true },
}, { timestamps: true });

// ── ELECTION CONFIG ───────────────────────────────────────────────
const ElectionConfigSchema = new Schema({
  key:   { type: String, required: true, unique: true },
  value: { type: Schema.Types.Mixed },
}, { timestamps: true });

// ── AUDIT LOG ─────────────────────────────────────────────────────
const AuditLogSchema = new Schema({
  action:     { type: String, required: true },
  address:    { type: String },
  voterHash:  { type: String },
  voteHash:   { type: String },
  refNo:      { type: String },
  blockchain: { type: Boolean, default: false },
  data:       { type: Schema.Types.Mixed },
  timestamp:  { type: Date, default: Date.now },
});

// ── ADMIN LOG ─────────────────────────────────────────────────────
const AdminLogSchema = new Schema({
  address:   { type: String, required: true },
  action:    { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

// ── RESULT PROPOSAL ───────────────────────────────────────────────
const ResultProposalSchema = new Schema({
  proposedBy: { type: [String], default: [] },
  approvals:  { type: Number, default: 0 },
  required:   { type: Number, default: 2 },
  executed:   { type: Boolean, default: false },
}, { timestamps: true });

// ── FLAGGED VOTE (AI Fraud Detection) ─────────────────────────────
const FlaggedVoteSchema = new Schema(
  {
    voterHash:   { type: String, required: true, index: true },
    address:     { type: String, required: true, lowercase: true },
    candidateId: { type: Number },
    refNo:       { type: String },
    fraudScore:  { type: Number },
    features: {
      timeDiff:      Number,
      attempts:      Number,
      ipFrequency:   Number,
      activityCount: Number,
    },
    status: {
      type:    String,
      enum:    ['PENDING', 'REVIEWED', 'CLEARED', 'CONFIRMED_FRAUD'],
      default: 'PENDING',
      index:   true,
    },
    reviewedBy:  { type: String },
    reviewNotes: { type: String },
    reviewedAt:  { type: Date },
    voteBlocked: { type: Boolean, default: false },
  },
  { timestamps: true, collection: 'flaggedvotes' }
);
FlaggedVoteSchema.index({ status: 1, createdAt: -1 });

module.exports = {
  User:           mongoose.model('User',           UserSchema),
  OTP:            mongoose.model('OTP',            OTPSchema),
  Candidate:      mongoose.model('Candidate',      CandidateSchema),
  ElectionConfig: mongoose.model('ElectionConfig', ElectionConfigSchema),
  AuditLog:       mongoose.model('AuditLog',       AuditLogSchema),
  AdminLog:       mongoose.model('AdminLog',        AdminLogSchema),
  ResultProposal: mongoose.model('ResultProposal', ResultProposalSchema),
  FlaggedVote:    mongoose.model('FlaggedVote',    FlaggedVoteSchema),
};
