// routes/comment.js
const express = require('express');
const router = express.Router();
const { authenticate, optionalAuth, requireAdmin } = require('../middleware/auth');
const commentController = require('../controllers/commentController');

// 管理员：获取所有评论
router.get('/all', requireAdmin, commentController.getAllComments);

// 管理员：获取待审核评论数量
router.get('/pending/count', requireAdmin, commentController.getPendingCommentCount);

// 管理员：更新评论状态
router.put('/:id/status', requireAdmin, commentController.updateCommentStatus);

// 创建评论（需要登录）
router.post('/create', authenticate, commentController.createComment);

// 获取评论列表（可选登录，用于获取投票状态）
router.get('/review/:reviewId', optionalAuth, commentController.getReviewComments);

// 删除评论（需要登录）
router.delete('/:id', authenticate, commentController.deleteComment);

// 投票（需要登录）
router.post('/:id/vote', authenticate, commentController.voteComment);

module.exports = router;
