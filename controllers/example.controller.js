const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

exports.getExample = async (req, res) => {
    const word = req.query.word;
    if (!word) return res.status(400).json({ error: 'Thiếu từ cần tra' });
    try {
        const url = `https://tatoeba.org/eng/api_v0/search?from=cmn&query=${encodeURIComponent(word)}`;
        const response = await fetch(url);
        if (!response.ok) return res.status(500).json({ error: 'Không lấy được dữ liệu từ Tatoeba' });
        const data = await response.json();
        const sentences = data.results;
        const example = sentences && sentences.length > 0 ? sentences[0].text : '';
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
                const example = sentences && sentences.length > 0 ? sentences[0].text : '';
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