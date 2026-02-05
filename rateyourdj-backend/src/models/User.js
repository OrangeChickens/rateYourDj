const { pool } = require('../config/database');

class User {
  // 通过 openid 查找用户
  static async findByOpenid(openid) {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE wx_openid = ?',
      [openid]
    );
    return rows[0];
  }

  // 通过 ID 查找用户
  static async findById(id) {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  // 创建新用户
  static async create(userData) {
    const { wx_openid, wx_unionid, nickname, avatar_url } = userData;
    const [result] = await pool.query(
      'INSERT INTO users (wx_openid, wx_unionid, nickname, avatar_url) VALUES (?, ?, ?, ?)',
      [wx_openid, wx_unionid, nickname, avatar_url]
    );
    return this.findById(result.insertId);
  }

  // 更新用户信息
  static async update(id, userData) {
    const { nickname, avatar_url } = userData;
    await pool.query(
      'UPDATE users SET nickname = ?, avatar_url = ? WHERE id = ?',
      [nickname, avatar_url, id]
    );
    return this.findById(id);
  }
}

module.exports = User;
