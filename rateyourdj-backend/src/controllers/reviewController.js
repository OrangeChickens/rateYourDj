const Review = require('../models/Review');
const DJ = require('../models/DJ');
const { updateDJRatings } = require('../services/ratingService');
const TaskService = require('../services/taskService');
const { checkContent } = require('../services/contentCheckService');

// 创建评论
async function createReview(req, res, next) {
  try {
    const {
      dj_id,
      overall_rating,
      set_rating,
      performance_rating,
      personality_rating,
      would_choose_again,
      comment,
      tags,
      is_anonymous
    } = req.body;

    // 验证必填字段
    if (!dj_id || !overall_rating || !set_rating || !performance_rating || !personality_rating) {
      return res.status(400).json({
        success: false,
        message: '请填写所有评分项'
      });
    }

    // 验证评分范围
    const ratings = [overall_rating, set_rating, performance_rating, personality_rating];
    if (ratings.some(r => r < 1 || r > 5)) {
      return res.status(400).json({
        success: false,
        message: '评分必须在1-5之间'
      });
    }

    // 验证评价内容（评价必须至少10个字）
    if (!comment || comment.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: '评价内容至少需要10个字'
      });
    }

    if (comment.trim().length > 500) {
      return res.status(400).json({
        success: false,
        message: '评价内容不能超过500字'
      });
    }

    // 验证DJ是否存在
    const dj = await DJ.findById(dj_id);
    if (!dj) {
      return res.status(404).json({
        success: false,
        message: 'DJ不存在'
      });
    }

    // 内容检测
    const contentResult = checkContent(comment);
    const reviewStatus = contentResult.safe ? 'approved' : 'pending';

    if (!contentResult.safe) {
      console.log(`⚠️ [Content Check] Review flagged:`, {
        userId: req.user.userId,
        djId: dj_id,
        category: contentResult.category,
        matched: contentResult.matched
      });
    }

    // 创建评论
    const review = await Review.create({
      dj_id,
      user_id: req.user.userId,
      is_anonymous: is_anonymous || false,
      overall_rating,
      set_rating,
      performance_rating,
      personality_rating,
      would_choose_again: would_choose_again || false,
      comment: comment || null,
      tags: tags || [],
      status: reviewStatus
    });

    // 只有approved的评价才计入评分
    if (reviewStatus === 'approved') {
      await updateDJRatings(dj_id);
    }

    // 更新任务进度（异步，不阻塞响应）
    console.log(`📝 [Review Debug] 准备更新任务进度:`, { userId: req.user.userId, reviewId: review.id, commentLength: comment?.length });
    TaskService.updateReviewTasks(req.user.userId, comment).catch(err => {
      console.error('❌ [Review Debug] 更新任务进度失败:', err);
    });

    res.status(201).json({
      success: true,
      message: reviewStatus === 'approved' ? '评论创建成功' : '评论已提交，待审核后展示',
      data: { ...review, status: reviewStatus }
    });
  } catch (error) {
    next(error);
  }
}

// 获取DJ的评论列表
async function getDJReviews(req, res, next) {
  try {
    const { djId } = req.params;
    const userId = req.user ? req.user.userId : null;
    const options = {
      sort: req.query.sort || 'created_at',
      order: req.query.order || 'DESC',
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20
    };

    const result = await Review.findByDJId(djId, options, userId);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
}

// 删除评论
async function deleteReview(req, res, next) {
  try {
    const { id } = req.params;

    // 获取评论信息以便后续更新DJ评分
    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: '评论不存在'
      });
    }

    const djId = review.dj_id;

    // 删除评论
    await Review.delete(id, req.user.userId);

    // 更新DJ评分
    await updateDJRatings(djId);

    res.json({
      success: true,
      message: '评论删除成功'
    });
  } catch (error) {
    next(error);
  }
}

// 评论互动（有帮助）
async function markReviewHelpful(req, res, next) {
  try {
    const { id } = req.params;

    // 获取评论信息，以便更新评论作者的任务进度
    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: '评论不存在'
      });
    }

    await Review.interact(id, req.user.userId, 'helpful');

    // 更新评论作者的任务进度（异步，不阻塞响应）
    if (review.user_id !== req.user.userId) {
      TaskService.updateHelpfulTasks(review.user_id).catch(err => {
        console.error('更新任务进度失败:', err);
      });
    }

    res.json({
      success: true,
      message: '操作成功'
    });
  } catch (error) {
    next(error);
  }
}

// 举报评论
async function reportReview(req, res, next) {
  try {
    const { id } = req.params;

    await Review.interact(id, req.user.userId, 'report');

    res.json({
      success: true,
      message: '举报成功，我们会尽快处理'
    });
  } catch (error) {
    next(error);
  }
}

// 评论互动（没帮助）
async function markNotHelpful(req, res, next) {
  try {
    const { id } = req.params;

    await Review.interact(id, req.user.userId, 'not_helpful');

    res.json({
      success: true,
      message: '已标记'
    });
  } catch (error) {
    next(error);
  }
}

// 获取所有评价（用于"所有评价"页面）
async function getAllReviews(req, res, next) {
  try {
    const { page = 1, limit = 20, sort = 'created_at', order = 'DESC', status, filter } = req.query;

    // 检查是否管理员
    let isAdmin = false;
    if (req.user) {
      const User = require('../models/User');
      const user = await User.findById(req.user.userId);
      isAdmin = user && user.role === 'admin';
    }

    const result = await Review.getAllReviews({
      page: parseInt(page),
      limit: parseInt(limit),
      sort,
      order,
      isAdmin: isAdmin && status === 'all',
      filter: isAdmin ? filter : null
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
}

// 更新评价状态（管理员）
async function updateReviewStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的状态值 (pending/approved/rejected)'
      });
    }

    const { djId } = await Review.updateStatus(id, status);

    // 重新计算DJ评分
    await updateDJRatings(djId);

    res.json({
      success: true,
      message: '评价状态更新成功'
    });
  } catch (error) {
    next(error);
  }
}

// 获取被举报评价数量（管理员）
async function getReportedCount(req, res, next) {
  try {
    const count = await Review.getReportedCount();
    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createReview,
  getDJReviews,
  deleteReview,
  markReviewHelpful,
  markNotHelpful,
  reportReview,
  getAllReviews,
  updateReviewStatus,
  getReportedCount
};
