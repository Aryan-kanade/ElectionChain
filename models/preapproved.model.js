'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const PreapprovedUserSchema = new Schema({
  aadhaarHash:  { type: String, required: true, unique: true }, // sha256(aadhaar)
  aadhaarLast4: { type: String, required: true },
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  isRegistered: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('PreapprovedUser', PreapprovedUserSchema);
