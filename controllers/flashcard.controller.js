const mongoose = require('mongoose');
const Flashcard = require('../models/flashcard.model');
const Word = require('../models/word.model');

exports.createFlashcard = async (req, res) => {
    try {
        const { wordId } = req.body;
        const word = await Word.findOne({ _id: wordId, userId: req.user.userId });
        if (!word) {
            return res.status(404).json({ error: 'Word not found' });
        }
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

exports.createFlashcardsFromWords = async (req, res) => {
    try {
        const words = await Word.find({ userId: req.user.userId });
        const flashcardsToCreate = [];
        for (const word of words) {
            const existingFlashcard = await Flashcard.findOne({
                userId: req.user.userId,
                wordId: word._id
            });

            if (!existingFlashcard) {
                flashcardsToCreate.push({
                    userId: req.user.userId,
                    wordId: word._id,
                    chinese: word.chinese,
                    hanViet: word.hanViet,
                    pinyin: word.pinyin,
                    vietnamese: word.vietnamese
                });
            }
        }

        if (flashcardsToCreate.length > 0) {
            await Flashcard.insertMany(flashcardsToCreate);
        }

        res.json({
            message: `Created ${flashcardsToCreate.length} new flashcards`,
            created: flashcardsToCreate.length
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};


// Sửa lại hàm getFlashcardsForReview để đơn giản hơn
exports.getFlashcardsForReview = async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const userId = req.user.userId;

        const flashcards = await Flashcard.find({
            userId: userId,
            dueDate: { $lte: new Date() } // Chỉ lấy thẻ đã đến hạn hoặc quá hạn
        })
        .sort({ dueDate: 1 }) // Ưu tiên thẻ quá hạn lâu nhất
        .limit(parseInt(limit, 10));

        res.json({ flashcards });
    } catch (err) {
        console.error("Lỗi khi lấy flashcards để review:", err);
        res.status(500).json({ error: 'Đã xảy ra lỗi ở server.' });
    }
};


// --- HÀM MỚI: XỬ LÝ REVIEW VỚI THUẬT TOÁN SM-2 ---
exports.reviewFlashcardWithSM2 = async (req, res) => {
    try {
        const { id } = req.params;
        const { quality } = req.body; 

        if (quality === undefined || quality < 0 || quality > 5) {
            return res.status(400).json({ error: 'Quality score must be between 0 and 5.' });
        }

        const flashcard = await Flashcard.findOne({
            _id: id,
            userId: req.user.userId
        });

        if (!flashcard) {
            return res.status(404).json({ error: 'Flashcard not found' });
        }

        // --- Logic thuật toán SM-2 (giữ nguyên) ---
        if (quality < 3) {
            flashcard.repetition = 0;
            flashcard.interval = 1;
        } else {
            let newEasinessFactor = flashcard.easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
            if (newEasinessFactor < 1.3) {
                newEasinessFactor = 1.3;
            }
            flashcard.easinessFactor = newEasinessFactor;
            flashcard.repetition += 1;
            if (flashcard.repetition === 1) {
                flashcard.interval = 1;
            } else if (flashcard.repetition === 2) {
                flashcard.interval = 6;
            } else {
                flashcard.interval = Math.round(flashcard.interval * flashcard.easinessFactor);
            }
        }
        const now = new Date();
        const oneDayInMilliseconds = 24 * 60 * 60 * 1000;
        flashcard.dueDate = new Date(now.getTime() + flashcard.interval * oneDayInMilliseconds);
        
        await flashcard.save();

        // --- LOGIC CẬP NHẬT STREAK ---
        const user = await User.findById(req.user.userId);
        if (user) {
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Chuẩn hóa về đầu ngày

            const lastReviewed = user.streak.lastReviewedDate;
            if (lastReviewed) {
                lastReviewed.setHours(0, 0, 0, 0);
                const diffTime = today - lastReviewed;
                const diffDays = Math.round(diffTime / oneDayInMilliseconds);

                if (diffDays === 1) {
                    // Tiếp tục chuỗi
                    user.streak.current += 1;
                } else if (diffDays > 1) {
                    // Reset chuỗi
                    user.streak.current = 1;
                }
                // Nếu diffDays là 0, không làm gì cả (đã ôn trong hôm nay)
            } else {
                // Lần đầu tiên ôn tập
                user.streak.current = 1;
            }
            
            // Cập nhật chuỗi dài nhất
            if (user.streak.current > user.streak.longest) {
                user.streak.longest = user.streak.current;
            }
            
            user.streak.lastReviewedDate = new Date();
            await user.save();
        }
        // --- KẾT THÚC LOGIC STREAK ---

        res.json(flashcard);

    } catch (err) {
        console.error("Lỗi khi review flashcard:", err);
        res.status(500).json({ error: 'Đã xảy ra lỗi ở server.' });
    }
};


// Sửa lại hàm getFlashcardStats để phù hợp với model mới
exports.getFlashcardStats = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.userId);

        const total = await Flashcard.countDocuments({ userId });
        
        const dueForReview = await Flashcard.countDocuments({
            userId: userId,
            dueDate: { $lte: new Date() }
        });

        // Thống kê các thẻ đang học (chưa ôn lần nào hoặc interval < 21 ngày)
        const learning = await Flashcard.countDocuments({
            userId: userId,
            interval: { $lt: 21 }
        });

        // Thống kê các thẻ đã trưởng thành (interval >= 21 ngày)
        const mature = await Flashcard.countDocuments({
            userId: userId,
            interval: { $gte: 21 }
        });

        res.json({
            total,
            dueForReview,
            learning,
            mature
        });
    } catch (err) {
        console.error("Lỗi khi lấy thống kê flashcard:", err);
        res.status(500).json({ error: "Đã xảy ra lỗi ở server." });
    }
};
