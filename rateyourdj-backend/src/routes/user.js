const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getUserProfile,
  getFavorites,
  toggleFavorite,
  getUserReviews,
  getSearchHistory
} = require('../controllers/userController');

// 获取用户资料（需要登录）
router.get('/profile', authenticate, getUserProfile);

// 获取收藏列表（需要登录）
router.get('/favorites', authenticate, getFavorites);

// 收藏/取消收藏DJ（需要登录）
router.post('/favorite/:djId', authenticate, toggleFavorite);

// 获取用户的评论历史（需要登录）
router.get('/reviews', authenticate, getUserReviews);

// 获取搜索历史（需要登录）
router.get('/search-history', authenticate, getSearchHistory);

module.exports = router;
