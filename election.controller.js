/**
 * controllers/election.controller.js
 */

const { AuditLog, ElectionConfig } = require('../models');
const { state, sendTx }            = require('../config/blockchain');
const { logAdmin }                 = require('../services/audit.service');

exports.getElectionStatus = async (req, res, next) => {
  try {
    if (state.blockchainConnected && state.contract) {
      try {
        const s = await state.contract.methods.getElectionStatus().call();
        return res.json({ success: true, source: 'blockchain', active: s.active, ended: s.ended,
          declared: s.declared, start: Number(s.start) * 1000, end: Number(s.end) * 1000, totalVotes: Number(s.totalVotes) });
      } catch (e) { console.warn('BC getElectionStatus failed, using DB:', e.message); }
    }
    const cfg        = await ElectionConfig.findOne({ key: 'main' });
    const totalVotes = await AuditLog.countDocuments({ action: 'VOTE_CAST' });
    const now        = new Date();
    res.json({ success: true, source: 'database',
      start:  cfg?.startTime?.getTime() ?? null,
      end:    cfg?.endTime?.getTime()   ?? null,
      active: cfg ? (now >= cfg.startTime && now <= cfg.endTime) : false,
      ended:  cfg ? now > cfg.endTime : false,
      totalVotes,
    });
  } catch (e) { next(e); }
};

exports.setElectionTimes = async (req, res, next) => {
  try {
    const { startTime, endTime } = req.body;
    await ElectionConfig.findOneAndUpdate({ key: 'main' },
      { startTime: new Date(startTime), endTime: new Date(endTime), updatedBy: req.user.address, updatedAt: new Date() },
      { upsert: true }
    );
    await logAdmin(req.user.address, `Election times: ${new Date(startTime).toLocaleString()} → ${new Date(endTime).toLocaleString()}`);
    if (state.blockchainConnected && state.contract) {
      try { await sendTx(state.contract.methods.setElectionTimes(Math.floor(startTime / 1000), Math.floor(endTime / 1000)), { gas: 200000 }); }
      catch (e) { console.warn('BC setElectionTimes failed (DB saved):', e.message); }
    }
    res.json({ success: true, message: 'Election times updated.' });
  } catch (e) { next(e); }
};
