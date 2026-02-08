// models/InviteCode.js
const pool = require('../config/database');

class InviteCode {
  // 生成邀请码
  static generateCode(prefix = 'UDISK') {
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${random}`;
  }

  // 创建邀请码（管理员）
  static async createAdmin(code, usageLimit = 1, expiresAt = null) {
    const query = `
      INSERT INTO invite_codes (code, creator_type, usage_limit, expires_at)
      VALUES (?, 'admin', ?, ?)
    `;
    const [result] = await pool.query(query, [code, usageLimit, expiresAt]);
    return result.insertId;
  }

  // 创建邀请码（用户）
  static async createByUser(userId, code, usageLimit = 1) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 检查用户邀请码额度
      const [users] = await connection.query(
        'SELECT invite_quota FROM users WHERE id = ?',
        [userId]
      );

      if (users.length === 0 || users[0].invite_quota <= 0) {
        throw new Error('邀请码额度不足');
      }

      // 创建邀请码
      await connection.query(
        `INSERT INTO invite_codes (code, created_by, creator_type, usage_limit)
         VALUES (?, ?, 'user', ?)`,
        [code, userId, usageLimit]
      );

      // 减少用户额度
      await connection.query(
        'UPDATE users SET invite_quota = invite_quota - 1, invites_sent = invites_sent + 1 WHERE id = ?',
        [userId]
      );

      await connection.commit();
      return code;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // 验证邀请码
  static async validate(code) {
    const query = `
      SELECT * FROM invite_codes
      WHERE code = ? AND is_active = TRUE
    `;
    const [rows] = await pool.query(query, [code]);

    if (rows.length === 0) {
      return { valid: false, message: '邀请码不存在' };
    }

    const invite = rows[0];

    // 检查是否过期
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return { valid: false, message: '邀请码已过期' };
    }

    // 检查使用次数
    if (invite.used_count >= invite.usage_limit) {
      return { valid: false, message: '邀请码已达使用上限' };
    }

    return { valid: true, invite };
  }

  // 使用邀请码
  static async use(code, userId) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 验证邀请码
      const validation = await this.validate(code);
      if (!validation.valid) {
        throw new Error(validation.message);
      }

      const invite = validation.invite;

      // 更新邀请码使用次数
      await connection.query(
        'UPDATE invite_codes SET used_count = used_count + 1 WHERE code = ?',
        [code]
      );

      // 更新用户状态
      await connection.query(
        `UPDATE users
         SET access_level = 'full',
             invite_code_used = ?,
             invited_by = ?,
             access_granted_at = NOW()
         WHERE id = ?`,
        [code, invite.created_by, userId]
      );

      // 如果邀请码有创建者，增加其邀请成功数
      if (invite.created_by) {
        await connection.query(
          'UPDATE users SET invites_accepted = invites_accepted + 1 WHERE id = ?',
          [invite.created_by]
        );
      }

      await connection.commit();
      return { invitedBy: invite.created_by };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // 获取用户创建的邀请码
  static async getUserCodes(userId) {
    const query = `
      SELECT
        ic.*,
        GROUP_CONCAT(
          CONCAT(u.nickname, '|', DATE_FORMAT(u.access_granted_at, '%Y-%m-%d %H:%i'))
          SEPARATOR ';;'
        ) as used_by_info
      FROM invite_codes ic
      LEFT JOIN users u ON u.invite_code_used = ic.code AND u.invited_by = ic.created_by
      WHERE ic.created_by = ?
      GROUP BY ic.id
      ORDER BY ic.created_at DESC
    `;
    const [rows] = await pool.query(query, [userId]);

    // 解析 used_by_info
    return rows.map(row => {
      const usedBy = [];
      if (row.used_by_info) {
        const infos = row.used_by_info.split(';;');
        infos.forEach(info => {
          const [nickname, usedAt] = info.split('|');
          if (nickname && usedAt) {
            usedBy.push({ nickname, usedAt });
          }
        });
      }
      delete row.used_by_info;
      return { ...row, usedBy };
    });
  }

  // 获取邀请码详情
  static async getByCode(code) {
    const query = 'SELECT * FROM invite_codes WHERE code = ?';
    const [rows] = await pool.query(query, [code]);
    return rows[0];
  }
}

module.exports = InviteCode;
