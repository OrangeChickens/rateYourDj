const express = require('express');
const router = express.Router();
const { wechatLogin } = require('../controllers/authController');

// 微信登录
router.post('/login', wechatLogin);

module.exports = router;
