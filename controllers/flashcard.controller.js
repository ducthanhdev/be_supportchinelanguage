const Flashcard = require('../models/flashcard.model');
const Word = require('../models/word.model');

// Tạo flashcard từ word
exports.createFlashcard = async (req, res) => {
    try {
        const { wordId } = req.body;

        // Kiểm tra word có tồn tại và thuộc về user không
        const word = await Word.findOne({ _id: wordId, userId: req.user.userId });
        if (!word) {
            return res.status(404).json({ error: 'Word not found' });
        }

        // Kiểm tra flashcard đã tồn tại chưa
        const existingFlashcard = await Flashcard.findOne({
            userId: req.user.userId,
            wordId: wordId
        });

        if (existingFlashcard) {
            return res.status(400).json({ error: 'Flashcard already exists' });
        }

        const flashcard = new Flashcard({
            userId: req.user.userId,
            wordId: wordId,
            chinese: word.chinese,
            hanViet: word.hanViet,
            pinyin: word.pinyin,
            vietnamese: word.vietnamese
        });

        await flashcard.save();
        res.status(201).json(flashcard);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Lấy danh sách flashcards cần review
exports.getFlashcardsForReview = async (req, res) => {
    try {
        const { limit = 10, difficulty } = req.query;

        let query = {
            userId: req.user.userId,
            nextReview: { $lte: new Date() }
        };

        if (difficulty) {
            query.difficulty = difficulty;
        }

        const flashcards = await Flashcard.find(query)
            .sort({ nextReview: 1 })
            .limit(parseInt(limit));

        res.json({ flashcards });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Cập nhật kết quả review
exports.updateReviewResult = async (req, res) => {
    try {
        const { flashcardId, isCorrect } = req.body;

        const flashcard = await Flashcard.findOne({
            _id: flashcardId,
            userId: req.user.userId
        });

        if (!flashcard) {
            return res.status(404).json({ error: 'Flashcard not found' });
        }

        // Cập nhật thống kê
        flashcard.reviewCount += 1;
        if (isCorrect) {
            flashcard.correctCount += 1;
        }

        // Tính toán độ khó dựa trên tỷ lệ đúng
        const accuracy = flashcard.correctCount / flashcard.reviewCount;
        if (accuracy >= 0.8) {
            flashcard.difficulty = 'easy';
        } else if (accuracy <= 0.4) {
            flashcard.difficulty = 'hard';
        } else {
            flashcard.difficulty = 'medium';
        }

        // Tính thời gian review tiếp theo (Spaced Repetition)
        const daysUntilNextReview = calculateNextReviewInterval(flashcard.difficulty, flashcard.reviewCount, isCorrect);
        flashcard.nextReview = new Date(Date.now() + daysUntilNextReview * 24 * 60 * 60 * 1000);
        flashcard.lastReviewed = new Date();

        // Kiểm tra nếu đã mastered
        if (flashcard.reviewCount >= 5 && accuracy >= 0.8) {
            flashcard.isMastered = true;
        }

        await flashcard.save();
        res.json(flashcard);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Lấy thống kê flashcards
exports.getFlashcardStats = async (req, res) => {
    try {
        const userId = req.user.userId;

        const stats = await Flashcard.aggregate([
            { $match: { userId: mongoose.Types.ObjectId(userId) } },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    mastered: { $sum: { $cond: ['$isMastered', 1, 0] } },
                    easy: { $sum: { $cond: [{ $eq: ['$difficulty', 'easy'] }, 1, 0] } },
                    medium: { $sum: { $cond: [{ $eq: ['$difficulty', 'medium'] }, 1, 0] } },
                    hard: { $sum: { $cond: [{ $eq: ['$difficulty', 'hard'] }, 1, 0] } },
                    totalReviews: { $sum: '$reviewCount' },
                    totalCorrect: { $sum: '$correctCount' }
                }
            }
        ]);

        const dueForReview = await Flashcard.countDocuments({
            userId: req.user.userId,
            nextReview: { $lte: new Date() }
        });

        const result = stats[0] || {
            total: 0,
            mastered: 0,
            easy: 0,
            medium: 0,
            hard: 0,
            totalReviews: 0,
            totalCorrect: 0
        };

        result.dueForReview = dueForReview;
        result.accuracy = result.totalReviews > 0 ? (result.totalCorrect / result.totalReviews * 100).toFixed(1) : 0;

        res.json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Tạo flashcards từ tất cả words của user
exports.createFlashcardsFromWords = async (req, res) => {
    try {
        const words = await Word.find({ userId: req.user.userId });

        const flashcards = [];
        for (const word of words) {
            const existingFlashcard = await Flashcard.findOne({
                userId: req.user.userId,
                wordId: word._id
            });

            if (!existingFlashcard) {
                const flashcard = new Flashcard({
                    userId: req.user.userId,
                    wordId: word._id,
                    chinese: word.chinese,
                    hanViet: word.hanViet,
                    pinyin: word.pinyin,
                    vietnamese: word.vietnamese
                });
                flashcards.push(flashcard);
            }
        }

        if (flashcards.length > 0) {
            await Flashcard.insertMany(flashcards);
        }

        res.json({
            message: `Created ${flashcards.length} flashcards`,
            created: flashcards.length
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Hàm tính toán thời gian review tiếp theo
function calculateNextReviewInterval(difficulty, reviewCount, isCorrect) {
    if (!isCorrect) {
        return 1; // Review lại ngay hôm sau nếu sai
    }

    const baseIntervals = {
        easy: [1, 3, 7, 14, 30],
        medium: [1, 2, 4, 7, 14],
        hard: [1, 1, 2, 3, 7]
    };

    const intervals = baseIntervals[difficulty] || baseIntervals.medium;
    const index = Math.min(reviewCount - 1, intervals.length - 1);

    return intervals[index];
}

const mongoose = require('mongoose'); 