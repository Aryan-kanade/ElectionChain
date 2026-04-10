/**
 * utils/crypto.js
 * Pure utility functions — no side effects, no DB access.
 */

const crypto = require('crypto');

const sha256 = s => crypto.createHash('sha256').update(String(s)).digest('hex');

const genOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

/**
 * Generate a unique vote reference number.
 * Format: EC-<base36 timestamp>-<random suffix>
 */
const genRefNo = () =>
  'EC-' + Date.now().toString(36).toUpperCase() + '-' +
  Math.random().toString(36).slice(2, 6).toUpperCase();

/**
 * Euclidean distance between two face descriptor arrays.
 * Returns { distance, matchScore (0-100), passed }
 */
function compareFaceDescriptors(stored, current, threshold = 0.52) {
  if (!Array.isArray(stored) || !Array.isArray(current) || stored.length !== current.length) {
    throw new Error('Descriptor length mismatch or invalid input');
  }
  let sum = 0;
  for (let i = 0; i < stored.length; i++) sum += (stored[i] - current[i]) ** 2;
  const distance   = Math.sqrt(sum);
  const matchScore = Math.max(0, Math.round((1 - distance) * 100));
  const passed     = distance <= threshold;
  return { distance, matchScore, passed };
}

module.exports = { sha256, genOTP, genRefNo, compareFaceDescriptors };
