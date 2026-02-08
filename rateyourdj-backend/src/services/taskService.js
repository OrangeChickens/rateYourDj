// services/taskService.js
const UserTask = require('../models/UserTask');
const TaskConfig = require('../models/TaskConfig');

class TaskService {
  // 设置任务进度（覆盖式，直接设置为指定值，用于基于总数的任务）
  async setProgress(userId, taskCode, newProgress) {
    try {
      console.log(`🔄 [Task Debug] setProgress 被调用:`, { userId, taskCode, newProgress });

      // 获取当前任务
      const task = await UserTask.getUserTask(userId, taskCode);

      console.log(`🔍 [Task Debug] 获取任务信息:`, {
        userId,
        taskCode,
        taskExists: !!task,
        taskProgress: task?.progress,
        taskTarget: task?.target,
        taskCompleted: task?.completed,
        taskRepeatable: task?.repeatable
      });

      if (!task) {
        console.log(`⚠️ [Task Debug] 任务 ${taskCode} 不存在，用户 ${userId}`);
        return;
      }

      if (task.completed && !task.repeatable) {
        console.log(`⚠️ [Task Debug] 任务 ${taskCode} 已完成且不可重复`);
        return;
      }

      // 限制进度不超过目标
      const cappedProgress = Math.min(newProgress, task.target);

      console.log(`➡️ [Task Debug] 设置任务进度:`, { userId, taskCode, oldProgress: task.progress, newProgress: cappedProgress, target: task.target });

      // 更新进度
      await UserTask.updateProgress(userId, taskCode, cappedProgress);

      // 检查是否完成
      if (cappedProgress >= task.target) {
        console.log(`🎉 [Task Debug] 任务达到目标，标记完成:`, { userId, taskCode, progress: cappedProgress, target: task.target });
        await this.completeTask(userId, taskCode);
      }
    } catch (error) {
      console.error(`❌ [Task Debug] 设置任务进度失败 (${taskCode}):`, error);
    }
  }

  // 更新任务进度（增量式，每次增加指定值，用于可重复的任务）
  async updateProgress(userId, taskCode, increment = 1) {
    try {
      console.log(`🔄 [Task Debug] updateProgress 被调用:`, { userId, taskCode, increment });

      // 获取当前任务
      const task = await UserTask.getUserTask(userId, taskCode);

      console.log(`🔍 [Task Debug] 获取任务信息:`, {
        userId,
        taskCode,
        taskExists: !!task,
        taskProgress: task?.progress,
        taskTarget: task?.target,
        taskCompleted: task?.completed,
        taskRepeatable: task?.repeatable
      });

      if (!task) {
        console.log(`⚠️ [Task Debug] 任务 ${taskCode} 不存在，用户 ${userId}`);
        return;
      }

      if (task.completed && !task.repeatable) {
        console.log(`⚠️ [Task Debug] 任务 ${taskCode} 已完成且不可重复`);
        return;
      }

      // 计算新进度（增量，限制不超过目标）
      const newProgress = Math.min(task.progress + increment, task.target);

      console.log(`➡️ [Task Debug] 更新任务进度:`, { userId, taskCode, oldProgress: task.progress, increment, newProgress, target: task.target });

      // 更新进度
      await UserTask.updateProgress(userId, taskCode, newProgress);

      // 检查是否完成
      if (newProgress >= task.target) {
        console.log(`🎉 [Task Debug] 任务达到目标，标记完成:`, { userId, taskCode, newProgress, target: task.target });
        await this.completeTask(userId, taskCode);
      }
    } catch (error) {
      console.error(`❌ [Task Debug] 更新任务进度失败 (${taskCode}):`, error);
    }
  }

  // 完成任务
  async completeTask(userId, taskCode) {
    try {
      await UserTask.markCompleted(userId, taskCode);
      console.log(`任务完成: 用户 ${userId}, 任务 ${taskCode}`);

      // TODO: 可以在这里添加推送通知
    } catch (error) {
      console.error(`完成任务失败 (${taskCode}):`, error);
    }
  }

