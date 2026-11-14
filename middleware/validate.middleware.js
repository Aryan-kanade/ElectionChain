/**
 * middleware/validate.middleware.js
 * Lightweight input validators — keeps controllers clean.
 * Each validator is an Express middleware that calls next() or returns 400.
 */

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).toLowerCase());
}

function validateEthAddress(address) {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// ── VALIDATORS ────────────────────────────────────────────────────

const validateSendOTP = (req, res, next) => {
  const { email } = req.body;
  if (!email || !validateEmail(email))
    return res.status(400).json({ success: false, error: 'A valid email address is required.' });
  req.body.email = email.toLowerCase().trim();
  next();
};

const validateVerifyOTP = (req, res, next) => {
  const { email, otp } = req.body;
  if (!email || !validateEmail(email))
    return res.status(400).json({ success: false, error: 'Valid email required.' });
  if (!otp || !/^\d{6}$/.test(otp.toString().trim()))
    return res.status(400).json({ success: false, error: 'OTP must be a 6-digit number.' });
  req.body.email = email.toLowerCase().trim();
  req.body.otp   = otp.toString().trim();
  next();
};

const validateRegister = (req, res, next) => {
  const { address, name, email, faceDescriptor } = req.body;
  if (!address)                       return res.status(400).json({ success: false, error: 'Wallet address is required.' });
  if (!validateEthAddress(address))   return res.status(400).json({ success: false, error: 'Invalid wallet address format.' });
  if (!name || name.trim().length < 2) return res.status(400).json({ success: false, error: 'Name must be at least 2 characters.' });
  if (!email || !validateEmail(email)) return res.status(400).json({ success: false, error: 'Valid email is required.' });
  if (!Array.isArray(faceDescriptor) || faceDescriptor.length < 128)
    return res.status(400).json({ success: false, error: 'Invalid face descriptor. Complete face scan first.' });

  req.body.address = address.toLowerCase().trim();
  req.body.email   = email.toLowerCase().trim();
  req.body.name    = name.trim();
  next();
};

const validateLogin = (req, res, next) => {
  const { address } = req.body;
  if (!address)                     return res.status(400).json({ success: false, error: 'Wallet address is required.' });
  if (!validateEthAddress(address)) return res.status(400).json({ success: false, error: 'Invalid wallet address format.' });
  req.body.address = address.toLowerCase().trim();
  next();
};

const validateAddCandidate = (req, res, next) => {
  const { name, party } = req.body;
  if (!name || name.trim().length < 2)
    return res.status(400).json({ success: false, error: 'Candidate name must be at least 2 characters.' });
  req.body.name  = name.trim();
  req.body.party = (party || 'Independent').trim();
  next();
};

const validateSetElectionTimes = (req, res, next) => {
  const { startTime, endTime } = req.body;
  if (!startTime || !endTime) return res.status(400).json({ success: false, error: 'startTime and endTime are required.' });
  const start = new Date(startTime);
  const end   = new Date(endTime);
  if (isNaN(start) || isNaN(end)) return res.status(400).json({ success: false, error: 'Invalid date format.' });
  if (start >= end)               return res.status(400).json({ success: false, error: 'startTime must be before endTime.' });
  if (end <= new Date())          return res.status(400).json({ success: false, error: 'endTime must be in the future.' });
  next();
};

const validateCastVote = (req, res, next) => {
  const { candidateId, faceToken } = req.body;
  if (!candidateId || isNaN(Number(candidateId)))
    return res.status(400).json({ success: false, error: 'Valid candidateId is required.' });
  if (!faceToken)
    return res.status(400).json({ success: false, error: 'Face verification token required. Please re-verify your face.' });
  req.body.candidateId = Number(candidateId);
  next();
};

module.exports = {
  validateSendOTP,
  validateVerifyOTP,
  validateRegister,
  validateLogin,
  validateAddCandidate,
  validateSetElectionTimes,
  validateCastVote,
};
