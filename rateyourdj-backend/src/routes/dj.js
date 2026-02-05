const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth');
const {
  getDJList,
  getDJDetail,
  searchDJs,
  getHotDJs,
  getCities
} = require('../controllers/djController');

// 获取DJ列表（支持筛选、排序）
router.get('/list', getDJList);

// 获取DJ详情
router.get('/:id', getDJDetail);

// 搜索DJ（可选登录，用于保存搜索历史）
router.get('/search/query', optionalAuth, searchDJs);

// 获取热门DJ
router.get('/hot/list', getHotDJs);

// 获取所有城市
router.get('/cities/all', getCities);

module.exports = router;
