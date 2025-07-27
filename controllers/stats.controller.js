const Word = require('../models/word.model');
const Flashcard = require('../models/flashcard.model');

function formatDate(date) {
    return date.toISOString().slice(0, 10);
}

exports.getDashboardStats = async (req, res) => {
    try {
        const userId = req.user.userId;

        // 1. Progress: Số từ học được theo ngày
        const words = await Word.find({ userId }).sort({ createdAt: 1 });
        const progressMap = {};
        words.forEach(word => {
            const date = formatDate(word.createdAt);
            progressMap[date] = (progressMap[date] || 0) + 1;
        });
        // Tính tổng lũy kế
        let total = 0;
        const progress = Object.entries(progressMap).map(([date, count]) => {
            total += count;
            return { date, totalWords: total };
        });

        // 2. Activity: Heatmap và streaks
        const flashcards = await Flashcard.find({ userId });
        const heatmapData = {};
        flashcards.forEach(fc => {
            const date = formatDate(fc.lastReviewed);
            heatmapData[date] = (heatmapData[date] || 0) + 1;
        });

        // Tính streak
        const days = Object.keys(heatmapData).sort();
        let currentStreak = 0, longestStreak = 0, prev = null;
        days.forEach(day => {
            if (!prev) {
                currentStreak = 1;
            } else {
                const diff = (new Date(day) - new Date(prev)) / (1000 * 60 * 60 * 24);
                if (diff === 1) {
                    currentStreak += 1;
                } else {
                    currentStreak = 1;
                }
            }
            if (currentStreak > longestStreak) longestStreak = currentStreak;
            prev = day;
        });

        // Nếu hôm nay có học thì currentStreak, không thì 0
        const today = formatDate(new Date());
        if (!heatmapData[today]) currentStreak = 0;

        // 3. Achievements (ví dụ đơn giản)
        const achievements = [
            {
                id: '1',
                name: 'Bắt đầu',
                description: 'Học từ đầu tiên',
                unlocked: words.length > 0,
                icon: '🚀'
            },
            {
                id: '2',
                name: 'Chuyên cần',
                description: 'Học 7 ngày liên tiếp',
                unlocked: longestStreak >= 7,
                icon: '📅'
            }
        ];

        res.json({
            progress,
            activity: {
                heatmapData,
                currentStreak,
                longestStreak
            },
            achievements
        });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi lấy thống kê dashboard' });
    }
};