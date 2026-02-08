// routes/stats.js
const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');

// 获取仪表盘数据（无需登录）
router.get('/dashboard', statsController.getDashboard);

module.exports = router;
