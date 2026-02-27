const express = require('express');
const router = express.Router();
const { authenticate, optionalAuth, requireAdmin } = require('../middleware/auth');
const {
  getDJList,
  getDJDetail,
  searchDJs,
  getHotDJs,
  getCities,
  getLabels,
  createDJ,
  updateDJ,
  submitDJ,
  getPendingDJs,
  approveDJ,
  rejectDJ
} = require('../controllers/djController');

// 获取DJ列表（支持筛选、排序）
router.get('/list', getDJList);

// 搜索DJ（可选登录，用于保存搜索历史）
router.get('/search/query', optionalAuth, searchDJs);

// 获取热门DJ
router.get('/hot/list', getHotDJs);

// 获取所有城市
router.get('/cities/all', getCities);

// 获取所有厂牌
router.get('/labels/all', getLabels);

// 用户提交DJ（需登录）
router.post('/submit', authenticate, submitDJ);

// 获取待审核DJ列表（仅管理员）
router.get('/pending/list', requireAdmin, getPendingDJs);

// 创建DJ（仅管理员）
router.post('/create', requireAdmin, createDJ);

// 审核通过DJ（仅管理员）
router.put('/:id/approve', requireAdmin, approveDJ);

// 拒绝DJ（仅管理员）
router.put('/:id/reject', requireAdmin, rejectDJ);

// 更新DJ（仅管理员）
router.put('/:id', requireAdmin, updateDJ);

// 获取DJ详情（放最后，避免 /:id 匹配到其他路由）
router.get('/:id', getDJDetail);

module.exports = router;
