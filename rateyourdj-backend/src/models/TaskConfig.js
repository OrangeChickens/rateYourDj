// models/TaskConfig.js
const pool = require('../config/database');

class TaskConfig {
  // 获取所有活跃任务配置
  static async getAllActive() {
    const query = `
      SELECT * FROM task_configs
      WHERE is_active = TRUE
      ORDER BY task_category, sort_order
    `;
    const [rows] = await pool.query(query);
    return rows;
  }

  // 按分类获取任务
  static async getByCategory(category) {
    const query = `
      SELECT * FROM task_configs
      WHERE is_active = TRUE AND task_category = ?
      ORDER BY sort_order
    `;
    const [rows] = await pool.query(query, [category]);
    return rows;
  }

  // 获取单个任务配置
  static async getByCode(taskCode) {
    const query = 'SELECT * FROM task_configs WHERE task_code = ? AND is_active = TRUE';
    const [rows] = await pool.query(query, [taskCode]);
    return rows[0];
  }

  // 获取所有任务（分组）
  static async getAllGrouped() {
    const tasks = await this.getAllActive();
    return {
      beginner: tasks.filter(t => t.task_category === 'beginner'),
      advanced: tasks.filter(t => t.task_category === 'advanced'),
      vip: tasks.filter(t => t.task_category === 'vip')
    };
  }
}

module.exports = TaskConfig;
