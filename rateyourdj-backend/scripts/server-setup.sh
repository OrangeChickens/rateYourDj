#!/bin/bash
# 在ECS服务器上执行此脚本
# 使用方法：bash server-setup.sh

set -e

echo "========================================="
echo "  RateYourDJ 服务器环境配置"
echo "========================================="
echo ""

# 1. 更新系统
echo "📦 更新系统包..."
apt update && apt upgrade -y

# 2. 安装基础工具
echo "🔧 安装基础工具..."
apt install -y curl git vim ufw

# 3. 安装Node.js 18 LTS
echo "📥 安装Node.js 18..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
else
    echo "Node.js已安装"
fi

echo "Node.js版本: $(node -v)"
echo "npm版本: $(npm -v)"

# 4. 安装PM2
echo "🚀 安装PM2..."
npm install -g pm2

# 5. 安装Nginx
echo "🌐 安装Nginx..."
if ! command -v nginx &> /dev/null; then
    apt install -y nginx
    systemctl start nginx
    systemctl enable nginx
else
    echo "Nginx已安装"
fi

# 6. 安装MySQL客户端（用于连接RDS）
echo "💾 安装MySQL客户端..."
apt install -y mysql-client

# 7. 配置防火墙
echo "🔒 配置防火墙..."
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
echo "y" | ufw enable

# 8. 创建项目目录
echo "📁 创建项目目录..."
mkdir -p /var/www

echo ""
echo "========================================="
echo "✅ 环境配置完成！"
echo "========================================="
echo ""
echo "已安装："
echo "  - Node.js $(node -v)"
echo "  - npm $(npm -v)"
echo "  - PM2 $(pm2 -v)"
echo "  - Nginx $(nginx -v 2>&1 | grep version)"
echo ""
echo "下一步：上传代码到 /var/www/rateyourdj-backend"
echo ""
