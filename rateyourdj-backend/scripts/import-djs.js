/**
 * DJ批量导入脚本
 * 用法：node scripts/import-djs.js <csv文件路径> [环境]
 * 示例：
 *   node scripts/import-djs.js dj_import_template.csv          # 使用开发环境
 *   node scripts/import-djs.js dj_import_template.csv prod     # 使用生产环境
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

// 检查是否指定了生产环境
const useProduction = process.argv[3] === 'prod' || process.argv[3] === 'production';
if (useProduction) {
  console.log('⚠️  使用生产环境配置');
  require('dotenv').config({ path: path.resolve(__dirname, '../.env.production'), override: true });
}

const { pool } = require('../src/config/database');

// 简单的CSV解析函数
function parseCSV(csvContent) {
  const lines = csvContent.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.trim());

  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const values = [];
    let currentValue = '';
    let insideQuotes = false;

    for (let char of lines[i]) {
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim());

    if (values.length === headers.length) {
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
      data.push(row);
    }
  }

  return data;
}

// 批量导入DJ
async function importDJs(csvFilePath) {
  let connection;

  try {
    // 读取CSV文件
    const csvPath = path.resolve(csvFilePath);
    console.log(`📄 正在读取文件: ${csvPath}`);

    if (!fs.existsSync(csvPath)) {
      throw new Error(`文件不存在: ${csvPath}`);
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const djs = parseCSV(csvContent);

    console.log(`📊 共找到 ${djs.length} 条DJ记录`);

    if (djs.length === 0) {
      console.log('❌ 没有找到有效的DJ数据');
      return;
    }

    // 获取数据库连接
    connection = await pool.getConnection();
    await connection.beginTransaction();

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    // 逐条插入
    for (const dj of djs) {
      try {
        // 验证必填字段
        if (!dj.name || !dj.city) {
          console.log(`⚠️  跳过：缺少必填字段 (name: ${dj.name}, city: ${dj.city})`);
          skipCount++;
          continue;
        }

        // 检查是否已存在
        const [existing] = await connection.query(
          'SELECT id FROM djs WHERE name = ? AND city = ?',
          [dj.name, dj.city]
        );

        if (existing.length > 0) {
          console.log(`⚠️  跳过：DJ已存在 - ${dj.name} (${dj.city})`);
          skipCount++;
          continue;
        }

        // 插入新DJ
        const [result] = await connection.query(
          `INSERT INTO djs (name, city, label, photo_url, music_style)
           VALUES (?, ?, ?, ?, ?)`,
          [
            dj.name,
            dj.city,
            dj.label || null,
            dj.photo_url || null,
            dj.music_style || null
          ]
        );

        console.log(`✅ 导入成功：${dj.name} (${dj.city}) - ID: ${result.insertId}`);
        successCount++;

      } catch (error) {
        console.error(`❌ 导入失败：${dj.name} - ${error.message}`);
        errorCount++;
      }
    }

    // 提交事务
    await connection.commit();

    // 输出统计
    console.log('\n📊 导入统计：');
    console.log(`   ✅ 成功: ${successCount} 条`);
    console.log(`   ⚠️  跳过: ${skipCount} 条`);
    console.log(`   ❌ 失败: ${errorCount} 条`);
    console.log(`   📝 总计: ${djs.length} 条`);

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('❌ 导入过程出错:', error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
    await pool.end();
  }
}

// 主函数
async function main() {
  const csvFilePath = process.argv[2];

  if (!csvFilePath) {
    console.log('❌ 用法: node scripts/import-djs.js <csv文件路径> [环境]');
    console.log('   示例:');
    console.log('     node scripts/import-djs.js dj_import_template.csv          # 开发环境');
    console.log('     node scripts/import-djs.js dj_import_template.csv prod     # 生产环境');
    process.exit(1);
  }

  console.log('🚀 开始批量导入DJ数据...\n');

  try {
    await importDJs(csvFilePath);
    console.log('\n✅ 导入完成！');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ 导入失败！');
    process.exit(1);
  }
}

main();
