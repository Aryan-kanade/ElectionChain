/**
 * controllers/vote.controller.js  (updated)
 * Adds AI fraud detection via Python Flask microservice.
 * Drop-in replacement for your existing vote.controller.js
 */

const { User, Candidate, AuditLog, FlaggedVote } = require('../models');
const { state, sendTx }              = require('../config/blockchain');
const { verifyFaceToken }            = require('../middleware/auth.middleware');
const { logAudit }                   = require('../services/audit.service');
const { assessVote }                 = require('../services/fraud.service');
const { sha256, genRefNo }           = require('../crypto');

// ── Helper: build fraud input features ───────────────────────────────────────
async function buildFraudFeatures(address) {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  // timeDiff: seconds since voter's last audit log entry
  const lastEntry = await AuditLog
    .findOne({ address, action: { $in: ['VOTE_CAST', 'FACE_VERIFY_PASS', 'FACE_VERIFY_FAIL'] } })
    .sort({ timestamp: -1 })
    .lean();

  const timeDiff = lastEntry
    ? Math.round((Date.now() - new Date(lastEntry.timestamp).getTime()) / 1000)
    : 99999;  // first action ever = very large gap = normal

  // attempts: total vote-related actions in last hour
  const attempts = await AuditLog.countDocuments({
    address,
    action:    { $in: ['VOTE_CAST', 'FACE_VERIFY_PASS', 'FACE_VERIFY_FAIL'] },
    timestamp: { $gte: oneHourAgo },
  });

  // activityCount: any action in last hour
  const activityCount = await AuditLog.countDocuments({
    address,
    timestamp: { $gte: oneHourAgo },
  });

  return { timeDiff, attempts: attempts + 1, activityCount: activityCount + 1 };
}

// ── Main handler ──────────────────────────────────────────────────────────────
exports.castVote = async (req, res, next) => {
  try {
    const { candidateId, faceToken } = req.body;

    // 1. Face token check
    try { verifyFaceToken(faceToken, req.user.address); }
    catch {
      return res.status(401).json({
        success: false,
        error: 'Face verification token invalid or expired. Please re-verify your face.',
      });
    }

    // 2. Role check
    if (req.user.role !== 'voter')
      return res.status(403).json({ success: false, error: 'Only registered voters can cast votes.' });

    // 3. Candidate exists
    const candidate = await Candidate.findOne({ candidateId: Number(candidateId) });
    if (!candidate)
      return res.status(400).json({ success: false, error: 'Candidate not found.' });

    // ── 4. AI Fraud Assessment ─────────────────────────────────────────────
    const features    = await buildFraudFeatures(req.user.address);
    const fraudResult = await assessVote(features);
    const isSuspicious = fraudResult.prediction === 'SUSPICIOUS';

    if (isSuspicious) {
      console.warn(
        `[FraudDetection] SUSPICIOUS vote attempt | voter=${req.user.address} | score=${fraudResult.score} | features=${JSON.stringify(features)}`
      );

      // Store flagged vote record
      await FlaggedVote.create({
        voterHash:   sha256(req.user.address),
        address:     req.user.address,
        candidateId: Number(candidateId),
        fraudScore:  fraudResult.score,
        features:    fraudResult.features,
        status:      'PENDING',
        voteBlocked: false,   // Policy: flag but allow — change to true to block
      });

      // Audit log with fraud flag
      await logAudit({
        action:     'VOTE_FRAUD_FLAG',
        address:    req.user.address,
        voterHash:  sha256(req.user.address),
        data: {
          fraudScore:  fraudResult.score,
          features,
          candidateId: Number(candidateId),
        },
      });

      // ── Policy: BLOCK suspicious votes ──────────────────────────────────
      // Uncomment to hard-block instead of flag-and-allow:
      //
      // return res.status(403).json({
      //   success: false,
      //   error:   'Vote flagged as suspicious. Please contact election administrators.',
      //   refNo:   null,
      // });
    }

    // 5. Atomic double-vote prevention
    const user = await User.findOneAndUpdate(
      { address: req.user.address, hasVoted: false },
      { $set: { hasVoted: true, votedCandidateId: Number(candidateId) } },
      { new: true }
    );

    if (!user) {
      const check = await User.findOne({ address: req.user.address });
      if (!check)         return res.status(404).json({ success: false, error: 'Voter record not found.' });
      if (check.hasVoted) return res.status(400).json({ success: false, error: 'You have already voted.' });
      return res.status(500).json({ success: false, error: 'Vote failed. Please try again.' });
    }

    // 6. Increment candidate tally
    await Candidate.findOneAndUpdate(
      { candidateId: Number(candidateId) },
      { $inc: { voteCount: 1 } }
    );

    // 7. Generate receipt
    const refNo    = genRefNo();
    const voteHash = sha256(`${req.user.address}|${candidateId}|${Date.now()}`);

    // 8. Blockchain (optional)
    if (state.blockchainConnected && state.contract) {
      try { await sendTx(state.contract.methods.castVote(Number(candidateId)), { gas: 200000 }); }
      catch (e) { console.warn('BC castVote failed (DB vote committed):', e.message); }
    }

    // 9. Audit log — include fraud metadata
    await logAudit({
      action:     'VOTE_CAST',
      voterHash:  sha256(req.user.address),
      candidateId: Number(candidateId),
      voteHash,
      refNo,
      blockchain: state.blockchainConnected,
      data: {
        fraudPrediction: fraudResult.prediction,
        fraudScore:      fraudResult.score,
        fraudError:      fraudResult.error,   // true if AI service was down
      },
    });

    res.json({
      success:   true,
      refNo,
      voteHash:  voteHash.slice(0, 32) + '…',
      ...(isSuspicious && { warning: 'Vote recorded but flagged for review.' }),
    });
  } catch (e) { next(e); }
};
