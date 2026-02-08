// models/UserTask.js
const pool = require('../config/database');

class UserTask {
  // 初始化用户任务（用户首次获得 full access 时调用）
  static async initializeForUser(userId) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 获取所有活跃任务配置
      const [configs] = await connection.query(
        'SELECT * FROM task_configs WHERE is_active = TRUE'
      );

      // 为每个任务创建用户任务记录
      for (const config of configs) {
        await connection.query(
          `INSERT INTO user_tasks
           (user_id, task_code, target, reward_invites, repeat_count)
           VALUES (?, ?, ?, ?, 0)
           ON DUPLICATE KEY UPDATE user_id = user_id`,
          [userId, config.task_code, config.target, config.reward_invites]
        );
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // 获取用户所有任务
  static async getUserTasks(userId) {
    const query = `
      SELECT
        ut.*,
        tc.task_name,
        tc.task_desc,
        tc.task_category,
        tc.icon,
        tc.repeatable,
        tc.max_repeats
      FROM user_tasks ut
      JOIN task_configs tc ON ut.task_code = tc.task_code
      WHERE ut.user_id = ? AND tc.is_active = TRUE
      ORDER BY tc.task_category, tc.sort_order
    `;
    const [rows] = await pool.query(query, [userId]);
    return rows;
  }

  // 获取用户单个任务
  static async getUserTask(userId, taskCode, repeatCount = 0) {
    const query = `
      SELECT
        ut.*,
        tc.task_name,
        tc.task_desc,
        tc.task_category,
        tc.icon,
        tc.repeatable,
        tc.max_repeats
      FROM user_tasks ut
      JOIN task_configs tc ON ut.task_code = tc.task_code
      WHERE ut.user_id = ? AND ut.task_code = ? AND ut.repeat_count = ?
    `;
    const [rows] = await pool.query(query, [userId, taskCode, repeatCount]);
    return rows[0];
  }

  // 更新任务进度
  static async updateProgress(userId, taskCode, newProgress) {
    const query = `
      UPDATE user_tasks
      SET progress = ?, updated_at = NOW()
      WHERE user_id = ? AND task_code = ? AND completed = FALSE
      ORDER BY repeat_count DESC
      LIMIT 1
    `;
    const [result] = await pool.query(query, [newProgress, userId, taskCode]);
    return result.affectedRows > 0;
  }

  // 标记任务完成
  static async markCompleted(userId, taskCode) {
    const query = `
      UPDATE user_tasks
      SET completed = TRUE, completed_at = NOW(), updated_at = NOW()
      WHERE user_id = ? AND task_code = ? AND completed = FALSE
      ORDER BY repeat_count DESC
      LIMIT 1
    `;
    const [result] = await pool.query(query, [userId, taskCode]);
    return result.affectedRows > 0;
  }

  // 领取奖励
  static async claimReward(userId, taskCode) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 获取任务
      const [tasks] = await connection.query(
        `SELECT ut.*, tc.repeatable, tc.max_repeats
         FROM user_tasks ut
         JOIN task_configs tc ON ut.task_code = tc.task_code
         WHERE ut.user_id = ? AND ut.task_code = ?
         AND ut.completed = TRUE AND ut.reward_claimed = FALSE
         ORDER BY ut.repeat_count DESC
         LIMIT 1`,
        [userId, taskCode]
      );

      if (tasks.length === 0) {
        throw new Error('任务未完成或已领取奖励');
      }

      const task = tasks[0];

      // 标记奖励已领取
      await connection.query(
        'UPDATE user_tasks SET reward_claimed = TRUE, claimed_at = NOW() WHERE id = ?',
        [task.id]
      );

      // 增加用户邀请码额度
      await connection.query(
        'UPDATE users SET invite_quota = invite_quota + ? WHERE id = ?',
        [task.reward_invites, userId]
      );

      // 如果是可重复任务，检查是否需要创建下一个实例
      if (task.repeatable && task.repeat_count < task.max_repeats - 1) {
        await connection.query(
          `INSERT INTO user_tasks
           (user_id, task_code, target, reward_invites, repeat_count)
           VALUES (?, ?, ?, ?, ?)`,
          [userId, taskCode, task.target, task.reward_invites, task.repeat_count + 1]
        );
      }

      await connection.commit();
      return task.reward_invites;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // 获取任务统计
  static async getStats(userId) {
    const query = `
      SELECT
        COUNT(*) as total_tasks,
        SUM(CASE WHEN completed = TRUE THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN completed = TRUE AND reward_claimed = TRUE THEN reward_invites ELSE 0 END) as total_rewards_claimed
      FROM user_tasks
      WHERE user_id = ?
    `;
    const [rows] = await pool.query(query, [userId]);
    return rows[0];
  }
}

module.exports = UserTask;
