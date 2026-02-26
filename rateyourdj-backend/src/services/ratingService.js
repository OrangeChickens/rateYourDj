const { pool } = require('../config/database');
const DJ = require('../models/DJ');

// 计算平均分
function average(numbers) {
  if (numbers.length === 0) return 0;
  const sum = numbers.reduce((a, b) => a + b, 0);
  return sum / numbers.length;
}

// Bayesian average 可信阈值
const BAYESIAN_C = 5;

// 更新DJ的所有评分
async function updateDJRatings(djId) {
  try {
    // 获取该DJ的所有已批准的评论
    const [reviews] = await pool.query(
      'SELECT * FROM reviews WHERE dj_id = ? AND status = "approved"',
      [djId]
    );

    if (reviews.length === 0) {
      // 如果没有评论，重置为0
      await DJ.updateRatings(djId, {
        overall_rating: 0,
        set_rating: 0,
        performance_rating: 0,
        personality_rating: 0,
        review_count: 0,
        would_choose_again_percent: 0,
        weighted_score: 0
      });
      return;
    }

    // 计算各项平均分
    const overallRating = average(reviews.map(r => r.overall_rating));
    const setRating = average(reviews.map(r => r.set_rating));
    const performanceRating = average(reviews.map(r => r.performance_rating));
    const personalityRating = average(reviews.map(r => r.personality_rating));

    // 计算会再选择的百分比
    const wouldChooseAgainCount = reviews.filter(r => r.would_choose_again).length;
    const wouldChooseAgainPercent = (wouldChooseAgainCount / reviews.length) * 100;

    // 计算 Bayesian average weighted_score
    // 公式: weighted = (n / (n + C)) × R + (C / (n + C)) × G
    const n = reviews.length;
    const R = overallRating;
    const [globalAvgResult] = await pool.query(
      'SELECT AVG(overall_rating) as global_avg FROM djs WHERE review_count > 0'
    );
    const G = globalAvgResult[0].global_avg || 0;
    const weightedScore = (n / (n + BAYESIAN_C)) * R + (BAYESIAN_C / (n + BAYESIAN_C)) * G;

    // 更新DJ评分
    await DJ.updateRatings(djId, {
      overall_rating: parseFloat(overallRating.toFixed(2)),
      set_rating: parseFloat(setRating.toFixed(2)),
      performance_rating: parseFloat(performanceRating.toFixed(2)),
      personality_rating: parseFloat(personalityRating.toFixed(2)),
      review_count: reviews.length,
      would_choose_again_percent: Math.round(wouldChooseAgainPercent),
      weighted_score: parseFloat(weightedScore.toFixed(2))
    });

    console.log(`✅ Updated ratings for DJ ${djId}`);
  } catch (error) {
    console.error('Error updating DJ ratings:', error);
    throw error;
  }
}

module.exports = { updateDJRatings };
