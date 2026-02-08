#!/bin/bash
# RDS 迁移脚本 - 在本地 Mac 执行

# 配置 RDS 连接信息（请修改为你的实际信息）
RDS_HOST="rm-xxx.mysql.rds.aliyuncs.com"  # 替换为你的 RDS 地址
RDS_PORT="3306"
RDS_USER="root"  # 替换为你的用户名
RDS_DB="rateyourdj"

echo "=========================================="
echo "RateYourDJ 生产数据库迁移脚本"
echo "=========================================="
echo ""
echo "⚠️  警告：此操作会修改生产数据库结构"
echo "请确保已经："
echo "1. 在阿里云控制台创建了 RDS 备份"
echo "2. RDS 白名单已添加你的 IP"
echo "3. 已经在测试环境验证过"
echo ""
read -p "确认继续？(yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ 已取消操作"
    exit 1
fi

echo ""
echo "======================================"
echo "步骤 1/4: 迁移前检查"
echo "======================================"
mysql -h $RDS_HOST -P $RDS_PORT -u $RDS_USER -p $RDS_DB \
    < rateyourdj-backend/migrations/pre-migration-check.sql

echo ""
read -p "检查结果正常？继续执行迁移？(yes/no): " confirm2

if [ "$confirm2" != "yes" ]; then
    echo "❌ 已取消操作"
    exit 1
fi

echo ""
echo "======================================"
echo "步骤 2/4: 本地备份（可选）"
echo "======================================"
read -p "是否创建本地备份？(yes/no): " backup_confirm

if [ "$backup_confirm" = "yes" ]; then
    mkdir -p ~/rateyourdj-backups
    backup_file=~/rateyourdj-backups/rateyourdj_backup_$(date +%Y%m%d_%H%M%S).sql
    echo "正在备份到: $backup_file"

    mysqldump -h $RDS_HOST -P $RDS_PORT -u $RDS_USER -p \
        --single-transaction --routines --triggers \
        --databases $RDS_DB > $backup_file

    echo "✅ 备份完成: $(ls -lh $backup_file | awk '{print $5}')"
fi

echo ""
echo "======================================"
echo "步骤 3/4: 执行数据库迁移"
echo "======================================"
echo "正在执行迁移脚本..."

mysql -h $RDS_HOST -P $RDS_PORT -u $RDS_USER -p $RDS_DB \
    < rateyourdj-backend/migrations/001_add_waitlist_and_tasks.sql

if [ $? -eq 0 ]; then
    echo "✅ 迁移脚本执行成功"
else
    echo "❌ 迁移脚本执行失败！请检查错误信息"
    exit 1
fi

echo ""
echo "======================================"
echo "步骤 4/4: 验证迁移结果"
echo "======================================"
mysql -h $RDS_HOST -P $RDS_PORT -u $RDS_USER -p $RDS_DB \
    < rateyourdj-backend/migrations/post-migration-check.sql

echo ""
echo "======================================"
echo "✅ 迁移完成！"
echo "======================================"
echo ""
echo "下一步："
echo "1. 检查上方验证结果（DJ 数量应该还是 200）"
echo "2. 部署后端代码到生产服务器"
echo "3. 上传小程序新版本"
echo ""
