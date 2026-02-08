// models/Stats.js
const { pool } = require('../config/database');

class Stats {
  /**
   * 获取仪表盘统计数据
   */
  static async getDashboard() {
    // DJ 总数
    const [[{ djCount }]] = await pool.query(
      'SELECT COUNT(*) as djCount FROM djs'
    );

    // 评价总数（仅已审核）
    const [[{ reviewCount }]] = await pool.query(
      'SELECT COUNT(*) as reviewCount FROM reviews WHERE status = "approved"'
    );

    // 互动总数（评价互动 + 评论 + 评论投票）
    const [[{ reviewInteractionCount }]] = await pool.query(
      'SELECT COUNT(*) as reviewInteractionCount FROM review_interactions'
    );

    const [[{ commentCount }]] = await pool.query(
      'SELECT COUNT(*) as commentCount FROM review_comments'
    );

    const [[{ commentVoteCount }]] = await pool.query(
      'SELECT COUNT(*) as commentVoteCount FROM comment_votes'
    );

    const interactionCount = reviewInteractionCount + commentCount + commentVoteCount;

    console.log(`📊 互动总数统计:`, {
      reviewInteractionCount,
      commentCount,
      commentVoteCount,
      total: interactionCount
    });

    // 用户总数
    const [[{ userCount }]] = await pool.query(
      'SELECT COUNT(*) as userCount FROM users'
    );

    return {
      djCount,
      reviewCount,
      interactionCount,
      userCount
    };
  }

  /**
   * 获取最近评价
   */
  static async getRecentReviews(limit = 5) {
    const [reviews] = await pool.query(`
      SELECT
        r.id,
        r.overall_rating,
        r.comment,
        r.created_at,
        r.is_anonymous,
        u.nickname,
        u.avatar_url,
        d.id as dj_id,
        d.name as dj_name,
        d.city
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      JOIN djs d ON r.dj_id = d.id
      WHERE r.status = 'approved'
      ORDER BY r.created_at DESC
      LIMIT ?
    `, [limit]);

    // 处理匿名评价
    return reviews.map(review => {
      if (review.is_anonymous) {
        review.nickname = '匿名用户';
        review.avatar_url = null;
      }
      return review;
    });
  }
}

module.exports = Stats;
