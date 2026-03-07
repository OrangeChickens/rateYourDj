// models/Comment.js
const { pool } = require('../config/database');

class Comment {
  /**
   * 创建评论
   */
  static async create(reviewId, userId, content, parentCommentId = null) {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      console.log(`💾 Comment.create 接收参数:`, {
        reviewId,
        reviewIdType: typeof reviewId,
        userId,
        content,
        parentCommentId,
        parentCommentIdType: typeof parentCommentId
      });

      // 如果是回复评论，检查父评论是否存在
      if (parentCommentId) {
        const [parent] = await connection.query(
          'SELECT id FROM review_comments WHERE id = ?',
          [parentCommentId]
        );

        if (!parent || parent.length === 0) {
          throw new Error('父评论不存在');
        }
      }

      // 插入评论
      console.log(`💾 准备插入数据库:`, {
        review_id: reviewId,
        parent_comment_id: parentCommentId,
        user_id: userId,
        content
      });

      const [result] = await connection.query(
        `INSERT INTO review_comments
         (review_id, parent_comment_id, user_id, content)
         VALUES (?, ?, ?, ?)`,
        [reviewId, parentCommentId, userId, content]
      );

      const commentId = result.insertId;

      // 获取新创建的评论（包含用户信息）
      const [comments] = await connection.query(
        `SELECT c.*, u.nickname, u.avatar_url
         FROM review_comments c
         LEFT JOIN users u ON c.user_id = u.id
         WHERE c.id = ?`,
        [commentId]
      );

      await connection.commit();
      return comments[0];
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * 获取评论列表（平铺，不含嵌套结构）
   */
  static async findByReviewId(reviewId, options = {}) {
    const { page = 1, limit = 20, sort = 'created_at', order = 'DESC', userId = null } = options;
    const offset = (page - 1) * limit;

    // 验证排序字段
    const allowedSortFields = ['created_at', 'vote_score'];
    const sortField = allowedSortFields.includes(sort) ? sort : 'created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // 获取评论列表（只获取顶级评论进行分页）
    // 如果提供了 userId，同时获取该用户的投票状态
    const [comments] = await pool.query(
      `SELECT c.*, u.nickname, u.avatar_url,
              ${userId ? 'cv.vote_type as user_vote_type' : 'NULL as user_vote_type'}
       FROM review_comments c
       LEFT JOIN users u ON c.user_id = u.id
       ${userId ? 'LEFT JOIN comment_votes cv ON c.id = cv.comment_id AND cv.user_id = ?' : ''}
       WHERE c.review_id = ? AND c.parent_comment_id IS NULL AND (c.status IS NULL OR c.status != 'rejected')
       ORDER BY c.${sortField} ${sortOrder}
       LIMIT ? OFFSET ?`,
      userId ? [userId, reviewId, limit, offset] : [reviewId, limit, offset]
    );

    console.log(`📝 顶级评论数量: ${comments.length}`);
    if (comments.length > 0) {
      console.log(`📝 顶级评论 ID 类型示例:`, {
        id: comments[0].id,
        idType: typeof comments[0].id,
        parent_comment_id: comments[0].parent_comment_id,
        parentIdType: typeof comments[0].parent_comment_id
      });
    }

    // 获取所有回复（不分页）
    const [replies] = await pool.query(
      `SELECT c.*, u.nickname, u.avatar_url,
              ${userId ? 'cv.vote_type as user_vote_type' : 'NULL as user_vote_type'}
       FROM review_comments c
       LEFT JOIN users u ON c.user_id = u.id
       ${userId ? 'LEFT JOIN comment_votes cv ON c.id = cv.comment_id AND cv.user_id = ?' : ''}
       WHERE c.review_id = ? AND c.parent_comment_id IS NOT NULL AND (c.status IS NULL OR c.status != 'rejected')
       ORDER BY c.created_at ASC`,
      userId ? [userId, reviewId] : [reviewId]
    );

    console.log(`💬 回复评论数量: ${replies.length}`);
    if (replies.length > 0) {
      console.log(`💬 回复详情:`, replies.map(r => ({
        id: r.id,
        idType: typeof r.id,
        parent_comment_id: r.parent_comment_id,
        parentIdType: typeof r.parent_comment_id,
        content: r.content
      })));
    }

    // 合并顶级评论和回复
    const allComments = [...comments, ...replies];
    console.log(`📦 合并后总数: ${allComments.length}`);

    // 获取总数（只计算顶级评论）
    const [[{ total }]] = await pool.query(
      "SELECT COUNT(*) as total FROM review_comments WHERE review_id = ? AND parent_comment_id IS NULL AND (status IS NULL OR status != 'rejected')",
      [reviewId]
    );

    return {
      data: allComments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * 删除评论（级联删除子评论）
   */
  static async delete(commentId, userId) {
    // 检查评论是否存在且属于该用户
    const [comments] = await pool.query(
      'SELECT user_id FROM review_comments WHERE id = ?',
      [commentId]
    );

    if (!comments || comments.length === 0) {
      throw new Error('评论不存在');
    }

    if (comments[0].user_id !== userId) {
      throw new Error('无权删除此评论');
    }

    // 删除评论（外键级联会自动删除子评论和投票）
    await pool.query('DELETE FROM review_comments WHERE id = ?', [commentId]);

    return true;
  }

  /**
   * 投票（upvote/downvote）- Toggle 机制
   */
  static async vote(commentId, userId, voteType) {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 检查是否已投票
      const [existing] = await connection.query(
        'SELECT vote_type FROM comment_votes WHERE comment_id = ? AND user_id = ?',
        [commentId, userId]
      );

      if (existing.length > 0) {
        const oldVote = existing[0].vote_type;

        if (oldVote === voteType) {
          // 取消投票
          await connection.query(
            'DELETE FROM comment_votes WHERE comment_id = ? AND user_id = ?',
            [commentId, userId]
          );
          const scoreChange = voteType === 'upvote' ? -1 : 1;
          await connection.query(
            'UPDATE review_comments SET vote_score = vote_score + ? WHERE id = ?',
            [scoreChange, commentId]
          );
        } else {
          // 切换投票类型（upvote ↔ downvote）
          await connection.query(
            'UPDATE comment_votes SET vote_type = ? WHERE comment_id = ? AND user_id = ?',
            [voteType, commentId, userId]
          );
          const scoreChange = voteType === 'upvote' ? 2 : -2;
          await connection.query(
            'UPDATE review_comments SET vote_score = vote_score + ? WHERE id = ?',
            [scoreChange, commentId]
          );
        }
      } else {
        // 新投票
        await connection.query(
          'INSERT INTO comment_votes (comment_id, user_id, vote_type) VALUES (?, ?, ?)',
          [commentId, userId, voteType]
        );
        const scoreChange = voteType === 'upvote' ? 1 : -1;
        await connection.query(
          'UPDATE review_comments SET vote_score = vote_score + ? WHERE id = ?',
          [scoreChange, commentId]
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

  /**
   * 构建嵌套树结构（递归）
   */
  static buildNestedTree(flatComments, parentId = null, depth = 0, maxDepth = 3) {
    const result = [];

    for (const comment of flatComments) {
      // 匹配父评论（顶级评论的 parent_comment_id 为 null）
      // 使用 == 而不是 === 以允许数字/字符串类型的灵活匹配
      if (comment.parent_comment_id == parentId) {
        const node = {
          ...comment,
          depth,
          replies: []
        };

        // 递归构建子评论（最多 3 层）
        if (depth < maxDepth) {
          node.replies = this.buildNestedTree(flatComments, comment.id, depth + 1, maxDepth);
        }

        result.push(node);
      }
    }

    return result;
  }

  /**
   * 计算评论深度（用于限制嵌套层级）
   */
  static async getCommentDepth(commentId) {
    let depth = 0;
    let currentId = commentId;

    // 向上追溯父评论，计算深度
    while (currentId) {
      const [comments] = await pool.query(
        'SELECT parent_comment_id FROM review_comments WHERE id = ?',
        [currentId]
      );

      if (!comments || comments.length === 0) break;

      currentId = comments[0].parent_comment_id;
      if (currentId) depth++;
    }

    return depth;
  }

  /**
   * 获取评论数（用于前端显示评论总数）
   */
  static async getCommentCount(reviewId) {
    const [[{ count }]] = await pool.query(
      "SELECT COUNT(*) as count FROM review_comments WHERE review_id = ? AND (status IS NULL OR status != 'rejected')",
      [reviewId]
    );

    return count;
  }
}

module.exports = Comment;
