'use strict';
const { sha256 } = require('../crypto');
const PreapprovedUser = require('../models/preapproved.model');

// POST /api/auth/aadhaar/check
// Body: { aadhaarNumber, email }
exports.checkAadhaar = async (req, res, next) => {
  try {
    const { aadhaarNumber, email } = req.body;

    if (!aadhaarNumber || !/^\d{12}$/.test(aadhaarNumber))
      return res.status(400).json({ success: false, error: 'Aadhaar must be exactly 12 digits.' });
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ success: false, error: 'Valid email is required.' });

    const emailNorm   = email.toLowerCase().trim();
    const aadhaarHash = sha256(aadhaarNumber);

    const record = await PreapprovedUser.findOne({ aadhaarHash, email: emailNorm });

    if (!record)
      return res.status(404).json({ success: false, error: 'Aadhaar and email do not match our records.' });

    if (record.isRegistered)
      return res.status(409).json({ success: false, error: `This Aadhaar (XXXX-XXXX-${record.aadhaarLast4}) is already registered.` });

    return res.json({
      success:   true,
      message:   'Aadhaar verified. OTP will be sent to your email.',
      aadhaar:   `XXXX-XXXX-${record.aadhaarLast4}`,
      expiresIn: 300,
    });

  } catch (e) { next(e); }
};
