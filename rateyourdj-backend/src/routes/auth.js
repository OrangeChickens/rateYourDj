const express = require('express');
const router = express.Router();
const { wechatLogin, checkUser } = require('../controllers/authController');

// 预检查用户状态
router.post('/check-user', checkUser);

// 微信登录
router.post('/login', wechatLogin);

module.exports = router;
