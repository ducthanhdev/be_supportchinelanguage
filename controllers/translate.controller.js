const { translate } = require('@vitalets/google-translate-api');

// Dịch từ tiếng Trung sang tiếng Việt
exports.translateToVietnamese = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ error: 'Thiếu text cần dịch' });
        }

        console.log('Translating text:', text);

        const result = await translate(text, { from: 'zh', to: 'vi' });
        console.log('Translation result:', result);

        res.json({
            original: text,
            translated: result.text,
            success: true
        });
    } catch (error) {
        console.error('Lỗi dịch thuật:', error);
        res.status(500).json({
            error: 'Lỗi khi dịch thuật: ' + error.message,
            success: false
        });
    }
};

// Dịch batch nhiều từ
exports.translateBatch = async (req, res) => {
    try {
        const { words } = req.body;
        if (!Array.isArray(words)) {
            return res.status(400).json({ error: 'Thiếu danh sách từ cần dịch' });
        }

        const results = await Promise.all(
            words.map(async (word) => {
                try {
                    const result = await translate(word, { from: 'zh', to: 'vi' });
                    return { word, translation: result.text };
                } catch (error) {
                    return { word, translation: 'Lỗi dịch' };
                }
            })
        );

        res.json({
            results,
            success: true
        });
    } catch (error) {
        console.error('Lỗi dịch batch:', error);
        res.status(500).json({
            error: 'Lỗi khi dịch batch',
            success: false
        });
    }
}; 