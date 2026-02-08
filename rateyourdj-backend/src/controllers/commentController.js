// controllers/commentController.js
const Comment = require('../models/Comment');

/**
 * 创建评论
 */
exports.createComment = async (req, res, next) => {
  try {
    const { reviewId, content, parentCommentId } = req.body;
    const userId = req.user.userId;

    // 验证内容
    if (!reviewId) {
      return res.status(400).json({
        success: false,
        message: '缺少评价ID'
      });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: '评论内容不能为空'
      });
    }

    if (content.trim().length > 500) {
      return res.status(400).json({
        success: false,
        message: '评论内容不能超过500字'
      });
    }

    // 检查嵌套深度（最多 3 层）
    if (parentCommentId) {
      const depth = await Comment.getCommentDepth(parentCommentId);
      if (depth >= 2) {  // depth 2 表示已经是第3层，不能再嵌套
        return res.status(400).json({
          success: false,
          message: '回复层级已达上限'
        });
      }
    }

    // 创建评论
    const comment = await Comment.create(reviewId, userId, content.trim(), parentCommentId);

    res.json({
      success: true,
      data: comment
    });
  } catch (error) {
    console.error('创建评论失败:', error);
    next(error);
  }
};

/**
 * 获取评论列表
 */
exports.getReviewComments = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { page = 1, limit = 20, sort = 'created_at', order = 'DESC' } = req.query;

    const result = await Comment.findByReviewId(reviewId, {
      page: parseInt(page),
      limit: parseInt(limit),
      sort,
      order
    });

    // 构建嵌套树结构
    const nestedComments = Comment.buildNestedTree(result.data);

    res.json({
      success: true,
      data: nestedComments,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('获取评论列表失败:', error);
    next(error);
  }
};

/**
 * 删除评论
 */
exports.deleteComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    await Comment.delete(id, userId);

    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除评论失败:', error);

    if (error.message === '评论不存在') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message === '无权删除此评论') {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }

    next(error);
  }
};

/**
 * 投票
 */
exports.voteComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { voteType } = req.body;
    const userId = req.user.userId;

    // 验证投票类型
    if (!['upvote', 'downvote'].includes(voteType)) {
      return res.status(400).json({
        success: false,
        message: '无效的投票类型'
      });
    }

    await Comment.vote(id, userId, voteType);

    res.json({
      success: true,
      message: '投票成功'
    });
  } catch (error) {
    console.error('投票失败:', error);
    next(error);
  }
};

module.exports = exports;
