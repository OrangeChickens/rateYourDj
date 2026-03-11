/**
 * 一次性清理脚本：清理 2026-03-11 垃圾评论攻击数据
 *
 * 攻击概要：100+ 假微信账号 (user_id 3481-3626) 批量注册，
 * 针对 DJ LOVERBOY (dj_id=2013) 发送 ~100 条垃圾评论
 *
 * 用法：在服务器上执行
 *   cd /var/www/rateYourDj/rateyourdj-backend
 *   node scripts/cleanup-spam-2026-03.js
 */

require('dotenv').config();
const { pool } = require('../src/config/database');
const { updateDJRatings } = require('../src/services/ratingService');

const SPAM_USER_START = 3481;
const SPAM_USER_END = 3626;
const TARGET_DJ_ID = 2013;

async function cleanup() {
  const connection = await pool.getConnection();

  try {
    // 1. 统计受影响数据量
    const [[{ reviewCount }]] = await connection.query(
      'SELECT COUNT(*) as reviewCount FROM reviews WHERE user_id BETWEEN ? AND ? AND dj_id = ?',
      [SPAM_USER_START, SPAM_USER_END, TARGET_DJ_ID]
    );
    const [[{ userCount }]] = await connection.query(
      'SELECT COUNT(*) as userCount FROM users WHERE id BETWEEN ? AND ?',
      [SPAM_USER_START, SPAM_USER_END]
    );
    const [[{ tagCount }]] = await connection.query(
      `SELECT COUNT(*) as tagCount FROM review_tags
       WHERE review_id IN (SELECT id FROM reviews WHERE user_id BETWEEN ? AND ? AND dj_id = ?)`,
      [SPAM_USER_START, SPAM_USER_END, TARGET_DJ_ID]
    );
    const [[{ interactionCount }]] = await connection.query(
      `SELECT COUNT(*) as interactionCount FROM review_interactions
       WHERE review_id IN (SELECT id FROM reviews WHERE user_id BETWEEN ? AND ? AND dj_id = ?)`,
      [SPAM_USER_START, SPAM_USER_END, TARGET_DJ_ID]
    );

    console.log('\n========== 垃圾数据统计 ==========');
    console.log(`垃圾用户数: ${userCount} (id ${SPAM_USER_START}-${SPAM_USER_END})`);
    console.log(`垃圾评论数: ${reviewCount} (dj_id=${TARGET_DJ_ID})`);
    console.log(`关联标签数: ${tagCount}`);
    console.log(`关联互动数: ${interactionCount}`);
    console.log('===================================\n');

    if (reviewCount === 0 && userCount === 0) {
      console.log('没有需要清理的数据，退出');
      process.exit(0);
    }

    // 2. 事务内删除
    await connection.beginTransaction();

    // 删除 review_tags
    const [tagResult] = await connection.query(
      `DELETE FROM review_tags
       WHERE review_id IN (SELECT id FROM reviews WHERE user_id BETWEEN ? AND ? AND dj_id = ?)`,
      [SPAM_USER_START, SPAM_USER_END, TARGET_DJ_ID]
    );
    console.log(`删除 review_tags: ${tagResult.affectedRows} 条`);

    // 删除 review_interactions
    const [interactionResult] = await connection.query(
      `DELETE FROM review_interactions
       WHERE review_id IN (SELECT id FROM reviews WHERE user_id BETWEEN ? AND ? AND dj_id = ?)`,
      [SPAM_USER_START, SPAM_USER_END, TARGET_DJ_ID]
    );
    console.log(`删除 review_interactions: ${interactionResult.affectedRows} 条`);

    // 删除 reviews
    const [reviewResult] = await connection.query(
      'DELETE FROM reviews WHERE user_id BETWEEN ? AND ? AND dj_id = ?',
      [SPAM_USER_START, SPAM_USER_END, TARGET_DJ_ID]
    );
    console.log(`删除 reviews: ${reviewResult.affectedRows} 条`);

    // 删除 search_history
    const [searchResult] = await connection.query(
      'DELETE FROM search_history WHERE user_id BETWEEN ? AND ?',
      [SPAM_USER_START, SPAM_USER_END]
    );
    console.log(`删除 search_history: ${searchResult.affectedRows} 条`);

    // 封禁账号
    const [banResult] = await connection.query(
      "UPDATE users SET access_level = 'banned' WHERE id BETWEEN ? AND ?",
      [SPAM_USER_START, SPAM_USER_END]
    );
    console.log(`封禁用户: ${banResult.affectedRows} 个`);

    await connection.commit();
    console.log('\n事务提交成功');

    // 3. 重新计算 DJ 评分
    await updateDJRatings(TARGET_DJ_ID);
    console.log(`DJ ${TARGET_DJ_ID} 评分已重新计算`);

    // 4. 验证结果
    const [[djAfter]] = await pool.query(
      'SELECT name, overall_rating, review_count, weighted_score FROM djs WHERE id = ?',
      [TARGET_DJ_ID]
    );
    console.log('\n========== 清理结果 ==========');
    console.log(`DJ: ${djAfter.name}`);
    console.log(`评分: ${djAfter.overall_rating}`);
    console.log(`评论数: ${djAfter.review_count}`);
    console.log(`加权分: ${djAfter.weighted_score}`);
    console.log('===============================\n');

    process.exit(0);
  } catch (error) {
    await connection.rollback();
    console.error('清理失败，已回滚:', error);
    process.exit(1);
  } finally {
    connection.release();
  }
}

cleanup();
