const { pool } = require('../config/database');
class ModerationFeedback {
  static async findByUserId(userId, page = 1, limit = 20) {
    const union = `SELECT 'review' AS content_type, r.id, r.id AS review_id, r.dj_id,
        d.name AS dj_name, r.comment AS content, r.status, r.moderation_reason,
        r.created_at, r.moderated_at
      FROM reviews r LEFT JOIN djs d ON d.id = r.dj_id
      WHERE r.user_id = ? AND (r.status <> 'approved' OR r.moderated_at IS NOT NULL)
      UNION ALL
      SELECT 'comment' AS content_type, c.id, c.review_id, r.dj_id,
        d.name AS dj_name, c.content, c.status, c.moderation_reason, c.created_at, c.moderated_at
      FROM review_comments c LEFT JOIN reviews r ON r.id = c.review_id
      LEFT JOIN djs d ON d.id = r.dj_id
      WHERE c.user_id = ? AND (c.status <> 'approved' OR c.moderated_at IS NOT NULL)`;
    const [rows] = await pool.query(`SELECT * FROM (${union}) feedback
      ORDER BY COALESCE(moderated_at, created_at) DESC, content_type, id DESC LIMIT ? OFFSET ?`,
      [userId, userId, limit, (page - 1) * limit]);
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM (${union}) feedback`, [userId, userId]);
    return { data: rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
}
module.exports = ModerationFeedback;
