const express = require('express');
const router = express.Router();
const hanvietController = require('../controllers/hanviet.controller');

router.put('/', hanvietController.updateHanViet);

module.exports = router; 