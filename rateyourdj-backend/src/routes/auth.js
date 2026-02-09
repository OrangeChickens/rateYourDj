const express = require('express');
const router = express.Router();
const { wechatLogin, checkUser, useInviteCode, checkAccess, verifyInviteCode } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// 预检查用户状态
router.post('/check-user', checkUser);

// 微信登录
router.post('/login', wechatLogin);

// 验证邀请码（公开接口，无需认证）
router.post('/verify-invite-code', verifyInviteCode);

// 使用邀请码（需要认证）
router.post('/use-invite-code', authenticate, useInviteCode);

// 检查访问权限（需要认证）
router.get('/check-access', authenticate, checkAccess);

module.exports = router;
