// routes/candidate.routes.js
const router    = require('express').Router();
const ctrl      = require('../controllers/candidate.controller');
const { verifyToken, requireAdmin } = require('../middleware/auth.middleware');
const { validateAddCandidate }      = require('../middleware/validate.middleware');

router.get('/',  ctrl.getCandidates);
router.post('/', verifyToken, requireAdmin, validateAddCandidate, ctrl.addCandidate);

module.exports = router;
