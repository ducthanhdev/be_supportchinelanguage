const express = require('express');
const router = express.Router();
const translateController = require('../controllers/translate.controller');

// Dịch một từ
router.post('/single', translateController.translateToVietnamese);

// Dịch nhiều từ
router.post('/batch', translateController.translateBatch);

module.exports = router; 