const DJ = require('../models/DJ');

// 获取DJ列表
async function getDJList(req, res, next) {
  try {
    const filters = {
      city: req.query.city,
      style: req.query.style,
      sort: req.query.sort || 'overall_rating',
      order: req.query.order || 'DESC',
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20
    };

    const result = await DJ.getList(filters);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
}

// 获取DJ详情
async function getDJDetail(req, res, next) {
  try {
    const { id } = req.params;

    const dj = await DJ.findById(id);

    if (!dj) {
      return res.status(404).json({
        success: false,
        message: 'DJ不存在'
      });
    }

    res.json({
      success: true,
      data: dj
    });
  } catch (error) {
    next(error);
  }
}

// 搜索DJ
async function searchDJs(req, res, next) {
  try {
    const { keyword } = req.query;

    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: '请输入搜索关键词'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await DJ.search(keyword, page, limit);

    // 保存搜索历史（如果用户已登录）
    if (req.user) {
      const { pool } = require('../config/database');
      await pool.query(
        'INSERT INTO search_history (user_id, keyword) VALUES (?, ?)',
        [req.user.userId, keyword]
      );
    }

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
}

// 获取热门DJ
async function getHotDJs(req, res, next) {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const djs = await DJ.getHotDJs(limit);

    res.json({
      success: true,
      data: djs
    });
  } catch (error) {
    next(error);
  }
}

// 获取所有城市
async function getCities(req, res, next) {
  try {
    const cities = await DJ.getCities();

    res.json({
      success: true,
      data: cities
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDJList,
  getDJDetail,
  searchDJs,
  getHotDJs,
  getCities
};
