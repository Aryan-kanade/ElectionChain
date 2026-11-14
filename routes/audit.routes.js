// routes/audit.routes.js
const router    = require('express').Router();
const ctrl      = require('../controllers/audit.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.get('/',   verifyToken, ctrl.getAuditLog);
router.get('/me', verifyToken, ctrl.getMyProfile);

module.exports = router;
