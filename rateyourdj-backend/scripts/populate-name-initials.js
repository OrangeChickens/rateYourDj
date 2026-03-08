/**
 * 一次性脚本：为所有现有DJ填充 name_initial 字段
 * 运行方式: node scripts/populate-name-initials.js
 */
require('dotenv').config();
const { pool } = require('../src/config/database');
const { getNameInitial } = require('../src/utils/pinyin');

async function main() {
  try {
    const [djs] = await pool.query('SELECT id, name FROM djs WHERE name_initial IS NULL');
    console.log(`Found ${djs.length} DJs without name_initial`);

    for (const dj of djs) {
      const initial = getNameInitial(dj.name);
      await pool.query('UPDATE djs SET name_initial = ? WHERE id = ?', [initial, dj.id]);
      console.log(`  ${dj.name} -> ${initial}`);
    }

    console.log('Done!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
