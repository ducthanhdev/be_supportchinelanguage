const Word = require('../models/word.model');
const pinyinLib = require('pinyin');
const getPinyin = pinyinLib.default || pinyinLib;
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const hanviet = require('../libs/hanviet');
const { translate } = require('@vitalets/google-translate-api');

const LIBRE_API_KEY = process.env.LIBRE_API_KEY || '';

// Hàm lấy pinyin từ chữ Hán (có dấu)
function getPinyinText(chinese) {
    return getPinyin(chinese, { style: getPinyin.STYLE_TONE }).flat().join(' ');
}

// Hàm tra Hán Việt từ object hanviet.data
function getHanVietText(chinese) {
    if (!chinese) return '';
    // Ưu tiên tra cụm từ trước, nếu không có thì tra từng ký tự
    if (hanviet.data[chinese]) return hanviet.data[chinese];
    return chinese.split('').map(char => hanviet.data[char] || char).join(' ');
}

// Hàm dịch tiếng Trung sang tiếng Việt
async function translateToVietnamese(chinese) {
    try {
        console.log('Đang dịch từ:', chinese);
        const result = await translate(chinese, { from: 'zh', to: 'vi' });
        console.log('Kết quả dịch:', result);
        return result.text;
    } catch (error) {
        console.error('Lỗi dịch thuật:', error);
        return 'Chưa có nghĩa';
    }
}

// Thêm từ mới (tự động dịch nghĩa tiếng Việt)
exports.createWord = async (req, res) => {
    try {
        const { chinese, hanViet, pinyin, vietnamese } = req.body;
        console.log('Tạo từ mới:', { chinese, hanViet, pinyin, vietnamese });

        let finalPinyin = pinyin;
        let finalVietnamese = vietnamese;
        let finalHanViet = hanViet;

        // Luôn tự động sinh pinyin nếu không có
        if (!finalPinyin) {
            finalPinyin = getPinyinText(chinese);
            console.log('Sinh pinyin:', finalPinyin);
        }

        // Luôn tự động dịch nghĩa tiếng Việt khi thêm từ mới
        // Chỉ giữ lại nghĩa tiếng Việt nếu user đã nhập và không phải là giá trị mặc định
        if (!finalVietnamese || finalVietnamese === 'Chưa có nghĩa' || finalVietnamese.trim() === '') {
            console.log('Bắt đầu dịch nghĩa tiếng Việt...');
            finalVietnamese = await translateToVietnamese(chinese);
            console.log('Kết quả dịch nghĩa:', finalVietnamese);
        }

        // Luôn tự động sinh Hán Việt nếu không có
        if (!finalHanViet) {
            finalHanViet = getHanVietText(chinese);
            console.log('Sinh Hán Việt:', finalHanViet);
        }

        const word = new Word({
            userId: req.user.userId,
            chinese,
            hanViet: finalHanViet,
            pinyin: finalPinyin,
            vietnamese: finalVietnamese,
        });
        await word.save();
        console.log('Đã lưu từ:', word);
        res.status(201).json(word);
    } catch (err) {
        console.error('Lỗi tạo từ:', err);
        res.status(400).json({ error: err.message });
    }
};

// Lấy danh sách từ (có phân trang và tìm kiếm)
exports.getWords = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const search = req.query.search || '';
        const baseQuery = { userId: req.user.userId };
        const query = search
            ? {
                ...baseQuery,
                $or: [
                    { chinese: { $regex: search, $options: 'i' } },
                    { hanViet: { $regex: search, $options: 'i' } },
                    { pinyin: { $regex: search, $options: 'i' } },
                    { vietnamese: { $regex: search, $options: 'i' } },
                ],
            }
            : baseQuery;
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

// Sửa từ (tự động dịch nghĩa tiếng Việt khi cần)
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
                // Tự động dịch nghĩa tiếng Việt
                updateData.vietnamese = await translateToVietnamese(chinese);
            }
        }
        const word = await Word.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.userId },
            updateData,
            { new: true }
        );
        if (!word) return res.status(404).json({ error: 'Word not found' });
        res.json(word);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Xóa từ
exports.deleteWord = async (req, res) => {
    try {
        const word = await Word.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
        if (!word) return res.status(404).json({ error: 'Word not found' });
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}; 