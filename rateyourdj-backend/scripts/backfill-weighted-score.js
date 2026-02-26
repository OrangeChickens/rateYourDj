/**
 * 一次性回填脚本：为所有 DJ 重新计算 weighted_score
 *
 * 用法：在服务器上执行
 *   cd /var/www/rateYourDj/rateyourdj-backend
 *   node scripts/backfill-weighted-score.js
 */

require('dotenv').config();
const { pool } = require('../src/config/database');
const { updateDJRatings } = require('../src/services/ratingService');

async function backfill() {
  try {
    const [djs] = await pool.query('SELECT id, name FROM djs');
    console.log(`Found ${djs.length} DJs to update`);

    for (const dj of djs) {
      await updateDJRatings(dj.id);
      console.log(`  Updated: ${dj.name} (id=${dj.id})`);
    }

    // 验证结果
    const [top] = await pool.query(
      'SELECT name, overall_rating, review_count, weighted_score FROM djs ORDER BY weighted_score DESC LIMIT 10'
    );
    console.log('\nTop 10 by weighted_score:');
    console.table(top);

    process.exit(0);
  } catch (error) {
    console.error('Backfill failed:', error);
    process.exit(1);
  }
}

backfill();
