const { pool } = require('../config/database');
const { RATING_REFRESH_SQL } = require('./ratingQueries');

// 全站均分G是所有DJ共同依赖。一次原子刷新全部派生值，避免旧G与新G混用。
// 保留参数以兼容现有创建/删除/审核调用；互斥锁确保并发请求最后一次刷新读取最新评价。
async function updateDJRatings(djId) {
  const connection = await pool.getConnection();
  let locked = false;
  try {
    const [[result]] = await connection.query("SELECT GET_LOCK('rateyourdj:rating-refresh', 15) AS acquired");
    if (Number(result.acquired) !== 1) throw new Error('评分更新繁忙，请重试');
    locked = true;
    await connection.query(RATING_REFRESH_SQL);
  } finally {
    try { if (locked) await connection.query("SELECT RELEASE_LOCK('rateyourdj:rating-refresh')"); }
    finally { connection.release(); }
  }
}
module.exports = { updateDJRatings };
