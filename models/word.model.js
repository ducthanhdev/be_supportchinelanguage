const mongoose = require('mongoose');

const WordSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    chinese: { type: String, required: true },
    hanViet: { type: String, required: true },
    pinyin: { type: String, required: true },
    vietnamese: { type: String, required: true },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Word', WordSchema); 