const Word = require("../models/word.model");
const Flashcard = require("../models/flashcard.model");

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { range } = req.query;

    let fromDate = null;
    if (range === "7days") {
      fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 7);
    } else if (range === "30days") {
      fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 30);
    } else if (range === "90days") {
      fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 90);
    }

    // 1. Progress: Số từ học được theo ngày
    const wordQuery = { userId };
    if (fromDate) wordQuery.createdAt = { $gte: fromDate };

    const words = await Word.find(wordQuery).sort({ createdAt: 1 });

    const progressMap = {};
    words.forEach((word) => {
      const date = formatDate(word.createdAt);
      progressMap[date] = (progressMap[date] || 0) + 1;
    });

    let total = 0;
    const progress = Object.entries(progressMap).map(([date, count]) => {
      total += count;
      return { date, totalWords: total };
    });

    const dailyCounts = Object.entries(progressMap).map(([date, count]) => ({
      date,
      count,
    }));

    // 2. Activity: Heatmap và streaks
    const flashcards = await Flashcard.find({ userId });
    const heatmapData = {};
    flashcards.forEach((fc) => {
      const date = formatDate(fc.lastReviewed);
      heatmapData[date] = (heatmapData[date] || 0) + 1;
    });

    // Tính streak
    const days = Object.keys(heatmapData).sort();
    let currentStreak = 0,
      longestStreak = 0,
      prev = null;
    days.forEach((day) => {
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
        id: "1",
        name: "Bắt đầu",
        description: "Học từ đầu tiên",
        unlocked: words.length > 0,
        icon: "🚀",
      },
      {
        id: "2",
        name: "Chuyên cần",
        description: "Học 7 ngày liên tiếp",
        unlocked: longestStreak >= 7,
        icon: "📅",
      },
    ];

    // 4. Difficulty breakdown (thống kê số lượng theo độ khó)
    const difficultyCounts = await Flashcard.aggregate([
      { $match: { userId: require("mongoose").Types.ObjectId(userId) } },
      { $group: { _id: "$difficulty", count: { $sum: 1 } } },
    ]);

    const difficultyStats = {
      easy: 0,
      medium: 0,
      hard: 0,
    };

    difficultyCounts.forEach(({ _id, count }) => {
      if (["easy", "medium", "hard"].includes(_id)) {
        difficultyStats[_id] = count;
      }
    });

    res.json({
      progress,
      activity: {
        heatmapData,
        currentStreak,
        longestStreak,
      },
      achievements,
      difficultyStats,
      dailyCounts,
    });
  } catch (error) {
    res.status(500).json({ error: "Lỗi lấy thống kê dashboard" });
  }
};
