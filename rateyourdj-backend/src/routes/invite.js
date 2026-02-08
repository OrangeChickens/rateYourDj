// routes/invite.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const inviteController = require('../controllers/inviteController');

// 所有邀请码路由都需要认证
router.use(authenticate);

// 生成个人邀请码
router.post('/generate', inviteController.generateCode);

// 获取我的邀请码列表
router.get('/my-codes', inviteController.getMyCodes);

// 验证邀请码
router.post('/validate', inviteController.validateCode);

module.exports = router;
