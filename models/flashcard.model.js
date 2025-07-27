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
    chinese: {
        type: String,
        required: true
    },
    hanViet: {
        type: String,
        required: true
    },
    pinyin: {
        type: String,
        required: true
    },
    vietnamese: {
        type: String,
        required: true
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium'
    },
    reviewCount: {
        type: Number,
        default: 0
    },
    correctCount: {
        type: Number,
        default: 0
    },
    lastReviewed: {
        type: Date,
        default: Date.now
    },
    nextReview: {
        type: Date,
        default: Date.now
    },
    isMastered: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index để tối ưu query
FlashcardSchema.index({ userId: 1, nextReview: 1 });
FlashcardSchema.index({ userId: 1, difficulty: 1 });

module.exports = mongoose.model('Flashcard', FlashcardSchema); 