/**
 * controllers/health.controller.js
 */

const mongoose            = require('mongoose');
const { User, Candidate } = require('../models');
const { state }           = require('../config/blockchain');

exports.healthCheck = async (req, res, next) => {
  try {
    const dbState = mongoose.connection.readyState;
    res.json({
      status: 'ok', version: '4.0.0',
      database:    ['disconnected','connected','connecting','disconnecting'][dbState],
      dbConnected: dbState === 1,
      blockchain:  state.blockchainConnected,
      network:     state.networkName,
      users:       await User.countDocuments().catch(() => 0),
      candidates:  await Candidate.countDocuments().catch(() => 0),
      uptime:      Math.floor(process.uptime()),
    });
  } catch (e) { next(e); }
};
