/**
 * controllers/audit.controller.js
 * Audit log retrieval + voter profile.
 */

const { AuditLog, User } = require('../models');
const { sha256 }         = require('../crypto');

exports.getAuditLog = async (req, res, next) => {
  try {
    // Admins see everything; voters only see their own entries
    const filter = req.user.role === 'admin'
      ? {}
      : { voterHash: sha256(req.user.address) };

    const log = await AuditLog.find(filter).sort({ timestamp: -1 }).limit(200);
    res.json({ success: true, log });
  } catch (e) {
    next(e);
  }
};

exports.getMyProfile = async (req, res, next) => {
  try {
    const user = await User.findOne({ address: req.user.address }).select('-faceDescriptor -faceHash -emailHash');
    if (!user) return res.status(404).json({ success: false, error: 'Voter not found.' });
    res.json({ success: true, user });
  } catch (e) {
    next(e);
  }
};
