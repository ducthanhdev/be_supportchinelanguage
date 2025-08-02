const mongoose = require('mongoose');

const FlashcardSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    wordId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Word',
        required: true
    },
    // Dữ liệu từ word để truy cập nhanh hơn
    chinese: { type: String, required: true },
    hanViet: { type: String, required: true },
    pinyin: { type: String, required: true },
    vietnamese: { type: String, required: true },

    // --- CÁC TRƯỜNG MỚI CHO THUẬT TOÁN SM-2 ---
    repetition: {
        type: Number,
        default: 0, // Số lần ôn tập đúng liên tiếp
    },
    easinessFactor: {
        type: Number,
        default: 2.5, // Hệ số độ dễ, bắt đầu từ 2.5
    },
    interval: {
        type: Number,
        default: 0, // Khoảng cách (số ngày) cho lần ôn tập tiếp theo
    },
    dueDate: {
        type: Date,
        default: Date.now, // Ngày cần ôn tập, mặc định là ngay bây giờ
    },
}, { timestamps: true });

// Index để tối ưu query lấy thẻ cần review
FlashcardSchema.index({ userId: 1, dueDate: 1 });

module.exports = mongoose.model('Flashcard', FlashcardSchema);
