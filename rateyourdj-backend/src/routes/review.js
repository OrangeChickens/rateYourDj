const express = require('express');
const router = express.Router();
const { authenticate, optionalAuth } = require('../middleware/auth');
const {
  createReview,
  getDJReviews,
  deleteReview,
  markReviewHelpful,
  markNotHelpful,
  reportReview,
  getAllReviews
} = require('../controllers/reviewController');

// 创建评论（需要登录）
router.post('/create', authenticate, createReview);

// 获取所有评价列表（无需登录）
router.get('/all', getAllReviews);

// 获取DJ的评论列表（可选登录，登录用户返回投票状态）
router.get('/list/:djId', optionalAuth, getDJReviews);

// 删除评论（需要登录）
router.delete('/:id', authenticate, deleteReview);

// 标记评论有帮助（需要登录）
router.post('/:id/helpful', authenticate, markReviewHelpful);

// 标记评论没帮助（需要登录）
router.post('/:id/not-helpful', authenticate, markNotHelpful);

// 举报评论（需要登录）
router.post('/:id/report', authenticate, reportReview);

module.exports = router;
