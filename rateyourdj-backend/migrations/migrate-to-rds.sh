#!/bin/bash

# ===================================================================
# RDS迁移脚本 - 标签更新
# 说明：自动化执行标签迁移到阿里云RDS
# ===================================================================

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 配置信息
echo "====================================================================="
echo "           RDS 数据库标签迁移脚本"
echo "====================================================================="
echo ""

# 获取RDS连接信息
read -p "请输入RDS主机地址 (例: rm-xxxxx.mysql.rds.aliyuncs.com): " RDS_HOST
read -p "请输入端口 [默认: 3306]: " RDS_PORT
RDS_PORT=${RDS_PORT:-3306}
read -p "请输入数据库名 [默认: rateyourdj]: " DB_NAME
DB_NAME=${DB_NAME:-rateyourdj}
read -p "请输入用户名: " DB_USER
read -sp "请输入密码: " DB_PASSWORD
echo ""

# 构建连接命令
MYSQL_CMD="mysql -h ${RDS_HOST} -P ${RDS_PORT} -u ${DB_USER} -p${DB_PASSWORD} --default-character-set=utf8mb4"

# 步骤1: 测试连接
log_info "步骤 1/5: 测试数据库连接..."
if ${MYSQL_CMD} -e "SELECT 1" > /dev/null 2>&1; then
    log_info "✓ 数据库连接成功"
else
    log_error "✗ 数据库连接失败，请检查连接信息和白名单配置"
    exit 1
fi

# 步骤2: 检查表是否存在
log_info "步骤 2/5: 检查表结构..."
TABLE_EXISTS=$(${MYSQL_CMD} ${DB_NAME} -e "SHOW TABLES LIKE 'preset_tags';" 2>/dev/null | grep -c "preset_tags" || true)
if [ "$TABLE_EXISTS" -eq "0" ]; then
    log_error "✗ preset_tags 表不存在"
    exit 1
else
    log_info "✓ preset_tags 表存在"
fi

# 步骤3: 备份数据
log_info "步骤 3/5: 备份现有标签数据..."
BACKUP_FILE="preset_tags_backup_$(date +%Y%m%d_%H%M%S).sql"
mysqldump -h ${RDS_HOST} -P ${RDS_PORT} -u ${DB_USER} -p${DB_PASSWORD} \
    --single-transaction \
    --default-character-set=utf8mb4 \
    ${DB_NAME} preset_tags > ${BACKUP_FILE} 2>/dev/null

if [ -f "${BACKUP_FILE}" ]; then
    log_info "✓ 备份已保存到: ${BACKUP_FILE}"
else
    log_error "✗ 备份失败"
    exit 1
fi

# 显示当前标签统计
log_info "当前标签统计："
${MYSQL_CMD} ${DB_NAME} -e "SELECT category, COUNT(*) as count FROM preset_tags GROUP BY category;"

# 步骤4: 确认执行
echo ""
log_warn "即将执行迁移，这将："
echo "  - 删除所有现有的 performance 和 personality 标签"
echo "  - 插入新的精简标签（每类5个）"
echo "  - 不影响已有评论中的标签数据"
echo ""
read -p "确认执行迁移？(yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    log_warn "迁移已取消"
    log_info "备份文件已保存: ${BACKUP_FILE}"
    exit 0
fi

# 步骤5: 执行迁移
log_info "步骤 4/5: 执行迁移脚本..."
MIGRATION_FILE="update_tags_20260206.sql"

if [ ! -f "${MIGRATION_FILE}" ]; then
    log_error "✗ 迁移脚本不存在: ${MIGRATION_FILE}"
    exit 1
fi

${MYSQL_CMD} ${DB_NAME} < ${MIGRATION_FILE}

if [ $? -eq 0 ]; then
    log_info "✓ 迁移执行成功"
else
    log_error "✗ 迁移执行失败"
    log_warn "正在从备份恢复..."
    ${MYSQL_CMD} ${DB_NAME} < ${BACKUP_FILE}
    log_info "已恢复到迁移前状态"
    exit 1
fi

# 步骤6: 验证结果
log_info "步骤 5/5: 验证迁移结果..."
echo ""
log_info "新的标签统计："
${MYSQL_CMD} ${DB_NAME} -e "SELECT category, COUNT(*) as count FROM preset_tags GROUP BY category;"

echo ""
log_info "Performance 标签："
${MYSQL_CMD} ${DB_NAME} -e "SELECT id, tag_name, tag_name_en FROM preset_tags WHERE category='performance' ORDER BY id;"

echo ""
log_info "Personality 标签："
${MYSQL_CMD} ${DB_NAME} -e "SELECT id, tag_name, tag_name_en FROM preset_tags WHERE category='personality' ORDER BY id;"

# 完成
echo ""
echo "====================================================================="
log_info "✓ 迁移完成！"
echo "====================================================================="
echo ""
log_info "备份文件: ${BACKUP_FILE}"
log_warn "请保留备份文件，以便需要时回滚"
echo ""
log_info "后续步骤："
echo "  1. 测试小程序'写评价'功能"
echo "  2. 确认新标签显示正常"
echo "  3. 如有问题，运行以下命令回滚："
echo "     mysql -h ${RDS_HOST} -P ${RDS_PORT} -u ${DB_USER} -p ${DB_NAME} < ${BACKUP_FILE}"
echo ""
