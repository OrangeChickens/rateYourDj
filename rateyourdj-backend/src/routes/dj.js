const express = require('express');
const router = express.Router();
const { optionalAuth, requireAdmin } = require('../middleware/auth');
const {
  getDJList,
  getDJDetail,
  searchDJs,
  getHotDJs,
  getCities,
  getLabels,
  createDJ,
  updateDJ
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

// 获取所有厂牌
router.get('/labels/all', getLabels);

// 创建DJ（仅管理员）
router.post('/create', requireAdmin, createDJ);

// 更新DJ（仅管理员）
router.put('/:id', requireAdmin, updateDJ);

module.exports = router;
