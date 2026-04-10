// routes/election.routes.js
const router    = require('express').Router();
const ctrl      = require('../controllers/election.controller');
const { verifyToken, requireAdmin }  = require('../middleware/auth.middleware');
const { validateSetElectionTimes }   = require('../middleware/validate.middleware');

router.get('/status',    ctrl.getElectionStatus);
router.post('/set-times', verifyToken, requireAdmin, validateSetElectionTimes, ctrl.setElectionTimes);

module.exports = router;
