/**
 * controllers/candidate.controller.js
 */

const { Candidate }       = require('../models');
const { state, sendTx }   = require('../config/blockchain');
const { logAudit, logAdmin } = require('../services/audit.service');

exports.getCandidates = async (req, res, next) => {
  try {
    if (state.blockchainConnected && state.contract) {
      try {
        const result = await state.contract.methods.getAllCandidates().call();
        return res.json({ success: true, source: 'blockchain', candidates: result.ids.map((id, i) => ({
          id: Number(id), name: result.names[i], party: result.parties[i],
          approved: result.approved[i], voteCount: Number(result.voteCounts[i]),
        }))});
      } catch (e) { console.warn('BC getCandidates failed, using DB:', e.message); }
    }
    const list = await Candidate.find({}).sort({ candidateId: 1 });
    res.json({ success: true, source: 'database', candidates: list.map(c => ({
      id: c.candidateId, name: c.name, party: c.party, approved: c.approved, voteCount: c.voteCount,
    }))});
  } catch (e) { next(e); }
};

exports.addCandidate = async (req, res, next) => {
  try {
    const { name, party } = req.body;
    const count       = await Candidate.countDocuments();
    const candidateId = count + 1;
    const cand = await Candidate.create({ candidateId, name, party, approved: true, addedBy: req.user.address });

    await logAdmin(req.user.address, `Added candidate: ${name} (${party})`);
    await logAudit({ action: 'CANDIDATE_ADDED', address: req.user.address, data: { name, party } });

    if (state.blockchainConnected && state.contract) {
      try { await sendTx(state.contract.methods.addCandidate(name, party), { gas: 300000 }); }
      catch (e) { console.warn('BC addCandidate failed (DB saved):', e.message); }
    }

    res.status(201).json({ success: true, candidate: { id: cand.candidateId, name: cand.name, party: cand.party, approved: cand.approved, voteCount: 0 } });
  } catch (e) { next(e); }
};
