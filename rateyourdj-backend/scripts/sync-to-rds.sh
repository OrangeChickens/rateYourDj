#!/bin/bash

# RDS 数据库同步脚本
# 自动应用 migrations/ 目录下的编号迁移文件（001_xxx.sql, 002_xxx.sql）
# 支持阿里云 RDS 和 AWS RDS

set -e  # 遇到错误立即退出

# 输出颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # 无颜色

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "                      RateYourDJ - RDS 数据库同步"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 加载生产环境配置
if [ ! -f .env.production ]; then
    echo -e "${RED}❌ 错误：未找到 .env.production 文件${NC}"
    echo ""
    echo "请创建 .env.production 文件并填入 RDS 凭证："
    echo ""
    echo "阿里云 RDS 示例："
    echo "  DB_HOST=rm-xxxxx.mysql.rds.aliyuncs.com"
    echo "  DB_PORT=3306"
    echo "  DB_USER=rateyourdj"
    echo "  DB_PASSWORD=你的密码"
    echo "  DB_NAME=rateyourdj"
    exit 1
fi

# 加载环境变量
export $(grep -v '^#' .env.production | xargs)

# 验证必需的变量
if [ -z "$DB_HOST" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ] || [ -z "$DB_NAME" ]; then
    echo -e "${RED}❌ 错误：缺少必需的数据库配置${NC}"
    echo "请确保 .env.production 包含：DB_HOST, DB_USER, DB_PASSWORD, DB_NAME"
    exit 1
fi

echo -e "${YELLOW}📋 配置信息：${NC}"
echo "  主机:     $DB_HOST"
echo "  端口:     ${DB_PORT:-3306}"
echo "  数据库:   $DB_NAME"
echo "  用户:     $DB_USER"
echo ""

# 测试连接
echo -e "${YELLOW}🔌 测试 RDS 连接...${NC}"
if ! mysql -h "$DB_HOST" -P "${DB_PORT:-3306}" -u "$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1" >/dev/null 2>&1; then
    echo -e "${RED}❌ 连接失败${NC}"
    echo ""
    echo "请检查："
    echo "  1. RDS 凭证是否正确"
    echo "  2. 阿里云 RDS：是否已添加本机 IP 到白名单"
    echo "  3. AWS RDS：安全组是否允许本机 IP (端口 3306)"
    echo "  4. 网络连接是否正常"
    exit 1
fi
echo -e "${GREEN}✅ 连接成功${NC}"
echo ""

# 创建数据库（如果不存在）
echo -e "${YELLOW}🗄️  检查数据库...${NC}"
mysql -h "$DB_HOST" -P "${DB_PORT:-3306}" -u "$DB_USER" -p"$DB_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
echo -e "${GREEN}✅ 数据库就绪${NC}"
echo ""

# 创建迁移追踪表（如果不存在）
echo -e "${YELLOW}📝 设置迁移追踪...${NC}"
mysql -h "$DB_HOST" -P "${DB_PORT:-3306}" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" <<EOF
CREATE TABLE IF NOT EXISTS schema_migrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  migration_name VARCHAR(255) NOT NULL UNIQUE,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_migration_name (migration_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
EOF
echo -e "${GREEN}✅ 迁移追踪就绪${NC}"
echo ""

# 函数：检查迁移是否已应用
is_migration_applied() {
    local migration_name=$1
    local result=$(mysql -h "$DB_HOST" -P "${DB_PORT:-3306}" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -sN -e "SELECT COUNT(*) FROM schema_migrations WHERE migration_name = '$migration_name'")
    [ "$result" -gt 0 ]
}

# 函数：标记迁移为已应用
mark_migration_applied() {
    local migration_name=$1
    mysql -h "$DB_HOST" -P "${DB_PORT:-3306}" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "INSERT INTO schema_migrations (migration_name) VALUES ('$migration_name')"
}

# 函数：应用迁移文件
apply_migration() {
    local file=$1
    local basename=$(basename "$file")

    # 检查是否已应用
    if is_migration_applied "$basename"; then
        echo -e "${YELLOW}⏭️  跳过 $basename（已应用）${NC}"
        return
    fi

    echo -e "${YELLOW}🔄 应用 $basename...${NC}"

    # 执行 SQL 文件
    if mysql -h "$DB_HOST" -P "${DB_PORT:-3306}" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$file"; then
        # 标记为已应用
        mark_migration_applied "$basename"
        echo -e "${GREEN}✅ 已应用 $basename${NC}"
    else
        echo -e "${RED}❌ 应用失败 $basename${NC}"
        exit 1
    fi
}

# 按顺序应用迁移
echo -e "${YELLOW}📦 应用迁移文件...${NC}"
echo ""

# 从 migrations/ 目录按顺序应用编号迁移
if [ -d "migrations" ]; then
    # 查找所有编号迁移文件（001_xxx.sql, 002_xxx.sql 等）并排序
    for migration in $(find migrations -name '[0-9][0-9][0-9]_*.sql' -type f | sort); do
        if [ -f "$migration" ]; then
            apply_migration "$migration"
            echo ""
        fi
    done
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🎉 RDS 同步完成！${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 显示已应用的迁移数量
MIGRATION_COUNT=$(mysql -h "$DB_HOST" -P "${DB_PORT:-3306}" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -sN -e "SELECT COUNT(*) FROM schema_migrations")
echo -e "${GREEN}已应用的迁移总数: $MIGRATION_COUNT${NC}"
echo ""

# 显示表数量
TABLE_COUNT=$(mysql -h "$DB_HOST" -P "${DB_PORT:-3306}" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -sN -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$DB_NAME'")
echo -e "${GREEN}数据表总数: $TABLE_COUNT${NC}"
echo ""

# 显示最近的迁移
echo -e "${YELLOW}📋 最近的迁移记录：${NC}"
mysql -h "$DB_HOST" -P "${DB_PORT:-3306}" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SELECT id, migration_name, applied_at FROM schema_migrations ORDER BY applied_at DESC LIMIT 10"
echo ""

echo -e "${GREEN}✨ 完成！${NC}"
