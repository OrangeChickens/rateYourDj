// routes/task.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const taskController = require('../controllers/taskController');

// 所有任务路由都需要认证
router.use(authenticate);

// 获取任务列表
router.get('/list', taskController.getTaskList);

// 领取任务奖励
router.post('/claim', taskController.claimReward);

// 获取任务统计
router.get('/stats', taskController.getTaskStats);

module.exports = router;
