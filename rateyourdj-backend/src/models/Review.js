const { pool } = require('../config/database');

// 辅助函数：将 HTTP URL 转换为 HTTPS（微信小程序要求）
function convertToHttps(url) {
  if (!url) return url;
  if (typeof url === 'string' && url.startsWith('http://')) {
    return url.replace('http://', 'https://');
  }
  return url;
}

// 辅助函数：处理评论对象，转换图片 URL
function processReview(review) {
  if (!review) return review;
  if (review.avatar_url) {
    review.avatar_url = convertToHttps(review.avatar_url);
  }
  return review;
}

// 辅助函数：处理评论数组
function processReviewArray(reviews) {
  return reviews.map(review => processReview(review));
}

class Review {
  // 创建评论
  static async create(reviewData) {
    const {
      dj_id,
      user_id,
      is_anonymous,
      overall_rating,
      set_rating,
      performance_rating,
      personality_rating,
      would_choose_again,
      comment,
      tags
    } = reviewData;

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // 插入评论
      const [result] = await connection.query(
        `INSERT INTO reviews
         (dj_id, user_id, is_anonymous, overall_rating, set_rating,
          performance_rating, personality_rating, would_choose_again, comment)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          dj_id,
          user_id,
          is_anonymous,
          overall_rating,
          set_rating,
          performance_rating,
          personality_rating,
          would_choose_again,
          comment
        ]
      );

      const reviewId = result.insertId;

      // 插入标签
      if (tags && tags.length > 0) {
        const tagValues = tags.map(tag => [reviewId, tag]);
        await connection.query(
          'INSERT INTO review_tags (review_id, tag_name) VALUES ?',
          [tagValues]
        );

        // 更新标签使用次数
        for (const tag of tags) {
          await connection.query(
            'UPDATE preset_tags SET usage_count = usage_count + 1 WHERE tag_name = ?',
            [tag]
          );
        }
      }

      await connection.commit();
      return this.findById(reviewId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // 通过ID获取评论
  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT r.*, u.nickname, u.avatar_url
       FROM reviews r
       LEFT JOIN users u ON r.user_id = u.id
       WHERE r.id = ?`,
      [id]
    );

    if (rows.length === 0) return null;

    const review = rows[0];

    // 获取标签
    const [tags] = await pool.query(
      'SELECT tag_name FROM review_tags WHERE review_id = ?',
      [id]
    );
    review.tags = tags.map(t => t.tag_name);

    // 如果是匿名评论，隐藏用户信息
    if (review.is_anonymous) {
      review.nickname = '匿名用户';
      review.avatar_url = null;
    }

    return processReview(review);
  }

  // 获取DJ的评论列表
  static async findByDJId(djId, options = {}) {
    const { sort = 'created_at', order = 'DESC', page = 1, limit = 20 } = options;

    const offset = (page - 1) * limit;

    const allowedSortFields = ['created_at', 'helpful_count', 'overall_rating'];
    const sortField = allowedSortFields.includes(sort) ? sort : 'created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const [rows] = await pool.query(
      `SELECT r.*, u.nickname, u.avatar_url
       FROM reviews r
       LEFT JOIN users u ON r.user_id = u.id
       WHERE r.dj_id = ? AND r.status = 'approved'
       ORDER BY r.${sortField} ${sortOrder}
       LIMIT ? OFFSET ?`,
      [djId, parseInt(limit), parseInt(offset)]
    );

    // 获取每个评论的标签
    for (const review of rows) {
      const [tags] = await pool.query(
        'SELECT tag_name FROM review_tags WHERE review_id = ?',
        [review.id]
      );
      review.tags = tags.map(t => t.tag_name);

      // 匿名处理
      if (review.is_anonymous) {
        review.nickname = '匿名用户';
        review.avatar_url = null;
      }
    }

    // 获取总数
    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM reviews WHERE dj_id = ? AND status = "approved"',
      [djId]
    );

    return {
      data: processReviewArray(rows),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    };
  }

  // 获取用户的评论列表
  static async findByUserId(userId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const [rows] = await pool.query(
      `SELECT r.*, d.name as dj_name, d.city
       FROM reviews r
       JOIN djs d ON r.dj_id = d.id
       WHERE r.user_id = ?
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, parseInt(limit), parseInt(offset)]
    );

    for (const review of rows) {
      const [tags] = await pool.query(
        'SELECT tag_name FROM review_tags WHERE review_id = ?',
        [review.id]
      );
      review.tags = tags.map(t => t.tag_name);
    }

    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM reviews WHERE user_id = ?',
      [userId]
    );

    return {
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    };
  }

  // 删除评论
  static async delete(id, userId) {
    // 验证是否是本人的评论
    const [rows] = await pool.query(
      'SELECT * FROM reviews WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (rows.length === 0) {
      throw new Error('评论不存在或无权删除');
    }

    await pool.query('DELETE FROM reviews WHERE id = ?', [id]);
    return true;
  }

  // 评论互动（有帮助/无帮助/举报）
  static async interact(reviewId, userId, interactionType) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // 检查是否已经互动过
      const [existing] = await connection.query(
        'SELECT * FROM review_interactions WHERE review_id = ? AND user_id = ? AND interaction_type = ?',
        [reviewId, userId, interactionType]
      );

      if (existing.length > 0) {
        // 取消互动
        await connection.query(
          'DELETE FROM review_interactions WHERE review_id = ? AND user_id = ? AND interaction_type = ?',
          [reviewId, userId, interactionType]
        );

        // 更新评论计数
        const countField = `${interactionType}_count`;
        await connection.query(
          `UPDATE reviews SET ${countField} = ${countField} - 1 WHERE id = ?`,
          [reviewId]
        );
      } else {
        // 添加互动
        await connection.query(
          'INSERT INTO review_interactions (review_id, user_id, interaction_type) VALUES (?, ?, ?)',
          [reviewId, userId, interactionType]
        );

        // 更新评论计数
        const countField = `${interactionType}_count`;
        await connection.query(
          `UPDATE reviews SET ${countField} = ${countField} + 1 WHERE id = ?`,
          [reviewId]
        );
      }

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = Review;
