const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  createReview,
  getDJReviews,
  deleteReview,
  markReviewHelpful,
  markNotHelpful,
  reportReview
} = require('../controllers/reviewController');

// 创建评论（需要登录）
router.post('/create', authenticate, createReview);

// 获取DJ的评论列表（无需登录）
router.get('/list/:djId', getDJReviews);

// 删除评论（需要登录）
router.delete('/:id', authenticate, deleteReview);

// 标记评论有帮助（需要登录）
router.post('/:id/helpful', authenticate, markReviewHelpful);

// 标记评论没帮助（需要登录）
router.post('/:id/not-helpful', authenticate, markNotHelpful);

// 举报评论（需要登录）
router.post('/:id/report', authenticate, reportReview);

module.exports = router;
