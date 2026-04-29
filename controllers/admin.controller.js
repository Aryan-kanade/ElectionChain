/**
 * controllers/admin.controller.js
 * Multi-admin result proposals + admin log retrieval.
 */

const { ResultProposal, AdminLog } = require('../models');
const { logAdmin }                 = require('../services/audit.service');

exports.proposeResults = async (req, res, next) => {
  try {
    const REQUIRED = parseInt(process.env.REQUIRED_APPROVALS || '1', 10);

    let proposal = await ResultProposal.findOne({ executed: false });
    if (!proposal) proposal = await ResultProposal.create({ approvedBy: [] });

    if (proposal.approvedBy.includes(req.user.address)) {
      return res.json({
        success:   true,
        approvals: proposal.approvedBy.length,
        required:  REQUIRED,
        executed:  proposal.executed,
        message:   `You already approved. ${proposal.approvedBy.length}/${REQUIRED} admins approved.`,
      });
    }

    proposal.approvedBy.push(req.user.address);
    if (proposal.approvedBy.length >= REQUIRED) {
      proposal.executed  = true;
      proposal.executedAt = new Date();
    }
    await proposal.save();
    await logAdmin(req.user.address, `Proposed results (${proposal.approvedBy.length}/${REQUIRED})`);

    res.json({
      success:   true,
      approvals: proposal.approvedBy.length,
      required:  REQUIRED,
      executed:  proposal.executed,
      message:   `${proposal.approvedBy.length}/${REQUIRED} admins approved.`,
    });
  } catch (e) {
    next(e);
  }
};

exports.getResultProposalStatus = async (req, res, next) => {
  try {
    const REQUIRED  = parseInt(process.env.REQUIRED_APPROVALS || '1', 10);
    const proposal  = await ResultProposal.findOne({ executed: false });
    res.json({
      success:   true,
      approvals: proposal?.approvedBy.length ?? 0,
      required:  REQUIRED,
      executed:  proposal?.executed ?? false,
      approved:  proposal?.approvedBy.includes(req.user.address) ?? false,
    });
  } catch (e) {
    next(e);
  }
};

exports.getAdminLogs = async (req, res, next) => {
  try {
    const logs = await AdminLog.find({}).sort({ timestamp: -1 }).limit(200);
    res.json({ success: true, logs });
  } catch (e) {
    next(e);
  }
};
