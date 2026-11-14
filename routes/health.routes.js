// routes/health.routes.js
const router = require('express').Router();
const ctrl   = require('../controllers/health.controller');

router.get('/', ctrl.healthCheck);

module.exports = router;
