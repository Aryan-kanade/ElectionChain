/**
 * middleware/auth.middleware.js
 * JWT verification + role-based access control.
 *
 * Usage:
 *   router.post('/vote', verifyToken, requireRole('voter'), handler);
 *   router.post('/admin/...', verifyToken, requireRole('admin'), handler);
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = () => {
  const s = process.env.JWT_SECRET;
  if (!s || s === 'dev_secret') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET must be set in production!');
    }
    return 'dev_secret_change_in_production';
  }
  return s;
};

/**
 * Attach req.user = { address, role } from Bearer token.
 * Rejects expired, malformed, or missing tokens with 401.
 */
function verifyToken(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized — no token provided' });
  }
  try {
    req.user = jwt.verify(auth.slice(7), JWT_SECRET());
    next();
  } catch (err) {
    const msg = err.name === 'TokenExpiredError'
      ? 'Session expired. Please log in again.'
      : 'Invalid token.';
    return res.status(401).json({ success: false, error: msg });
  }
}

/**
 * Require a specific role (or array of roles) after verifyToken.
 * requireRole('admin')  — only admins
 * requireRole('voter')  — only voters
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, error: 'Not authenticated' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: `Access denied — requires role: ${roles.join(' or ')}` });
    }
    next();
  };
}

// Convenience aliases
const requireAdmin = requireRole('admin');
const requireVoter = requireRole('voter');

/**
 * Generate standard auth tokens.
 */
function signToken(address, role, expiresIn = '2h') {
  return jwt.sign({ address, role }, JWT_SECRET(), { expiresIn });
}

function signFaceToken(address, expiresIn = '5m') {
  return jwt.sign({ address, faceVerified: true }, JWT_SECRET(), { expiresIn });
}

function verifyFaceToken(token, expectedAddress) {
  const decoded = jwt.verify(token, JWT_SECRET());
  if (!decoded.faceVerified || decoded.address !== expectedAddress) {
    throw new Error('Face token address mismatch');
  }
  return decoded;
}

module.exports = { verifyToken, requireRole, requireAdmin, requireVoter, signToken, signFaceToken, verifyFaceToken };
