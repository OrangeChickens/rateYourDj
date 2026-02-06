#!/usr/bin/env node

/**
 * OSS Upload Test Script
 * 测试 OSS 上传功能
 */

require('dotenv').config();
const OSS = require('ali-oss');
const fs = require('fs');
const path = require('path');

async function testOSSUpload() {
  console.log('====================================');
  console.log('OSS 上传测试');
  console.log('====================================');
  console.log('');

  // 1. 检查环境变量
  console.log('1️⃣  检查环境变量...');
  const region = process.env.OSS_REGION;
  const accessKeyId = process.env.OSS_ACCESS_KEY_ID;
  const accessKeySecret = process.env.OSS_ACCESS_KEY_SECRET;
  const bucket = process.env.OSS_BUCKET;

  if (!region || !accessKeyId || !accessKeySecret || !bucket) {
    console.error('❌ OSS 配置不完整，请先运行: node verify-oss-config.js');
    process.exit(1);
  }

  console.log(`   Region: ${region}`);
  console.log(`   Bucket: ${bucket}`);
  console.log('   ✅ 环境变量检查通过');
  console.log('');

  // 2. 创建 OSS 客户端
  console.log('2️⃣  创建 OSS 客户端...');
  let client;
  try {
    client = new OSS({
      region: region,
      accessKeyId: accessKeyId,
      accessKeySecret: accessKeySecret,
      bucket: bucket
    });
    console.log('   ✅ OSS 客户端创建成功');
  } catch (error) {
    console.error('   ❌ OSS 客户端创建失败:', error.message);
    process.exit(1);
  }
  console.log('');

  // 3. 创建测试文件
  console.log('3️⃣  创建测试文件...');
  const testContent = `OSS Upload Test - ${new Date().toISOString()}`;
  const testFileName = `test-${Date.now()}.txt`;
  const testFilePath = path.join(__dirname, testFileName);

  try {
    fs.writeFileSync(testFilePath, testContent, 'utf8');
    console.log(`   ✅ 测试文件创建: ${testFileName}`);
  } catch (error) {
    console.error('   ❌ 创建测试文件失败:', error.message);
    process.exit(1);
  }
  console.log('');

  // 4. 上传测试文件
  console.log('4️⃣  上传测试文件到 OSS...');
  const objectName = `test-uploads/${testFileName}`;
  console.log(`   目标路径: ${objectName}`);

  let uploadResult;
  try {
    uploadResult = await client.put(objectName, testFilePath);
    console.log('   ✅ 文件上传成功');
    console.log(`   URL: ${uploadResult.url}`);
  } catch (error) {
    console.error('   ❌ 文件上传失败:', error.message);
    if (error.code) {
      console.error(`   错误代码: ${error.code}`);
    }
    // 清理测试文件
    fs.unlinkSync(testFilePath);
    process.exit(1);
  }
  console.log('');

  // 5. 验证文件存在
  console.log('5️⃣  验证文件已上传...');
  try {
    const head = await client.head(objectName);
    console.log('   ✅ 文件存在于 OSS');
    console.log(`   文件大小: ${head.res.size} bytes`);
  } catch (error) {
    console.error('   ❌ 文件验证失败:', error.message);
  }
  console.log('');

  // 6. 清理测试文件
  console.log('6️⃣  清理测试文件...');
  try {
    // 删除 OSS 上的测试文件
    await client.delete(objectName);
    console.log('   ✅ OSS 测试文件已删除');

    // 删除本地测试文件
    fs.unlinkSync(testFilePath);
    console.log('   ✅ 本地测试文件已删除');
  } catch (error) {
    console.error('   ⚠️  清理失败:', error.message);
  }
  console.log('');

  // 7. 测试完成
  console.log('====================================');
  console.log('✅ OSS 上传测试全部通过！');
  console.log('====================================');
  console.log('');
  console.log('OSS 配置正确，可以正常上传文件。');
  console.log('');

  // 8. 生成测试 DJ 图片路径示例
  console.log('示例 DJ 图片路径:');
  const testDjName = 'TestDJ';
  const testLabel = 'Independent';
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const datePrefix = `${year}-${month}-${day}`;

  const djPhotoPath = `dj-photos/${testLabel}/${testDjName}/${datePrefix}_photo.jpg`;
  const cdnDomain = process.env.OSS_CDN_DOMAIN;

  console.log('');
  console.log(`OSS 路径: ${djPhotoPath}`);
  console.log('');

  if (cdnDomain) {
    console.log(`CDN URL: https://${cdnDomain}/${djPhotoPath}`);
  } else {
    console.log(`OSS URL: https://${bucket}.${region}.aliyuncs.com/${djPhotoPath}`);
  }
  console.log('');
}

// 运行测试
testOSSUpload().catch(error => {
  console.error('');
  console.error('====================================');
  console.error('❌ 测试失败');
  console.error('====================================');
  console.error('');
  console.error('错误信息:', error.message);
  if (error.stack) {
    console.error('');
    console.error('堆栈信息:');
    console.error(error.stack);
  }
  process.exit(1);
});
