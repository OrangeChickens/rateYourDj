const Suggestion = require('../models/Suggestion');
const User = require('../models/User');

// 创建建议
async function createSuggestion(req, res, next) {
  try {
    const { content } = req.body;

    if (!content || content.trim().length < 1) {
      return res.status(400).json({
        success: false,
        message: '请输入建议内容'
      });
    }

    const suggestion = await Suggestion.create(req.user.userId, content.trim());

    res.status(201).json({
      success: true,
      message: '建议提交成功',
      data: suggestion
    });
  } catch (error) {
    next(error);
  }
}

// 获取建议列表
async function getSuggestions(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const userId = req.user ? req.user.userId : null;

    // 检查是否管理员
    let isAdmin = false;
    if (userId) {
      const user = await User.findById(userId);
      isAdmin = user && user.role === 'admin';
    }

    const result = await Suggestion.getList(page, limit, userId, isAdmin);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
}

// 投票
async function voteSuggestion(req, res, next) {
  try {
    const { id } = req.params;
    const { voteType } = req.body;

    if (!['up', 'down'].includes(voteType)) {
      return res.status(400).json({
        success: false,
        message: '无效的投票类型'
      });
    }

    await Suggestion.vote(id, req.user.userId, voteType);

    res.json({
      success: true,
      message: '投票成功'
    });
  } catch (error) {
    next(error);
  }
}

// 删除建议
async function deleteSuggestion(req, res, next) {
  try {
    const { id } = req.params;

    await Suggestion.delete(id, req.user.userId);

    res.json({
      success: true,
      message: '建议已删除'
    });
  } catch (error) {
    next(error);
  }
}

// 更新建议状态（管理员）
async function updateSuggestionStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: '请提供状态值'
      });
    }

    await Suggestion.updateStatus(id, status);

    res.json({
      success: true,
      message: '状态更新成功'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createSuggestion,
  getSuggestions,
  voteSuggestion,
  deleteSuggestion,
  updateSuggestionStatus
};
