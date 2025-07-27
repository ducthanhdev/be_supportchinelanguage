const express = require('express');
const router = express.Router();
const wordController = require('../controllers/word.controller');
const { authenticateToken } = require('../controllers/auth.controller');

// Tất cả routes đều cần xác thực
router.use(authenticateToken);

router.post('/', wordController.createWord);
router.get('/', wordController.getWords);
router.put('/:id', wordController.updateWord);
router.delete('/:id', wordController.deleteWord);

module.exports = router; 