// ── routes/vote.routes.js ─────────────────────────────────────────
const voteRouter = require('express').Router();
const voteCtrl   = require('../controllers/vote.controller');
const { verifyToken, requireVoter } = require('../middleware/auth.middleware');
const { validateCastVote }          = require('../middleware/validate.middleware');

voteRouter.post('/', verifyToken, requireVoter, validateCastVote, voteCtrl.castVote);
module.exports = voteRouter;
