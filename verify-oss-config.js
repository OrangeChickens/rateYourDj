#!/usr/bin/env node

/**
 * OSS Configuration Verification Script
 * 验证 OSS 配置是否正确
 */

require('dotenv').config();

console.log('====================================');
console.log('OSS 配置检查');
console.log('====================================');
console.log('');

const requiredVars = [
  'NODE_ENV',
  'OSS_REGION',
  'OSS_ACCESS_KEY_ID',
  'OSS_ACCESS_KEY_SECRET',
  'OSS_BUCKET'
];

const optionalVars = [
  'OSS_CDN_DOMAIN'
];

let allGood = true;

console.log('🔍 检查必需的环境变量:');
console.log('');

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    // 隐藏敏感信息
    let displayValue = value;
    if (varName.includes('SECRET') || varName.includes('KEY_ID')) {
      displayValue = value.substring(0, 4) + '***' + value.substring(value.length - 4);
    }
    console.log(`✅ ${varName}: ${displayValue}`);
  } else {
    console.log(`❌ ${varName}: 未设置`);
    allGood = false;
  }
});

console.log('');
console.log('🔍 检查可选的环境变量:');
console.log('');

optionalVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value}`);
  } else {
    console.log(`⚠️  ${varName}: 未设置 (可选)`);
  }
});

console.log('');
console.log('====================================');

if (allGood) {
  console.log('✅ 所有必需的配置项都已设置');
  console.log('');
  console.log('下一步: 测试 OSS 连接');
  console.log('');
  console.log('可以运行以下脚本测试上传:');
  console.log('node test-oss-upload.js');
  process.exit(0);
} else {
  console.log('❌ 有配置项缺失，请检查 .env 文件');
  console.log('');
  console.log('参考模板: .env.production.example');
  console.log('');
  process.exit(1);
}
