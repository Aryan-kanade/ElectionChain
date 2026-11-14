// routes/admin.routes.js
const router    = require('express').Router();
const ctrl      = require('../controllers/admin.controller');
const { verifyToken, requireAdmin } = require('../middleware/auth.middleware');

router.post('/propose-results',        verifyToken, requireAdmin, ctrl.proposeResults);
router.get('/result-proposal-status',  verifyToken, requireAdmin, ctrl.getResultProposalStatus);
router.get('/logs',                    verifyToken, requireAdmin, ctrl.getAdminLogs);

module.exports = router;
