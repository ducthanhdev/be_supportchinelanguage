const express = require('express');
const router = express.Router();
const exampleController = require('../controllers/example.controller');

router.get('/', exampleController.getExample);
router.post('/', exampleController.getExamplesBatch);

module.exports = router; 