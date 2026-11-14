/**
 * services/audit.service.js
 * Centralised audit + admin logging.
 * Fire-and-forget — never throws, never blocks a request.
 */

const { AuditLog, AdminLog } = require('../models');

async function logAudit(data) {
  try { await AuditLog.create(data); } catch (e) {
    console.error('[AuditLog] Failed to write:', e.message);
  }
}

async function logAdmin(address, action) {
  try { await AdminLog.create({ address, action }); } catch (e) {
    console.error('[AdminLog] Failed to write:', e.message);
  }
}

module.exports = { logAudit, logAdmin };