  // 检查并触发 invite_active_user 任务
  async checkInviteActiveUser(inviterId) {
    try {
      console.log(`🎯 [Task Debug] checkInviteActiveUser 被调用:`, { inviterId });
      // 当被邀请的用户完成首次评价时，调用此方法
      await this.updateProgress(inviterId, 'invite_active_user', 1);
      console.log(`✅ [Task Debug] invite_active_user 任务更新成功:`, { inviterId });
    } catch (error) {
      console.error('❌ [Task Debug] 触发 invite_active_user 任务失败:', error);
    }
  }

  // 检查并触发 helpful_received 任务
  async checkHelpfulReceived(reviewAuthorId) {
    try {
      const { pool } = require('../config/database');

      // 计算该用户所有评价的总 helpful_count
      const [result] = await pool.query(
        `SELECT SUM(helpful_count) as total_helpful
         FROM reviews
         WHERE user_id = ? AND status = 'approved'`,
        [reviewAuthorId]
      );

      const totalHelpful = result[0].total_helpful || 0;

      // helpful_received_5: 收到 5 个「有帮助」（覆盖式更新）
      await this.setProgress(reviewAuthorId, 'helpful_received_5', totalHelpful);

      // helpful_received_20: 收到 20 个「有帮助」（覆盖式更新）
      await this.setProgress(reviewAuthorId, 'helpful_received_20', totalHelpful);
    } catch (error) {
      console.error('触发 helpful_received 任务失败:', error);
    }
  }

  // 更新评价相关任务
  async updateReviewTasks(userId, comment = '') {
    try {
      console.log(`🔍 [Task Debug] updateReviewTasks 被调用:`, { userId, commentLength: comment?.length });

      const { pool } = require('../config/database');

      // 获取用户的评价总数（包括当前这条）
      const [[{ reviewCount }]] = await pool.query(
        'SELECT COUNT(*) as reviewCount FROM reviews WHERE user_id = ?',
        [userId]
      );

      console.log(`🔍 [Task Debug] 用户评价总数:`, { userId, reviewCount });

      // first_review: 完成第一次评价
      if (reviewCount === 1) {
        await this.updateProgress(userId, 'first_review', 1);
      }

      // reviews_3: 评价 3 个 DJ（覆盖式更新）
      if (reviewCount <= 3) {
        await this.setProgress(userId, 'reviews_3', reviewCount);
      }

      // reviews_10: 评价 10 个 DJ（覆盖式更新）
      if (reviewCount <= 10) {
        await this.setProgress(userId, 'reviews_10', reviewCount);
      }

      // quality_review: 撰写 30 字以上的优质评价（可重复）
      if (comment && comment.length >= 30) {
        await this.updateProgress(userId, 'quality_review', 1);
      }

      // 检查是否是被邀请用户的首次评价
      const User = require('../models/User');
      const user = await User.findById(userId);

      console.log(`🔍 [Task Debug] 检查被邀请用户:`, {
        userId,
        userExists: !!user,
        invitedBy: user?.invited_by,
        reviewCount,
        shouldTriggerInviteTask: user && user.invited_by && reviewCount === 1
      });

      if (user && user.invited_by && reviewCount === 1) {
        // 触发邀请者的 invite_active_user 任务
        console.log(`✅ [Task Debug] 触发 invite_active_user 任务:`, { inviterId: user.invited_by, invitedUserId: userId });
        await this.checkInviteActiveUser(user.invited_by);
      }
    } catch (error) {
      console.error('❌ [Task Debug] 更新评价任务失败:', error);
    }
  }

  // 更新收藏相关任务
  async updateFavoriteTasks(userId) {
    try {
      const { pool } = require('../config/database');

      // 获取用户的收藏总数
      const [[{ favoriteCount }]] = await pool.query(
        'SELECT COUNT(*) as favoriteCount FROM favorites WHERE user_id = ?',
        [userId]
      );

      // favorite_5: 收藏 5 个 DJ（覆盖式更新）
      if (favoriteCount <= 5) {
        await this.setProgress(userId, 'favorite_5', favoriteCount);
      }
    } catch (error) {
      console.error('更新收藏任务失败:', error);
    }
  }

  // 更新 helpful 相关任务（别名方法，调用 checkHelpfulReceived）
  async updateHelpfulTasks(userId) {
    return this.checkHelpfulReceived(userId);
  }
}

module.exports = new TaskService();
