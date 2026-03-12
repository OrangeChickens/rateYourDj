// controllers/commentController.js
const Comment = require('../models/Comment');
const { msgSecCheck } = require('../services/wechatService');

/**
 * 创建评论
 */
exports.createComment = async (req, res, next) => {
  try {
    const { reviewId, content, parentCommentId } = req.body;
    const userId = req.user.userId;

    console.log(`📥 接收到创建评论请求:`, {
      reviewId,
      reviewIdType: typeof reviewId,
      content,
      parentCommentId,
      parentCommentIdType: typeof parentCommentId,
      userId
    });

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

    // 微信内容安全检测
    const wxCheckResult = await msgSecCheck(content.trim(), req.user.openid);
    const commentStatus = wxCheckResult.safe ? 'approved' : 'pending';

    if (commentStatus === 'pending') {
      console.log(`⚠️ [Content Check] Comment flagged as pending:`, {
        userId,
        reviewId,
        wxLabel: wxCheckResult.label
      });
    }

    // 创建评论
    const comment = await Comment.create(reviewId, userId, content.trim(), parentCommentId, commentStatus);

    res.json({
      success: true,
      data: comment,
      message: commentStatus === 'approved' ? undefined : '评论已提交，待审核后展示'
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
    const userId = req.user?.userId || null; // 获取当前用户ID（可能未登录）

    const result = await Comment.findByReviewId(reviewId, {
      page: parseInt(page),
      limit: parseInt(limit),
      sort,
      order,
      userId // 传递用户ID以获取投票状态
    });

    console.log(`📊 评论原始数据 (reviewId=${reviewId}):`, JSON.stringify(result.data, null, 2));

    // 构建嵌套树结构
    const nestedComments = Comment.buildNestedTree(result.data);

    console.log(`🌲 嵌套结构:`, JSON.stringify(nestedComments, null, 2));

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

/**
 * 获取所有评论（管理员）
 */
exports.getAllComments = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, filter = 'pending' } = req.query;

    const result = await Comment.getAllComments({
      page: parseInt(page),
      limit: parseInt(limit),
      filter
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('获取所有评论失败:', error);
    next(error);
  }
};

/**
 * 更新评论状态（管理员）
 */
exports.updateCommentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: '无效的状态值，仅支持 approved 或 rejected'
      });
    }

    await Comment.updateStatus(id, status);

    res.json({
      success: true,
      message: '状态更新成功'
    });
  } catch (error) {
    if (error.message === '评论不存在') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    console.error('更新评论状态失败:', error);
    next(error);
  }
};

/**
 * 获取 pending 评论数量（管理员）
 */
exports.getPendingCommentCount = async (req, res, next) => {
  try {
    const count = await Comment.getPendingCount();

    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('获取待审核评论数量失败:', error);
    next(error);
  }
};

module.exports = exports;
