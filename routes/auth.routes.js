const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Đăng ký
router.post('/register', authController.register);

// Đăng nhập
router.post('/login', authController.login);

// Lấy thông tin user hiện tại (cần xác thực)
router.get('/me', authController.authenticateToken, authController.getCurrentUser);

module.exports = router; 