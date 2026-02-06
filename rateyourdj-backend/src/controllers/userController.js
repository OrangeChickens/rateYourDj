const User = require('../models/User');
const Review = require('../models/Review');
const { pool } = require('../config/database');

// 获取用户资料
async function getUserProfile(req, res, next) {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 获取用户统计信息
    const [reviewCount] = await pool.query(
      'SELECT COUNT(*) as count FROM reviews WHERE user_id = ?',
      [req.user.userId]
    );

    const [favoriteCount] = await pool.query(
      'SELECT COUNT(*) as count FROM favorites WHERE user_id = ?',
      [req.user.userId]
    );

    res.json({
      success: true,
      data: {
        id: user.id,
        nickname: user.nickname,
        avatar_url: user.avatar_url,
        role: user.role || 'user',
        review_count: reviewCount[0].count,
        favorite_count: favoriteCount[0].count,
        created_at: user.created_at
      }
    });
  } catch (error) {
    next(error);
  }
}

// 获取用户的收藏列表
async function getFavorites(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const [favorites] = await pool.query(
      `SELECT f.*, d.*
       FROM favorites f
       JOIN djs d ON f.dj_id = d.id
       WHERE f.user_id = ?
       ORDER BY f.created_at DESC
       LIMIT ? OFFSET ?`,
      [req.user.userId, limit, offset]
    );

    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM favorites WHERE user_id = ?',
      [req.user.userId]
    );

    res.json({
      success: true,
      data: favorites,
      pagination: {
        page,
        limit,
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
}

// 收藏/取消收藏DJ
async function toggleFavorite(req, res, next) {
  try {
    const { djId } = req.params;

    // 检查是否已收藏
    const [existing] = await pool.query(
      'SELECT * FROM favorites WHERE user_id = ? AND dj_id = ?',
      [req.user.userId, djId]
    );

    if (existing.length > 0) {
      // 取消收藏
      await pool.query(
        'DELETE FROM favorites WHERE user_id = ? AND dj_id = ?',
        [req.user.userId, djId]
      );

      res.json({
        success: true,
        message: '已取消收藏',
        data: { is_favorite: false }
      });
    } else {
      // 添加收藏
      await pool.query(
        'INSERT INTO favorites (user_id, dj_id) VALUES (?, ?)',
        [req.user.userId, djId]
      );

      res.json({
        success: true,
        message: '收藏成功',
        data: { is_favorite: true }
      });
    }
  } catch (error) {
    next(error);
  }
}

// 获取用户的评论历史
async function getUserReviews(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await Review.findByUserId(req.user.userId, page, limit);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
}

// 获取搜索历史
async function getSearchHistory(req, res, next) {
  try {
    const [history] = await pool.query(
      `SELECT DISTINCT keyword
       FROM search_history
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 10`,
      [req.user.userId]
    );

    res.json({
      success: true,
      data: history.map(h => h.keyword)
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getUserProfile,
  getFavorites,
  toggleFavorite,
  getUserReviews,
  getSearchHistory
};
