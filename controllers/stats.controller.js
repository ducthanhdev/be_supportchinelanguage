const mongoose = require("mongoose");
const Word = require("../models/word.model");
const Flashcard = require("../models/flashcard.model");

function formatDate(date) {
  if (!date) return null;

  try {
    return new Date(date).toISOString().slice(0, 10);
  } catch (err) {
    console.error("Lỗi khi format date:", date, err);
    return null;
  }
}

exports.getDashboardStats = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res
        .status(401)
        .json({ error: "Chưa đăng nhập hoặc token không hợp lệ" });
    }
    const userId = req.user.userId;
    console.log("req.user = ", req.user);
    const { range = "30days" } = req.query;
    const validRanges = ["7days", "30days", "90days"];

    if (typeof range !== "string" || !validRanges.includes(range)) {
      return res.status(400).json({ error: "Giá trị range không hợp lệ" });
    }

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
    console.log("📦 words: ", words); // <-- deherehere

    const progressMap = {};
    words.forEach((word) => {
      console.log("🕒 word.createdAt =", word.createdAt);
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
      if (!date) return; // bỏ qua nếu không hợp lệ
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
    let userObjectId;
    try {
      userObjectId = mongoose.Types.ObjectId(userId);
    } catch (err) {
      return res.status(400).json({ error: "ID người dùng không hợp lệ" });
    }

    const difficultyCounts = await Flashcard.aggregate([
      { $match: { userId: userObjectId } },
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
    console.error("Lỗi getDashboardStats:", error);
    res.status(500).json({ error: "Lỗi server khi lấy thống kê dashboard" });
  }
};
