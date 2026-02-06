#!/bin/bash

# Deploy OSS Path Optimization Changes
# This script uploads modified backend files and restarts the application

set -e  # Exit on error

echo "=================================================="
echo "部署 OSS 路径优化更新"
echo "=================================================="

# Configuration
SERVER_IP="rateyourdj.pbrick.cn"
SERVER_USER="root"
SERVER_PATH="/var/www/rateYourDj/rateyourdj-backend"
LOCAL_BACKEND_PATH="./rateyourdj-backend"

echo ""
echo "1️⃣  上传修改的后端文件..."
echo ""

# Upload modified OSS configuration
echo "📤 上传 oss.js..."
scp ${LOCAL_BACKEND_PATH}/src/config/oss.js \
  ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/src/config/oss.js

# Upload modified upload controller
echo "📤 上传 uploadController.js..."
scp ${LOCAL_BACKEND_PATH}/src/controllers/uploadController.js \
  ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/src/controllers/uploadController.js

# Upload modified DJ controller
echo "📤 上传 djController.js..."
scp ${LOCAL_BACKEND_PATH}/src/controllers/djController.js \
  ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/src/controllers/djController.js

echo ""
echo "✅ 文件上传完成"
echo ""

echo "2️⃣  重启应用..."
echo ""

# Restart PM2 application
ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
# Load nvm
source ~/.nvm/nvm.sh
nvm use 16

# Restart application
pm2 restart rateyourdj-api

echo ""
echo "✅ 应用已重启"
echo ""

# Show logs
echo "📋 最新日志:"
pm2 logs rateyourdj-api --lines 20 --nostream
ENDSSH

echo ""
echo "=================================================="
echo "✅ 部署完成！"
echo "=================================================="
echo ""
echo "下一步调试建议："
echo ""
echo "1. 检查数据库中的 photo_url 格式："
echo "   mysql -h <RDS_HOST> -u <USER> -p rateyourdj < check-dj-photos.sql"
echo ""
echo "2. 验证 OSS 域名已添加到微信小程序白名单："
echo "   - 登录微信公众平台"
echo "   - 开发 -> 开发管理 -> 开发设置"
echo "   - 服务器域名 -> downloadFile 合法域名"
echo "   - 添加: https://rateyourdj.oss-cn-shanghai.aliyuncs.com"
echo ""
echo "3. 测试新的上传流程："
echo "   - 在小程序中上传新的 DJ 照片"
echo "   - 查看 PM2 日志确认 OSS 路径格式"
echo "   - 在 OSS 控制台检查文件是否按新路径存储"
echo ""
echo "4. 检查前端渲染逻辑："
echo "   - DJ 列表页面: pages/index/index.wxml"
echo "   - DJ 详情页面: pages/dj-detail/dj-detail.wxml"
echo "   - 确认 <image> 标签的 src 属性绑定正确"
echo ""
