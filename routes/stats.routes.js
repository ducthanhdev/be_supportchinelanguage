const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../controllers/auth.controller');
const statsController = require('../controllers/stats.controller');

router.use(authenticateToken);

router.get('/dashboard', statsController.getDashboardStats);

module.exports = router;