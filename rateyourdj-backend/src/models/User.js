const { pool } = require('../config/database');

// 辅助函数：将 HTTP URL 转换为 HTTPS（微信小程序要求）
function convertToHttps(url) {
  if (!url) return url;
  if (typeof url === 'string' && url.startsWith('http://')) {
    return url.replace('http://', 'https://');
  }
  return url;
}

// 辅助函数：处理用户对象，转换图片 URL
function processUser(user) {
  if (!user) return user;
  if (user.avatar_url) {
    user.avatar_url = convertToHttps(user.avatar_url);
  }
  return user;
}

class User {
  // 通过 openid 查找用户
  static async findByOpenid(openid) {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE wx_openid = ?',
      [openid]
    );
    return processUser(rows[0]);
  }

  // 通过 ID 查找用户
  static async findById(id) {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
    return processUser(rows[0]);
  }

  // 创建新用户
  static async create(userData) {
    const { wx_openid, wx_unionid, nickname, avatar_url } = userData;
    // 转换 avatar_url 为 HTTPS
    const httpsAvatarUrl = convertToHttps(avatar_url);

    const [result] = await pool.query(
      'INSERT INTO users (wx_openid, wx_unionid, nickname, avatar_url) VALUES (?, ?, ?, ?)',
      [wx_openid, wx_unionid, nickname, httpsAvatarUrl]
    );
    return this.findById(result.insertId);
  }

  // 更新用户信息
  static async update(id, userData) {
    const { nickname, avatar_url } = userData;
    // 转换 avatar_url 为 HTTPS
    const httpsAvatarUrl = convertToHttps(avatar_url);

    await pool.query(
      'UPDATE users SET nickname = ?, avatar_url = ? WHERE id = ?',
      [nickname, httpsAvatarUrl, id]
    );
    return this.findById(id);
  }
}

module.exports = User;
