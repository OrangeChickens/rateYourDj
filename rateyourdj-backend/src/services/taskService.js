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
      const { pool } = require('../config/database');

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

  // 更新评价相关任务
  async updateReviewTasks(userId, comment = '') {
    try {
      const { pool } = require('../config/database');

      // 获取用户的评价总数（包括当前这条）
      const [[{ reviewCount }]] = await pool.query(
        'SELECT COUNT(*) as reviewCount FROM reviews WHERE user_id = ?',
        [userId]
      );

      // first_review: 完成第一次评价
      if (reviewCount === 1) {
        await this.updateProgress(userId, 'first_review', 1);
      }

      // reviews_3: 评价 3 个 DJ
      if (reviewCount <= 3) {
        await this.updateProgress(userId, 'reviews_3', reviewCount);
      }

      // reviews_10: 评价 10 个 DJ
      if (reviewCount <= 10) {
        await this.updateProgress(userId, 'reviews_10', reviewCount);
      }

      // quality_review: 撰写 30 字以上的优质评价（可重复）
      if (comment && comment.length >= 30) {
        await this.updateProgress(userId, 'quality_review', 1);
      }

      // 检查是否是被邀请用户的首次评价
      const User = require('../models/User');
      const user = await User.findById(userId);

      if (user && user.invited_by && reviewCount === 1) {
        // 触发邀请者的 invite_active_user 任务
        await this.checkInviteActiveUser(user.invited_by);
      }
    } catch (error) {
      console.error('更新评价任务失败:', error);
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

      // favorite_5: 收藏 5 个 DJ
      if (favoriteCount <= 5) {
        await this.updateProgress(userId, 'favorite_5', favoriteCount);
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
