/**
 * controllers/vote.controller.js
 */

const { User, Candidate }  = require('../models');
const { state, sendTx }    = require('../config/blockchain');
const { verifyFaceToken }  = require('../middleware/auth.middleware');
const { logAudit }         = require('../services/audit.service');
const { sha256, genRefNo } = require('../utils/crypto');

exports.castVote = async (req, res, next) => {
  try {
    const { candidateId, faceToken } = req.body;

    try { verifyFaceToken(faceToken, req.user.address); }
    catch { return res.status(401).json({ success: false, error: 'Face verification token invalid or expired. Please re-verify your face.' }); }

    if (req.user.role !== 'voter')
      return res.status(403).json({ success: false, error: 'Only registered voters can cast votes.' });

    // Check candidate exists first
    const candidate = await Candidate.findOne({ candidateId: Number(candidateId) });
    if (!candidate) return res.status(400).json({ success: false, error: 'Candidate not found.' });

    // Atomic update — only succeeds if hasVoted === false (prevents race condition double-vote)
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

    await Candidate.findOneAndUpdate({ candidateId: Number(candidateId) }, { $inc: { voteCount: 1 } });

    const refNo    = genRefNo();
    const voteHash = sha256(`${req.user.address}|${candidateId}|${Date.now()}`);

    if (state.blockchainConnected && state.contract) {
      try { await sendTx(state.contract.methods.castVote(Number(candidateId)), { gas: 200000 }); }
      catch (e) { console.warn('BC castVote failed (DB vote committed):', e.message); }
    }

    await logAudit({ action: 'VOTE_CAST', voterHash: sha256(req.user.address), candidateId: Number(candidateId), voteHash, refNo, blockchain: state.blockchainConnected });

    res.json({ success: true, refNo, voteHash: voteHash.slice(0, 32) + '…' });
  } catch (e) { next(e); }
};
