const { pool } = require('../config/database');

// 辅助函数：将 HTTP URL 转换为 HTTPS（微信小程序要求）
function convertToHttps(url) {
  if (!url) return url;
  if (typeof url === 'string' && url.startsWith('http://')) {
    return url.replace('http://', 'https://');
  }
  return url;
}

// 辅助函数：处理 DJ 对象，转换图片 URL
function processDJ(dj) {
  if (!dj) return dj;
  if (dj.photo_url) {
    dj.photo_url = convertToHttps(dj.photo_url);
  }
  return dj;
}

// 辅助函数：处理 DJ 数组
function processDJArray(djs) {
  return djs.map(dj => processDJ(dj));
}

class DJ {
  // 获取DJ列表（支持筛选、排序、分页）
  static async getList(filters = {}) {
    const { city, style, letter, sort = 'weighted_score', order = 'DESC', page = 1, limit = 20 } = filters;

    let query = 'SELECT * FROM djs WHERE 1=1';
    const params = [];

    // 城市筛选
    if (city) {
      query += ' AND city = ?';
      params.push(city);
    }

    // 音乐风格筛选
    if (style) {
      query += ' AND music_style LIKE ?';
      params.push(`%${style}%`);
    }

    // 首字母筛选
    if (letter) {
      if (letter === '#') {
        // 数字开头
        query += ' AND (name REGEXP \'^[0-9]\' OR SUBSTRING(name, 1, 1) BETWEEN \'0\' AND \'9\')';
      } else {
        // 字母开头（不区分大小写）
        query += ' AND UPPER(SUBSTRING(name, 1, 1)) = ?';
        params.push(letter.toUpperCase());
      }
    }

    // 排序
    const allowedSortFields = ['overall_rating', 'review_count', 'created_at', 'weighted_score'];
    const sortField = allowedSortFields.includes(sort) ? sort : 'weighted_score';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    query += ` ORDER BY ${sortField} ${sortOrder}`;

    // 分页
    const offset = (page - 1) * limit;
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [rows] = await pool.query(query, params);

    // 获取总数
    let countQuery = 'SELECT COUNT(*) as total FROM djs WHERE 1=1';
    const countParams = [];
    if (city) {
      countQuery += ' AND city = ?';
      countParams.push(city);
    }
    if (style) {
      countQuery += ' AND music_style LIKE ?';
      countParams.push(`%${style}%`);
    }
    if (letter) {
      if (letter === '#') {
        countQuery += ' AND (name REGEXP \'^[0-9]\' OR SUBSTRING(name, 1, 1) BETWEEN \'0\' AND \'9\')';
      } else {
        countQuery += ' AND UPPER(SUBSTRING(name, 1, 1)) = ?';
        countParams.push(letter.toUpperCase());
      }
    }

    const [countResult] = await pool.query(countQuery, countParams);
    const total = countResult[0].total;

    return {
      data: processDJArray(rows),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // 通过ID获取DJ详情
  static async findById(id) {
    const [rows] = await pool.query(
      'SELECT * FROM djs WHERE id = ?',
      [id]
    );
    return processDJ(rows[0]);
  }

  // 搜索DJ
  static async search(keyword, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const [rows] = await pool.query(
      `SELECT * FROM djs
       WHERE name LIKE ? OR city LIKE ? OR label LIKE ? OR music_style LIKE ?
       ORDER BY weighted_score DESC
       LIMIT ? OFFSET ?`,
      [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`, parseInt(limit), parseInt(offset)]
    );

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM djs
       WHERE name LIKE ? OR city LIKE ? OR label LIKE ? OR music_style LIKE ?`,
      [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`]
    );

    return {
      data: processDJArray(rows),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    };
  }

  // 获取热门DJ
  static async getHotDJs(limit = 10) {
    const [rows] = await pool.query(
      `SELECT * FROM djs
       ORDER BY weighted_score DESC, review_count DESC
       LIMIT ?`,
      [limit]
    );
    return processDJArray(rows);
  }

  // 获取所有城市及统计
  static async getCities() {
    const [rows] = await pool.query(
      `SELECT city, COUNT(*) as dj_count
       FROM djs
       GROUP BY city
       ORDER BY dj_count DESC`
    );
    return rows;
  }

  // 获取所有厂牌及统计
  static async getLabels() {
    const [rows] = await pool.query(
      `SELECT label, COUNT(*) as dj_count
       FROM djs
       WHERE label IS NOT NULL AND label != ''
       GROUP BY label
       ORDER BY dj_count DESC`
    );
    return rows;
  }

  // 更新DJ评分
  static async updateRatings(id, ratings) {
    const {
      overall_rating,
      set_rating,
      performance_rating,
      personality_rating,
      review_count,
      would_choose_again_percent,
      weighted_score
    } = ratings;

    await pool.query(
      `UPDATE djs SET
       overall_rating = ?,
       set_rating = ?,
       performance_rating = ?,
       personality_rating = ?,
       review_count = ?,
       would_choose_again_percent = ?,
       weighted_score = ?
       WHERE id = ?`,
      [
        overall_rating,
        set_rating,
        performance_rating,
        personality_rating,
        review_count,
        would_choose_again_percent,
        weighted_score,
        id
      ]
    );
  }

  // 创建DJ（管理功能）
  static async create(djData) {
    const { name, city, label, photo_url, music_style } = djData;
    // 转换 photo_url 为 HTTPS
    const httpsPhotoUrl = convertToHttps(photo_url);

    const [result] = await pool.query(
      `INSERT INTO djs (name, city, label, photo_url, music_style)
       VALUES (?, ?, ?, ?, ?)`,
      [name, city, label, httpsPhotoUrl, music_style]
    );
    return this.findById(result.insertId);
  }

  // 更新DJ（管理功能）
  static async update(id, djData) {
    const { name, city, label, photo_url, music_style } = djData;
    // 转换 photo_url 为 HTTPS
    const httpsPhotoUrl = convertToHttps(photo_url);

    await pool.query(
      `UPDATE djs SET
       name = ?,
       city = ?,
       label = ?,
       photo_url = ?,
       music_style = ?
       WHERE id = ?`,
      [name, city, label || null, httpsPhotoUrl || null, music_style || null, id]
    );
    return this.findById(id);
  }
}

module.exports = DJ;
