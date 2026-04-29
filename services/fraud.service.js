/**
 * services/fraud.service.js
 * Calls the Python Flask AI microservice to detect vote fraud.
 * Fire-and-forget safe — never throws, always returns a result object.
 */

const axios = require('axios');

const FRAUD_API_URL  = process.env.FRAUD_API_URL || 'http://localhost:5001';
const FRAUD_TIMEOUT  = parseInt(process.env.FRAUD_TIMEOUT_MS || '3000', 10);

/**
 * @typedef {Object} FraudInput
 * @property {number} timeDiff      - Seconds since voter's last attempt
 * @property {number} attempts      - Total vote attempts for this voter
 * @property {number} [ipFrequency] - How many votes from this IP in last hour
 * @property {number} [activityCount] - Total actions by this voter in session
 *
 * @typedef {Object} FraudResult
 * @property {'NORMAL'|'SUSPICIOUS'|'UNKNOWN'} prediction
 * @property {number}  score      - Isolation Forest anomaly score
 * @property {boolean} error      - true if service was unreachable
 * @property {object}  features   - Echo of input features used
 */

/**
 * Assess a vote event for fraud.
 * @param {FraudInput} input
 * @returns {Promise<FraudResult>}
 */
async function assessVote(input) {
  try {
    const { data } = await axios.post(
      `${FRAUD_API_URL}/predict`,
      {
        timeDiff:      input.timeDiff,
        attempts:      input.attempts,
        ipFrequency:   input.ipFrequency   ?? 1,
        activityCount: input.activityCount ?? 1,
      },
      { timeout: FRAUD_TIMEOUT }
    );

    return {
      prediction: data.prediction,   // 'NORMAL' | 'SUSPICIOUS'
      score:      data.score,
      features:   data.features,
      error:      false,
    };
  } catch (err) {
    // Fraud service down — fail open (don't block legitimate votes)
    console.warn('[FraudService] Unreachable or error:', err.message);
    return { prediction: 'UNKNOWN', score: null, features: input, error: true };
  }
}

module.exports = { assessVote };
