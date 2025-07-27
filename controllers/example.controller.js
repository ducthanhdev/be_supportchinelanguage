const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

// Hàm lọc câu có độ dài phù hợp (từ 5 chữ trở lên)
function filterSuitableExample(sentences, minLength = 5) {
    if (!sentences || sentences.length === 0) return '';

    // Lọc các câu có độ dài từ minLength chữ trở lên
    const suitableSentences = sentences.filter(sentence =>
        sentence.text && sentence.text.length >= minLength
    );

    if (suitableSentences.length === 0) {
        // Nếu không có câu nào phù hợp, trả về câu dài nhất
        const longestSentence = sentences.reduce((longest, current) =>
            current.text && current.text.length > longest.length ? current.text : longest,
            sentences[0]?.text || ''
        );
        return longestSentence;
    }

    // Trả về câu đầu tiên phù hợp
    return suitableSentences[0].text;
}

exports.getExample = async (req, res) => {
    const word = req.query.word;
    if (!word) return res.status(400).json({ error: 'Thiếu từ cần tra' });
    try {
        const url = `https://tatoeba.org/eng/api_v0/search?from=cmn&query=${encodeURIComponent(word)}`;
        const response = await fetch(url);
        if (!response.ok) return res.status(500).json({ error: 'Không lấy được dữ liệu từ Tatoeba' });
        const data = await response.json();
        const sentences = data.results;
        const example = filterSuitableExample(sentences, 5);
        res.json({ example });
    } catch (e) {
        res.status(500).json({ error: 'Lỗi khi lấy ví dụ!' });
    }
};

exports.getExamplesBatch = async (req, res) => {
    const words = req.body.words;
    if (!Array.isArray(words)) return res.status(400).json({ error: 'Thiếu danh sách từ' });
    try {
        const results = await Promise.all(words.map(async (word) => {
            try {
                const url = `https://tatoeba.org/eng/api_v0/search?from=cmn&query=${encodeURIComponent(word)}`;
                const response = await fetch(url);
                if (!response.ok) return [word, ''];
                const data = await response.json();
                const sentences = data.results;
                const example = filterSuitableExample(sentences, 5);
                return [word, example];
            } catch {
                return [word, ''];
            }
        }));
        const examples = Object.fromEntries(results);
        res.json({ examples });
    } catch (e) {
        res.status(500).json({ error: 'Lỗi khi lấy batch ví dụ!' });
    }
}; 