// routes/comment.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const commentController = require('../controllers/commentController');

// 创建评论（需要登录）
router.post('/create', authenticate, commentController.createComment);

// 获取评论列表（无需登录）
router.get('/review/:reviewId', commentController.getReviewComments);

// 删除评论（需要登录）
router.delete('/:id', authenticate, commentController.deleteComment);

// 投票（需要登录）
router.post('/:id/vote', authenticate, commentController.voteComment);

module.exports = router;
