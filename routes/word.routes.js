const express = require('express');
const router = express.Router();
const wordController = require('../controllers/word.controller');

router.post('/', wordController.createWord);
router.get('/', wordController.getWords);
router.put('/:id', wordController.updateWord);
router.delete('/:id', wordController.deleteWord);

module.exports = router; 