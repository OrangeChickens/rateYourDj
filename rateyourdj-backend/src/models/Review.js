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
  static async findByDJId(djId, options = {}, userId = null) {
    const { sort = 'created_at', order = 'DESC', page = 1, limit = 20 } = options;

    const offset = (page - 1) * limit;

    const isHotSort = sort === 'hot';
    const allowedSortFields = ['created_at', 'helpful_count', 'overall_rating'];
    const sortField = allowedSortFields.includes(sort) ? sort : 'created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // 如果有 userId，LEFT JOIN review_interactions 获取当前用户的投票状态
    const userVoteJoin = userId
      ? `LEFT JOIN review_interactions ri ON ri.review_id = r.id AND ri.user_id = ? AND ri.interaction_type IN ('helpful', 'not_helpful')`
      : '';
    const userVoteSelect = userId
      ? `, ri.interaction_type as user_vote`
      : `, NULL as user_vote`;

    const params = userId
      ? [userId, djId, parseInt(limit), parseInt(offset)]
      : [djId, parseInt(limit), parseInt(offset)];

    const [rows] = await pool.query(
      `SELECT r.*, u.nickname, u.avatar_url,
              (SELECT COUNT(*) FROM review_comments WHERE review_id = r.id) as comment_count
              ${userVoteSelect}
       FROM reviews r
       LEFT JOIN users u ON r.user_id = u.id
       ${userVoteJoin}
       WHERE r.dj_id = ? AND r.status = 'approved'
       ORDER BY ${isHotSort
         ? `(r.helpful_count * 2 + (SELECT COUNT(*) FROM review_comments WHERE review_id = r.id) * 3 - r.not_helpful_count) DESC, r.created_at DESC`
         : `r.${sortField} ${sortOrder}`}
       LIMIT ? OFFSET ?`,
      params
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
  // helpful 和 not_helpful 互斥：点一个自动取消另一个
  static async interact(reviewId, userId, interactionType) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // 检查是否已经有相同类型的互动
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

        const countField = `${interactionType}_count`;
        await connection.query(
          `UPDATE reviews SET ${countField} = GREATEST(${countField} - 1, 0) WHERE id = ?`,
          [reviewId]
        );
      } else {
        // 互斥逻辑：helpful 和 not_helpful 互相排斥
        const oppositeType = interactionType === 'helpful' ? 'not_helpful'
                           : interactionType === 'not_helpful' ? 'helpful'
                           : null;

        if (oppositeType) {
          const [oppositeExisting] = await connection.query(
            'SELECT * FROM review_interactions WHERE review_id = ? AND user_id = ? AND interaction_type = ?',
            [reviewId, userId, oppositeType]
          );

          if (oppositeExisting.length > 0) {
            // 删除对立互动
            await connection.query(
              'DELETE FROM review_interactions WHERE review_id = ? AND user_id = ? AND interaction_type = ?',
              [reviewId, userId, oppositeType]
            );

            const oppositeCountField = `${oppositeType}_count`;
            await connection.query(
              `UPDATE reviews SET ${oppositeCountField} = GREATEST(${oppositeCountField} - 1, 0) WHERE id = ?`,
              [reviewId]
            );
          }
        }

        // 添加新互动
        await connection.query(
          'INSERT INTO review_interactions (review_id, user_id, interaction_type) VALUES (?, ?, ?)',
          [reviewId, userId, interactionType]
        );

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

  // 获取所有评价（用于"所有评价"页面）
  // isAdmin=true 时返回所有状态并包含 status 字段；filter='reported' 只返回被举报的
  static async getAllReviews({ page = 1, limit = 20, sort = 'created_at', order = 'DESC', isAdmin = false, filter = null }) {
    const offset = (page - 1) * limit;

    // 验证排序字段（白名单）
    const sortFieldMap = {
      'created_at': 'r.created_at',
      'overall_rating': 'r.overall_rating',
      'helpful_count': 'r.helpful_count'
    };
    const sortField = sortFieldMap[sort] || 'r.created_at';

    // 验证排序方向
    const orderDir = (order.toUpperCase() === 'ASC') ? 'ASC' : 'DESC';

    // 状态过滤
    let statusCondition;
    let statusParams;
    if (filter === 'reported' && isAdmin) {
      statusCondition = 'r.report_count > 0';
      statusParams = [];
    } else if (isAdmin) {
      statusCondition = '1=1';
      statusParams = [];
    } else {
      statusCondition = 'r.status = ?';
      statusParams = ['approved'];
    }

    const query = `
      SELECT
        r.id,
        r.dj_id,
        r.overall_rating,
        r.comment,
        r.created_at,
        r.is_anonymous,
        r.helpful_count,
        r.not_helpful_count,
        r.report_count,
        r.status,
        u.nickname,
        u.avatar_url,
        d.name as dj_name,
        d.city
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      JOIN djs d ON r.dj_id = d.id
      WHERE ${statusCondition}
      ORDER BY ${sortField} ${orderDir}
      LIMIT ? OFFSET ?
    `;

    const [reviews] = await pool.query(query, [...statusParams, limit, offset]);

    // 获取总数
    const countQuery = `SELECT COUNT(*) as total FROM reviews r WHERE ${statusCondition}`;
    const [[{ total }]] = await pool.query(countQuery, statusParams);

    // 处理匿名评价
    const processedReviews = reviews.map(review => {
      if (review.is_anonymous) {
        review.nickname = '匿名用户';
        review.avatar_url = null;
      }
      return processReview(review);
    });

    return {
      data: processedReviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // 更新评价状态（管理员）
  static async updateStatus(id, status) {
    const validStatuses = ['pending', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      throw new Error('无效的状态值');
    }

    // 获取评价信息（用于返回 dj_id）
    const [rows] = await pool.query('SELECT dj_id FROM reviews WHERE id = ?', [id]);
    if (rows.length === 0) {
      throw new Error('评价不存在');
    }

    await pool.query('UPDATE reviews SET status = ? WHERE id = ?', [status, id]);

    return { djId: rows[0].dj_id };
  }

  // 获取被举报评价数量
  static async getReportedCount() {
    const [[{ total }]] = await pool.query(
      'SELECT COUNT(*) as total FROM reviews WHERE report_count > 0'
    );
    return total;
  }
}

module.exports = Review;
