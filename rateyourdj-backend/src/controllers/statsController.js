// controllers/statsController.js
const Stats = require('../models/Stats');

/**
 * 获取仪表盘数据
 */
exports.getDashboard = async (req, res, next) => {
  try {
    const stats = await Stats.getDashboard();
    const recentReviews = await Stats.getRecentReviews(5);

    res.json({
      success: true,
      data: {
        stats,
        recentReviews
      }
    });
  } catch (error) {
    console.error('获取仪表盘数据失败:', error);
    next(error);
  }
};

module.exports = exports;
