const mongoose = require('mongoose');

const WordSchema = new mongoose.Schema({
    chinese: { type: String, required: true },
    hanViet: { type: String, required: true },
    pinyin: { type: String, required: true },
    vietnamese: { type: String, required: true }
});

module.exports = mongoose.model('Word', WordSchema); 