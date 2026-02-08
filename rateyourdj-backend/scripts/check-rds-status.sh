#!/bin/bash

# RDS 数据库状态检查脚本
# 显示当前数据库状态，不应用任何更改
# 支持阿里云 RDS 和 AWS RDS

set -e  # 遇到错误立即退出

# 输出颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'  # 无颜色

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "                      RateYourDJ - RDS 状态检查"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 加载生产环境配置
if [ ! -f .env.production ]; then
    echo -e "${RED}❌ 错误：未找到 .env.production 文件${NC}"
    exit 1
fi

export $(grep -v '^#' .env.production | xargs)

if [ -z "$DB_HOST" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ] || [ -z "$DB_NAME" ]; then
    echo -e "${RED}❌ 错误：缺少数据库配置${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 配置信息：${NC}"
echo "  主机:     $DB_HOST"
echo "  端口:     ${DB_PORT:-3306}"
echo "  数据库:   $DB_NAME"
echo "  用户:     $DB_USER"
echo ""

# 测试连接
echo -e "${YELLOW}🔌 测试连接...${NC}"
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

# 检查数据库是否存在
DB_EXISTS=$(mysql -h "$DB_HOST" -P "${DB_PORT:-3306}" -u "$DB_USER" -p"$DB_PASSWORD" -sN -e "SELECT COUNT(*) FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = '$DB_NAME'")

if [ "$DB_EXISTS" -eq 0 ]; then
    echo -e "${YELLOW}⚠️  数据库 '$DB_NAME' 不存在${NC}"
    echo ""
    echo "运行 sync-to-rds.sh 创建并初始化数据库"
    exit 0
fi

echo -e "${GREEN}✅ 数据库存在${NC}"
echo ""

# 显示表信息
echo -e "${YELLOW}📊 数据表：${NC}"
TABLE_COUNT=$(mysql -h "$DB_HOST" -P "${DB_PORT:-3306}" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -sN -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$DB_NAME'")
echo -e "  总数: ${GREEN}$TABLE_COUNT${NC}"
echo ""

mysql -h "$DB_HOST" -P "${DB_PORT:-3306}" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "
SELECT
  TABLE_NAME as '表名',
  TABLE_ROWS as '行数',
  ROUND(DATA_LENGTH/1024/1024, 2) as '大小(MB)'
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = '$DB_NAME'
ORDER BY TABLE_NAME
"
echo ""

# 检查迁移追踪表是否存在
MIGRATIONS_EXISTS=$(mysql -h "$DB_HOST" -P "${DB_PORT:-3306}" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -sN -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$DB_NAME' AND table_name = 'schema_migrations'")

if [ "$MIGRATIONS_EXISTS" -eq 0 ]; then
    echo -e "${YELLOW}⚠️  迁移追踪未设置${NC}"
    echo "  运行 sync-to-rds.sh 初始化迁移追踪"
else
    echo -e "${YELLOW}📝 已应用的迁移：${NC}"
    MIGRATION_COUNT=$(mysql -h "$DB_HOST" -P "${DB_PORT:-3306}" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -sN -e "SELECT COUNT(*) FROM schema_migrations")
    echo -e "  总数: ${GREEN}$MIGRATION_COUNT${NC}"
    echo ""

    mysql -h "$DB_HOST" -P "${DB_PORT:-3306}" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "
    SELECT
      id as 'ID',
      migration_name as '迁移文件',
      applied_at as '应用时间'
    FROM schema_migrations
    ORDER BY applied_at DESC
    LIMIT 10
    "
fi

echo ""

# 显示待应用的迁移
echo -e "${YELLOW}📦 待应用的迁移：${NC}"

# 函数：检查迁移是否已应用
is_applied() {
    local migration=$1
    if [ "$MIGRATIONS_EXISTS" -eq 0 ]; then
        echo "0"
        return
    fi
    mysql -h "$DB_HOST" -P "${DB_PORT:-3306}" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -sN -e "SELECT COUNT(*) FROM schema_migrations WHERE migration_name = '$migration'" 2>/dev/null || echo "0"
}

PENDING_COUNT=0

# 检查 migrations/ 目录下的编号迁移
if [ -d "migrations" ]; then
    for migration_file in $(find migrations -name '[0-9][0-9][0-9]_*.sql' -type f | sort); do
        migration=$(basename "$migration_file")
        if [ "$(is_applied "$migration")" -eq 0 ]; then
            echo -e "  ${BLUE}→${NC} $migration"
            ((PENDING_COUNT++))
        fi
    done
fi

if [ $PENDING_COUNT -eq 0 ]; then
    echo -e "  ${GREEN}✅ 所有迁移已应用${NC}"
else
    echo ""
    echo -e "  ${YELLOW}运行 ./scripts/sync-to-rds.sh 应用 $PENDING_COUNT 个待处理迁移${NC}"
fi

echo ""
echo -e "${GREEN}✨ 状态检查完成${NC}"
