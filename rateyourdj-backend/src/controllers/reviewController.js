const Review = require('../models/Review');
const DJ = require('../models/DJ');
const { updateDJRatings } = require('../services/ratingService');
const TaskService = require('../services/taskService');

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

    // 验证DJ是否存在
    const dj = await DJ.findById(dj_id);
    if (!dj) {
      return res.status(404).json({
        success: false,
        message: 'DJ不存在'
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
      tags: tags || []
    });

    // 更新DJ评分
    await updateDJRatings(dj_id);

    // 更新任务进度（异步，不阻塞响应）
    TaskService.updateReviewTasks(req.user.userId, comment).catch(err => {
      console.error('更新任务进度失败:', err);
    });

    res.status(201).json({
      success: true,
      message: '评论创建成功',
      data: review
    });
  } catch (error) {
    next(error);
  }
}

// 获取DJ的评论列表
async function getDJReviews(req, res, next) {
  try {
    const { djId } = req.params;
    const options = {
      sort: req.query.sort || 'created_at',
      order: req.query.order || 'DESC',
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20
    };

    const result = await Review.findByDJId(djId, options);

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

module.exports = {
  createReview,
  getDJReviews,
  deleteReview,
  markReviewHelpful,
  reportReview
};
