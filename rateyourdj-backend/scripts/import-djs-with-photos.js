/**
 * DJ批量导入脚本（高级版 - 支持自动上传照片到OSS）
 * 用法：node scripts/import-djs-with-photos.js <csv文件路径> [环境]
 * 示例：
 *   node scripts/import-djs-with-photos.js dj_list.csv          # 使用开发环境
 *   node scripts/import-djs-with-photos.js dj_list.csv prod     # 使用生产环境
 *
 * 功能：
 * 1. 从CSV导入DJ信息
 * 2. 自动下载photo_url中的图片
 * 3. 上传到阿里云OSS
 * 4. 保存OSS链接到数据库
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
require('dotenv').config();

// 检查是否指定了生产环境
const useProduction = process.argv[3] === 'prod' || process.argv[3] === 'production';
if (useProduction) {
  console.log('⚠️  使用生产环境配置');
  require('dotenv').config({ path: path.resolve(__dirname, '../.env.production'), override: true });
}

const { pool } = require('../src/config/database');
const { uploadToOSS } = require('../src/config/oss');

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

// 下载图片到内存
function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`下载失败，状态码: ${response.statusCode}`));
        return;
      }

      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
}

// 从URL获取文件扩展名
function getFileExtension(url) {
  const match = url.match(/\.(jpg|jpeg|png|gif|webp)($|\?)/i);
  return match ? match[1].toLowerCase() : 'jpg';
}

// 上传照片到OSS
async function uploadPhotoToOSS(photoUrl, djName) {
  if (!photoUrl) {
    return null;
  }

  try {
    console.log(`   📥 正在下载照片: ${photoUrl}`);
    const imageBuffer = await downloadImage(photoUrl);

    const fileExtension = getFileExtension(photoUrl);
    const fileName = `dj_${djName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.${fileExtension}`;

    console.log(`   📤 正在上传到OSS: ${fileName}`);
    const ossUrl = await uploadToOSS(imageBuffer, fileName, `image/${fileExtension}`);

    console.log(`   ✅ 上传成功: ${ossUrl}`);
    return ossUrl;

  } catch (error) {
    console.error(`   ❌ 照片处理失败: ${error.message}`);
    return null;
  }
}

// 批量导入DJ
async function importDJsWithPhotos(csvFilePath) {
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

    console.log(`📊 共找到 ${djs.length} 条DJ记录\n`);

    if (djs.length === 0) {
      console.log('❌ 没有找到有效的DJ数据');
      return;
    }

    // 获取数据库连接
    connection = await pool.getConnection();

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    // 逐条处理
    for (let i = 0; i < djs.length; i++) {
      const dj = djs[i];
      console.log(`\n[${i + 1}/${djs.length}] 处理: ${dj.name}`);

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

        // 处理照片（如果有）
        let finalPhotoUrl = dj.photo_url;
        if (dj.photo_url && dj.photo_url.startsWith('http')) {
          finalPhotoUrl = await uploadPhotoToOSS(dj.photo_url, dj.name);
        }

        // 插入DJ
        await connection.beginTransaction();

        const [result] = await connection.query(
          `INSERT INTO djs (name, city, label, photo_url, music_style)
           VALUES (?, ?, ?, ?, ?)`,
          [
            dj.name,
            dj.city,
            dj.label || null,
            finalPhotoUrl || null,
            dj.music_style || null
          ]
        );

        await connection.commit();

        console.log(`✅ 导入成功：${dj.name} (${dj.city}) - ID: ${result.insertId}`);
        successCount++;

      } catch (error) {
        if (connection) {
          await connection.rollback();
        }
        console.error(`❌ 导入失败：${dj.name} - ${error.message}`);
        errorCount++;
      }
    }

    // 输出统计
    console.log('\n' + '='.repeat(50));
    console.log('📊 导入统计：');
    console.log(`   ✅ 成功: ${successCount} 条`);
    console.log(`   ⚠️  跳过: ${skipCount} 条`);
    console.log(`   ❌ 失败: ${errorCount} 条`);
    console.log(`   📝 总计: ${djs.length} 条`);
    console.log('='.repeat(50));

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
    console.log('❌ 用法: node scripts/import-djs-with-photos.js <csv文件路径> [环境]');
    console.log('   示例:');
    console.log('     node scripts/import-djs-with-photos.js dj_list.csv          # 开发环境');
    console.log('     node scripts/import-djs-with-photos.js dj_list.csv prod     # 生产环境');
    console.log('\n功能：');
    console.log('   • 导入DJ信息');
    console.log('   • 自动下载并上传照片到OSS');
    console.log('   • 自动去重（同名同城市跳过）');
    process.exit(1);
  }

  console.log('🚀 开始批量导入DJ数据（含照片上传）...\n');

  try {
    await importDJsWithPhotos(csvFilePath);
    console.log('\n✅ 导入完成！');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ 导入失败！');
    process.exit(1);
  }
}

main();
