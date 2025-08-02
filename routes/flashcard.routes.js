const express = require('express');
const router = express.Router();
const flashcardController = require('../controllers/flashcard.controller');
const { authenticateToken } = require('../controllers/auth.controller');

// Tất cả routes đều cần authentication
router.use(authenticateToken);

// Tạo flashcard từ word
router.post('/create', flashcardController.createFlashcard);

// Lấy flashcards cần review
router.get('/review', flashcardController.getFlashcardsForReview);

// Lấy thống kê flashcards
router.get('/stats', flashcardController.getFlashcardStats);

// Tạo flashcards từ tất cả words của user
router.post('/create-from-words', flashcardController.createFlashcardsFromWords);

// --- ROUTE MỚI ĐỂ XỬ LÝ REVIEW THEO THUẬT TOÁN SM-2 ---
// Thay thế cho route updateReviewResult cũ
// :id là ID của flashcard
router.post('/:id/review', flashcardController.reviewFlashcardWithSM2);


module.exports = router;
