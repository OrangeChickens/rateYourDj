const { pool } = require('../config/database');

class Suggestion {
  // 创建建议
  static async create(userId, content) {
    const [result] = await pool.query(
      'INSERT INTO suggestions (user_id, content) VALUES (?, ?)',
      [userId, content]
    );
    return this.findById(result.insertId, userId);
  }

  // 通过ID获取建议
  static async findById(id, userId = null) {
    const userVoteJoin = userId
      ? 'LEFT JOIN suggestion_votes sv ON sv.suggestion_id = s.id AND sv.user_id = ?'
      : '';
    const userVoteSelect = userId
      ? ', sv.vote_type as user_vote'
      : ', NULL as user_vote';
    const params = userId ? [userId, id] : [id];

    const [rows] = await pool.query(
      `SELECT s.*, u.nickname, u.avatar_url ${userVoteSelect}
       FROM suggestions s
       LEFT JOIN users u ON s.user_id = u.id
       ${userVoteJoin}
       WHERE s.id = ?`,
      params
    );

    return rows.length > 0 ? rows[0] : null;
  }

  // 获取建议列表（按 upvote_count 降序）
  static async getList(page = 1, limit = 20, userId = null) {
    const offset = (page - 1) * limit;

    const userVoteJoin = userId
      ? 'LEFT JOIN suggestion_votes sv ON sv.suggestion_id = s.id AND sv.user_id = ?'
      : '';
    const userVoteSelect = userId
      ? ', sv.vote_type as user_vote'
      : ', NULL as user_vote';

    const params = userId
      ? [userId, parseInt(limit), parseInt(offset)]
      : [parseInt(limit), parseInt(offset)];

    const [rows] = await pool.query(
      `SELECT s.*, u.nickname, u.avatar_url ${userVoteSelect}
       FROM suggestions s
       LEFT JOIN users u ON s.user_id = u.id
       ${userVoteJoin}
       ORDER BY s.upvote_count DESC, s.created_at DESC
       LIMIT ? OFFSET ?`,
      params
    );

    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM suggestions'
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

  // 投票（toggle 逻辑）
  static async vote(suggestionId, userId, voteType) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // 检查现有投票
      const [existing] = await connection.query(
        'SELECT * FROM suggestion_votes WHERE suggestion_id = ? AND user_id = ?',
        [suggestionId, userId]
      );

      if (existing.length > 0) {
        const currentVote = existing[0].vote_type;

        if (currentVote === voteType) {
          // 相同类型 -> 取消投票
          await connection.query(
            'DELETE FROM suggestion_votes WHERE suggestion_id = ? AND user_id = ?',
            [suggestionId, userId]
          );
          const countField = voteType === 'up' ? 'upvote_count' : 'downvote_count';
          await connection.query(
            `UPDATE suggestions SET ${countField} = GREATEST(${countField} - 1, 0) WHERE id = ?`,
            [suggestionId]
          );
        } else {
          // 不同类型 -> 替换投票
          await connection.query(
            'UPDATE suggestion_votes SET vote_type = ? WHERE suggestion_id = ? AND user_id = ?',
            [voteType, suggestionId, userId]
          );
          const oldField = currentVote === 'up' ? 'upvote_count' : 'downvote_count';
          const newField = voteType === 'up' ? 'upvote_count' : 'downvote_count';
          await connection.query(
            `UPDATE suggestions SET ${oldField} = GREATEST(${oldField} - 1, 0), ${newField} = ${newField} + 1 WHERE id = ?`,
            [suggestionId]
          );
        }
      } else {
        // 新投票
        await connection.query(
          'INSERT INTO suggestion_votes (suggestion_id, user_id, vote_type) VALUES (?, ?, ?)',
          [suggestionId, userId, voteType]
        );
        const countField = voteType === 'up' ? 'upvote_count' : 'downvote_count';
        await connection.query(
          `UPDATE suggestions SET ${countField} = ${countField} + 1 WHERE id = ?`,
          [suggestionId]
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

  // 删除建议（仅本人）
  static async delete(suggestionId, userId) {
    const [rows] = await pool.query(
      'SELECT * FROM suggestions WHERE id = ? AND user_id = ?',
      [suggestionId, userId]
    );

    if (rows.length === 0) {
      throw new Error('建议不存在或无权删除');
    }

    await pool.query('DELETE FROM suggestions WHERE id = ?', [suggestionId]);
    return true;
  }
}

module.exports = Suggestion;
