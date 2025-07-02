const Word = require('../models/word.model');
const pinyinLib = require('pinyin');
const getPinyin = pinyinLib.default || pinyinLib;
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const hanviet = require('../libs/hanviet');

const LIBRE_API_KEY = process.env.LIBRE_API_KEY || '';

// Hàm lấy pinyin từ chữ Hán (có dấu)
function getPinyinText(chinese) {
    return getPinyin(chinese, { style: getPinyin.STYLE_TONE }).flat().join(' ');
}

// Hàm dịch nghĩa tiếng Việt bằng LibreTranslate (miễn phí)
async function getVietnameseMeaning(chinese) {
    try {
        const res = await fetch('https://libretranslate.de/translate', {
            method: 'POST',
            body: JSON.stringify({
                q: chinese,
                source: 'zh',
                target: 'vi',
                format: 'text'
            }),
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        return data.translatedText || '';
    } catch (e) {
        console.log('LibreTranslate error:', e);
        return '';
    }
}

// Hàm tra Hán Việt từ object hanviet.data
function getHanVietText(chinese) {
    if (!chinese) return '';
    // Ưu tiên tra cụm từ trước, nếu không có thì tra từng ký tự
    if (hanviet.data[chinese]) return hanviet.data[chinese];
    return chinese.split('').map(char => hanviet.data[char] || char).join(' ');
}

// Thêm từ mới (tự động sinh pinyin, nghĩa tiếng Việt, Hán Việt nếu thiếu)
exports.createWord = async (req, res) => {
    try {
        const { chinese, hanViet, pinyin, vietnamese } = req.body;
        let finalPinyin = pinyin;
        let finalVietnamese = vietnamese;
        let finalHanViet = hanViet;

        if (!finalPinyin) {
            finalPinyin = getPinyinText(chinese);
        }
        if (!finalVietnamese) {
            finalVietnamese = await getVietnameseMeaning(chinese);
            if (!finalVietnamese) {
                finalVietnamese = 'Chưa có nghĩa';
            }
        }
        if (!finalHanViet) {
            finalHanViet = getHanVietText(chinese);
        }

        const word = new Word({
            chinese,
            hanViet: finalHanViet,
            pinyin: finalPinyin,
            vietnamese: finalVietnamese,
        });
        await word.save();
        res.status(201).json(word);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Lấy danh sách từ (có phân trang và tìm kiếm)
exports.getWords = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const search = req.query.search || '';
        const query = search
            ? {
                $or: [
                    { chinese: { $regex: search, $options: 'i' } },
                    { hanViet: { $regex: search, $options: 'i' } },
                    { pinyin: { $regex: search, $options: 'i' } },
                    { vietnamese: { $regex: search, $options: 'i' } },
                ],
            }
            : {};
        const total = await Word.countDocuments(query);
        const words = await Word.find(query)
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .sort({ _id: -1 });
        res.json({ total, words });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Sửa từ
exports.updateWord = async (req, res) => {
    try {
        const { chinese, hanViet, pinyin, vietnamese } = req.body;
        let updateData = { ...req.body };
        // Nếu có sửa chữ Trung
        if (chinese) {
            // Nếu frontend không gửi lên các trường này thì tự động sinh lại
            if (typeof hanViet === 'undefined') {
                updateData.hanViet = getHanVietText(chinese);
            }
            if (typeof pinyin === 'undefined') {
                updateData.pinyin = getPinyinText(chinese);
            }
            if (typeof vietnamese === 'undefined') {
                updateData.vietnamese = await getVietnameseMeaning(chinese);
                if (!updateData.vietnamese) {
                    updateData.vietnamese = 'Chưa có nghĩa';
                }
            }
        }
        const word = await Word.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!word) return res.status(404).json({ error: 'Word not found' });
        res.json(word);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Xóa từ
exports.deleteWord = async (req, res) => {
    try {
        const word = await Word.findByIdAndDelete(req.params.id);
        if (!word) return res.status(404).json({ error: 'Word not found' });
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}; 