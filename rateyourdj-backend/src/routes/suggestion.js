const express = require('express');
const router = express.Router();
const { authenticate, optionalAuth, requireAdmin } = require('../middleware/auth');
const {
  createSuggestion,
  getSuggestions,
  voteSuggestion,
  deleteSuggestion,
  updateSuggestionStatus
} = require('../controllers/suggestionController');

// 创建建议（需要登录）
router.post('/create', authenticate, createSuggestion);

// 获取建议列表（可选登录，登录用户返回投票状态）
router.get('/list', optionalAuth, getSuggestions);

// 更新建议状态（管理员）
router.put('/:id/status', requireAdmin, updateSuggestionStatus);

// 投票（需要登录）
router.post('/:id/vote', authenticate, voteSuggestion);

// 删除建议（需要登录）
router.delete('/:id', authenticate, deleteSuggestion);

module.exports = router;
