/**
 * models/flaggedVote.model.js
 * Schema for votes flagged as suspicious by the AI fraud service.
 * Add to your existing models/index.js exports.
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

const FlaggedVoteSchema = new Schema(
  {
    // ── Identity (hashed — no PII stored) ──────────────────────────
    voterHash:   { type: String, required: true, index: true },  // sha256(address)
    address:     { type: String, required: true, lowercase: true },

    // ── Vote context ───────────────────────────────────────────────
    candidateId: { type: Number },
    refNo:       { type: String },                               // EC-XXXXX ref

    // ── Fraud signal ───────────────────────────────────────────────
    fraudScore:  { type: Number },                               // IF anomaly score
    features: {
      timeDiff:      Number,
      attempts:      Number,
      ipFrequency:   Number,
      activityCount: Number,
    },

    // ── Resolution ─────────────────────────────────────────────────
    status: {
      type:    String,
      enum:    ['PENDING', 'REVIEWED', 'CLEARED', 'CONFIRMED_FRAUD'],
      default: 'PENDING',
      index:   true,
    },
    reviewedBy:  { type: String },   // admin address
    reviewNotes: { type: String },
    reviewedAt:  { type: Date },

    // ── Vote was blocked or allowed through ────────────────────────
    voteBlocked: { type: Boolean, default: false },
  },
  {
    timestamps: true,          // createdAt, updatedAt
    collection: 'flaggedvotes',
  }
);

// Compound index for admin review queue
FlaggedVoteSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('FlaggedVote', FlaggedVoteSchema);
