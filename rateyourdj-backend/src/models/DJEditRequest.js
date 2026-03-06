const { pool } = require('../config/database');

class DJEditRequest {
  // 创建修改申请
  static async create(djId, userId, proposedData) {
    const [result] = await pool.query(
      `INSERT INTO dj_edit_requests (dj_id, user_id, proposed_data)
       VALUES (?, ?, ?)`,
      [djId, userId, JSON.stringify(proposedData)]
    );
    return result.insertId;
  }

  // 检查是否已有 pending 申请（同一用户同一DJ）
  static async hasPending(djId, userId) {
    const [rows] = await pool.query(
      `SELECT COUNT(*) as count FROM dj_edit_requests
       WHERE dj_id = ? AND user_id = ? AND status = 'pending'`,
      [djId, userId]
    );
    return rows[0].count > 0;
  }

  // 获取 pending 列表
  static async getPending(page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const [rows] = await pool.query(
      `SELECT r.*, d.name as dj_name, u.nickname as submitter_nickname
       FROM dj_edit_requests r
       JOIN djs d ON r.dj_id = d.id
       JOIN users u ON r.user_id = u.id
       WHERE r.status = 'pending'
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [parseInt(limit), parseInt(offset)]
    );

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM dj_edit_requests WHERE status = 'pending'`
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

  // 获取 pending 数量
  static async getPendingCount() {
    const [rows] = await pool.query(
      `SELECT COUNT(*) as count FROM dj_edit_requests WHERE status = 'pending'`
    );
    return rows[0].count;
  }

  // 获取详情（含当前DJ数据）
  static async getDetail(id) {
    const [rows] = await pool.query(
      `SELECT r.*, d.name as dj_name, d.city as dj_city, d.label as dj_label,
              d.music_style as dj_music_style, d.bio as dj_bio, d.photo_url as dj_photo_url,
              u.nickname as submitter_nickname
       FROM dj_edit_requests r
       JOIN djs d ON r.dj_id = d.id
       JOIN users u ON r.user_id = u.id
       WHERE r.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  // 审核通过（事务：更新DJ + 更新申请状态）
  static async approve(id) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 获取申请详情
      const [requests] = await connection.query(
        'SELECT * FROM dj_edit_requests WHERE id = ? AND status = ?',
        [id, 'pending']
      );

      if (requests.length === 0) {
        throw new Error('申请不存在或已处理');
      }

      const request = requests[0];
      const proposed = typeof request.proposed_data === 'string'
        ? JSON.parse(request.proposed_data)
        : request.proposed_data;

      // 构建 UPDATE 语句
      const fields = [];
      const values = [];

      if (proposed.name !== undefined) { fields.push('name = ?'); values.push(proposed.name); }
      if (proposed.city !== undefined) { fields.push('city = ?'); values.push(proposed.city); }
      if (proposed.label !== undefined) { fields.push('label = ?'); values.push(proposed.label || null); }
      if (proposed.music_style !== undefined) { fields.push('music_style = ?'); values.push(proposed.music_style || null); }
      if (proposed.bio !== undefined) { fields.push('bio = ?'); values.push(proposed.bio || null); }
      if (proposed.photo_url !== undefined) { fields.push('photo_url = ?'); values.push(proposed.photo_url || null); }

      if (fields.length > 0) {
        values.push(request.dj_id);
        await connection.query(
          `UPDATE djs SET ${fields.join(', ')} WHERE id = ?`,
          values
        );
      }

      // 更新申请状态
      await connection.query(
        'UPDATE dj_edit_requests SET status = ? WHERE id = ?',
        ['approved', id]
      );

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // 拒绝
  static async reject(id) {
    const [result] = await pool.query(
      'UPDATE dj_edit_requests SET status = ? WHERE id = ? AND status = ?',
      ['rejected', id, 'pending']
    );
    return result.affectedRows > 0;
  }
}

module.exports = DJEditRequest;
