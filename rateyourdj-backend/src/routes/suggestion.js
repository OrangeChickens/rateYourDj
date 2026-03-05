const express = require('express');
const router = express.Router();
const { authenticate, optionalAuth } = require('../middleware/auth');
const {
  createSuggestion,
  getSuggestions,
  voteSuggestion,
  deleteSuggestion
} = require('../controllers/suggestionController');

// 创建建议（需要登录）
router.post('/create', authenticate, createSuggestion);

// 获取建议列表（可选登录，登录用户返回投票状态）
router.get('/list', optionalAuth, getSuggestions);

// 投票（需要登录）
router.post('/:id/vote', authenticate, voteSuggestion);

// 删除建议（需要登录）
router.delete('/:id', authenticate, deleteSuggestion);

module.exports = router;
