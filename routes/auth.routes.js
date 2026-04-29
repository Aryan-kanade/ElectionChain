/**
 * routes/auth.routes.js
 */

const router     = require('express').Router();
const rateLimit  = require('express-rate-limit');
const ctrl       = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const {
  validateSendOTP,
  validateVerifyOTP,
  validateRegister,
  validateLogin,
} = require('../middleware/validate.middleware');

// Strict OTP limiter: 3 requests / minute per IP
const otpLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  message: { success: false, error: 'Too many OTP requests. Wait 1 minute.' },
});

router.post('/send-otp',    otpLimiter, validateSendOTP,   ctrl.sendOTP);
router.post('/verify-otp',             validateVerifyOTP,  ctrl.verifyOTP);
router.post('/register',               validateRegister,   ctrl.register);
router.post('/login',                  validateLogin,      ctrl.login);
router.post('/verify-face', verifyToken,                   ctrl.verifyFace);

module.exports = router;
