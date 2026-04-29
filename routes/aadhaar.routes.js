'use strict';
const router    = require('express').Router();
const rateLimit = require('express-rate-limit');
const ctrl      = require('../controllers/aadhaar.controller');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: 'Too many Aadhaar checks. Try again in 15 minutes.' },
  standardHeaders: true, legacyHeaders: false,
});

// POST /api/auth/aadhaar/check
router.post('/check', limiter, ctrl.checkAadhaar);

module.exports = router;
