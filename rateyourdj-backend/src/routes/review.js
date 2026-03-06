const express = require('express');
const router = express.Router();
const { authenticate, optionalAuth, requireAdmin } = require('../middleware/auth');
const {
  createReview,
  getDJReviews,
  deleteReview,
  markReviewHelpful,
  markNotHelpful,
  reportReview,
  getAllReviews,
  updateReviewStatus,
  getReportedCount,
  getPendingReviewCount
} = require('../controllers/reviewController');

// 创建评论（需要登录）
router.post('/create', authenticate, createReview);

// 获取所有评价列表（可选登录，管理员可看全部状态）
router.get('/all', optionalAuth, getAllReviews);

// 获取被举报评价数量（管理员）
router.get('/reported/count', requireAdmin, getReportedCount);

// 获取待审核评价数量（管理员）
router.get('/pending/count', requireAdmin, getPendingReviewCount);

// 获取DJ的评论列表（可选登录，登录用户返回投票状态）
router.get('/list/:djId', optionalAuth, getDJReviews);

// 更新评价状态（管理员）
router.put('/:id/status', requireAdmin, updateReviewStatus);

// 删除评论（需要登录）
router.delete('/:id', authenticate, deleteReview);

// 标记评论有帮助（需要登录）
router.post('/:id/helpful', authenticate, markReviewHelpful);

// 标记评论没帮助（需要登录）
router.post('/:id/not-helpful', authenticate, markNotHelpful);

// 举报评论（需要登录）
router.post('/:id/report', authenticate, reportReview);

module.exports = router;
