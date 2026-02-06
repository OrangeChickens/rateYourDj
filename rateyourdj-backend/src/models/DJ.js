const { pool } = require('../config/database');

class DJ {
  // 获取DJ列表（支持筛选、排序、分页）
  static async getList(filters = {}) {
    const { city, style, sort = 'overall_rating', order = 'DESC', page = 1, limit = 20 } = filters;

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

    // 排序
    const allowedSortFields = ['overall_rating', 'review_count', 'created_at'];
    const sortField = allowedSortFields.includes(sort) ? sort : 'overall_rating';
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

    const [countResult] = await pool.query(countQuery, countParams);
    const total = countResult[0].total;

    return {
      data: rows,
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
    return rows[0];
  }

  // 搜索DJ
  static async search(keyword, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const [rows] = await pool.query(
      `SELECT * FROM djs
       WHERE name LIKE ? OR city LIKE ? OR label LIKE ? OR music_style LIKE ?
       ORDER BY overall_rating DESC
       LIMIT ? OFFSET ?`,
      [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`, parseInt(limit), parseInt(offset)]
    );

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM djs
       WHERE name LIKE ? OR city LIKE ? OR label LIKE ? OR music_style LIKE ?`,
      [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`]
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

  // 获取热门DJ
  static async getHotDJs(limit = 10) {
    const [rows] = await pool.query(
      `SELECT * FROM djs
       ORDER BY overall_rating DESC, review_count DESC
       LIMIT ?`,
      [limit]
    );
    return rows;
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

  // 更新DJ评分
  static async updateRatings(id, ratings) {
    const {
      overall_rating,
      set_rating,
      performance_rating,
      personality_rating,
      review_count,
      would_choose_again_percent
    } = ratings;

    await pool.query(
      `UPDATE djs SET
       overall_rating = ?,
       set_rating = ?,
       performance_rating = ?,
       personality_rating = ?,
       review_count = ?,
       would_choose_again_percent = ?
       WHERE id = ?`,
      [
        overall_rating,
        set_rating,
        performance_rating,
        personality_rating,
        review_count,
        would_choose_again_percent,
        id
      ]
    );
  }

  // 创建DJ（管理功能）
  static async create(djData) {
    const { name, city, label, photo_url, music_style } = djData;
    const [result] = await pool.query(
      `INSERT INTO djs (name, city, label, photo_url, music_style)
       VALUES (?, ?, ?, ?, ?)`,
      [name, city, label, photo_url, music_style]
    );
    return this.findById(result.insertId);
  }
}

module.exports = DJ;
