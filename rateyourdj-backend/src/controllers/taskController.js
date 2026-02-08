// controllers/taskController.js
const UserTask = require('../models/UserTask');
const TaskConfig = require('../models/TaskConfig');
const User = require('../models/User');

// 获取用户任务列表
exports.getTaskList = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    // 获取用户信息
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    // 获取用户所有任务
    const tasks = await UserTask.getUserTasks(userId);

    // 按分类分组
    const groupedTasks = {
      beginner: [],
      advanced: [],
      vip: []
    };

    tasks.forEach(task => {
      // 判断是否可以领取奖励
      const canClaim = task.completed && !task.reward_claimed;

      const taskData = {
        code: task.task_code,
        name: task.task_name,
        desc: task.task_desc,
        icon: task.icon,
        progress: task.progress,
        target: task.target,
        reward: task.reward_invites,
        completed: task.completed,
        canClaim,
        repeatable: task.repeatable,
        repeatCount: task.repeat_count,
        maxRepeats: task.max_repeats
      };

      groupedTasks[task.task_category].push(taskData);
    });

    res.json({
      success: true,
      accessLevel: user.access_level,
      inviteQuota: user.invite_quota,
      invitesSent: user.invites_sent,
      invitesAccepted: user.invites_accepted,
      tasks: groupedTasks
    });
  } catch (error) {
    console.error('获取任务列表失败:', error);
    next(error);
  }
};

// 领取任务奖励
exports.claimReward = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { taskCode } = req.body;

    if (!taskCode) {
      return res.status(400).json({ success: false, message: '缺少任务代码' });
    }

    // 领取奖励
    const rewardInvites = await UserTask.claimReward(userId, taskCode);

    // 获取用户最新额度
    const user = await User.findById(userId);

    res.json({
      success: true,
      reward: rewardInvites,
      newQuota: user.invite_quota,
      message: `获得 ${rewardInvites} 个邀请码！`
    });
  } catch (error) {
    console.error('领取奖励失败:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// 获取任务统计
exports.getTaskStats = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const stats = await UserTask.getStats(userId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('获取任务统计失败:', error);
    next(error);
  }
};
