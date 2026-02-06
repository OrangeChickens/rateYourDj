#!/bin/bash

# RateYourDJ 部署脚本
# 用法：./deploy.sh [环境]
# 例如：./deploy.sh production

set -e  # 遇到错误立即退出

ENVIRONMENT=${1:-production}
APP_NAME="rateyourdj-api"

echo "========================================="
echo "  RateYourDJ 部署脚本"
echo "  环境: $ENVIRONMENT"
echo "========================================="
echo ""

# 1. 拉取最新代码
echo "📦 拉取最新代码..."
git pull origin main

# 2. 安装依赖
echo "📥 安装依赖..."
npm install --production

# 3. 检查环境变量文件
if [ ! -f .env ]; then
    echo "❌ 错误：.env 文件不存在！"
    echo "请复制 .env.production.example 为 .env 并填入真实配置"
    exit 1
fi

# 4. 测试数据库连接（可选）
echo "🔍 测试数据库连接..."
node -e "
const { testConnection } = require('./src/config/database');
testConnection().then(() => {
    console.log('✅ 数据库连接成功');
    process.exit(0);
}).catch((err) => {
    console.error('❌ 数据库连接失败:', err.message);
    process.exit(1);
});
"

# 5. 重启PM2应用
echo "🔄 重启应用..."
if pm2 describe $APP_NAME > /dev/null 2>&1; then
    echo "重启现有应用..."
    pm2 restart $APP_NAME
else
    echo "首次启动应用..."
    pm2 start src/app.js --name $APP_NAME
fi

# 6. 保存PM2配置
pm2 save

# 7. 显示应用状态
echo ""
echo "========================================="
echo "✅ 部署完成！"
echo "========================================="
echo ""
pm2 status
echo ""
echo "📝 查看日志: pm2 logs $APP_NAME"
echo "📊 监控应用: pm2 monit"
echo ""
