// services/taskService.js
const UserTask = require('../models/UserTask');
const TaskConfig = require('../models/TaskConfig');

class TaskService {
  // 更新任务进度
  async updateProgress(userId, taskCode, increment = 1) {
    try {
      // 获取当前任务
      const task = await UserTask.getUserTask(userId, taskCode);

      if (!task) {
        console.log(`任务 ${taskCode} 不存在，用户 ${userId}`);
        return;
      }

      if (task.completed && !task.repeatable) {
        console.log(`任务 ${taskCode} 已完成且不可重复`);
        return;
      }

      // 计算新进度
      const newProgress = task.progress + increment;

      // 更新进度
      await UserTask.updateProgress(userId, taskCode, newProgress);

      // 检查是否完成
      if (newProgress >= task.target) {
        await this.completeTask(userId, taskCode);
      }
    } catch (error) {
      console.error(`更新任务进度失败 (${taskCode}):`, error);
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
      // 当被邀请的用户完成首次评价时，调用此方法
      await this.updateProgress(inviterId, 'invite_active_user', 1);
    } catch (error) {
      console.error('触发 invite_active_user 任务失败:', error);
    }
  }

  // 检查并触发 helpful_received 任务
  async checkHelpfulReceived(reviewAuthorId) {
    try {
      const pool = require('../config/database');

      // 计算该用户所有评价的总 helpful_count
      const [result] = await pool.query(
        `SELECT SUM(helpful_count) as total_helpful
         FROM reviews
         WHERE user_id = ? AND status = 'approved'`,
        [reviewAuthorId]
      );

      const totalHelpful = result[0].total_helpful || 0;

      // 更新任务进度（使用总数覆盖，而不是增量）
      if (totalHelpful >= 5) {
        const task5 = await UserTask.getUserTask(reviewAuthorId, 'helpful_received_5');
        if (task5 && !task5.completed) {
          await UserTask.updateProgress(reviewAuthorId, 'helpful_received_5', totalHelpful);
          if (totalHelpful >= 5) {
            await this.completeTask(reviewAuthorId, 'helpful_received_5');
          }
        }
      }

      if (totalHelpful >= 20) {
        const task20 = await UserTask.getUserTask(reviewAuthorId, 'helpful_received_20');
        if (task20 && !task20.completed) {
          await UserTask.updateProgress(reviewAuthorId, 'helpful_received_20', totalHelpful);
          if (totalHelpful >= 20) {
            await this.completeTask(reviewAuthorId, 'helpful_received_20');
          }
        }
      }
    } catch (error) {
      console.error('触发 helpful_received 任务失败:', error);
    }
  }
}

module.exports = new TaskService();
