# 数据库迁移工作流程

**本文档是 RateYourDJ 项目的数据库变更标准流程。所有涉及 schema 修改的操作必须遵循此流程。**

---

## 🚨 关键规则

### ❌ 绝对禁止

1. **禁止创建自定义迁移文件夹**
   ```bash
   # ❌ 错误示例
   mkdir database_migrations/
   mkdir db_changes/
   mkdir schema_updates/
   mkdir sql_files/
   ```

2. **禁止随意命名迁移文件**
   ```bash
   # ❌ 错误示例
   touch add_table.sql
   touch new_feature.sql
   touch fix_bug_v2.sql
   ```

3. **禁止修改 database.sql 进行 schema 变更**
   ```bash
   # ❌ 错误示例
   vim ../database.sql  # database.sql 仅用于初始化
   ```

4. **禁止手动在 RDS 执行未追踪的 SQL**
   ```bash
   # ❌ 错误示例
   mysql -h rds-host -u user -p -e "ALTER TABLE users ADD COLUMN ..."
   ```

### ✅ 必须遵守

1. **所有迁移必须在 `migrations/` 目录**
2. **所有迁移必须使用编号命名：`NNN_description.sql`**
3. **所有生产部署必须使用 `scripts/sync-to-rds.sh`**
4. **所有迁移文件必须提交到 Git**

---

## 📋 标准流程

### Step 1: 确定下一个迁移编号

```bash
cd rateyourdj-backend/migrations/

# 查看最新迁移编号
ls -1 [0-9][0-9][0-9]_*.sql | sort | tail -1
# 示例输出: 002_create_reviewer_invite_code.sql

# 下一个编号是 003
```

### Step 2: 创建迁移文件

**命名规范**: `NNN_description.sql`
- `NNN`: 三位数字，零填充（001, 002, 003...，不是 1, 2, 3）
- `description`: 蛇形命名（snake_case），使用动词开头

```bash
# ✅ 正确示例
touch 003_add_user_badges.sql
touch 004_update_dj_rating_precision.sql
touch 010_create_notification_system.sql

# ❌ 错误示例
touch add_badges.sql                # 缺少编号
touch 3_badges.sql                  # 编号未零填充
touch 003-add-badges.sql           # 使用连字符
touch 003_AddBadges.sql            # 使用驼峰命名
```

### Step 3: 编写迁移 SQL

**模板**:

```sql
-- ===================================================================
-- 003_add_user_badges.sql
-- 说明：添加用户徽章系统
-- 作者：Your Name
-- 日期：2026-02-XX
-- 依赖：users 表
-- ===================================================================

-- 创建徽章表
CREATE TABLE IF NOT EXISTS user_badges (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  badge_type VARCHAR(50) NOT NULL,
  badge_name VARCHAR(100) NOT NULL,
  awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_badge_type (badge_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='用户徽章表';

-- 验证表结构
SHOW CREATE TABLE user_badges;

-- 验证索引
SHOW INDEX FROM user_badges;

-- 预期结果：
-- - 表 user_badges 已创建
-- - 包含 2 个索引（idx_user_id, idx_badge_type）
-- - 外键约束已建立
```

**编写要点**:
1. 添加详细注释（说明、作者、日期、依赖）
2. 使用 `IF NOT EXISTS` / `IF EXISTS` 确保幂等性
3. 添加验证 SQL（验证表、索引、约束）
4. 注释说明预期结果

### Step 4: 本地测试

```bash
cd rateyourdj-backend

# 测试迁移
mysql -u root -p rateyourdj < migrations/003_add_user_badges.sql

# 检查结果
mysql -u root -p rateyourdj -e "DESCRIBE user_badges;"
mysql -u root -p rateyourdj -e "SHOW INDEX FROM user_badges;"

# 测试回滚（如果需要）
mysql -u root -p rateyourdj -e "DROP TABLE IF EXISTS user_badges;"

# 再次测试迁移（验证幂等性）
mysql -u root -p rateyourdj < migrations/003_add_user_badges.sql
```

### Step 5: 部署到生产 (RDS)

```bash
cd rateyourdj-backend

# 确保 .env.production 已配置
cat .env.production
# 必须包含：
# DB_HOST=rm-xxxxx.mysql.rds.aliyuncs.com
# DB_PORT=3306
# DB_USER=rateyourdj
# DB_PASSWORD=your_password
# DB_NAME=rateyourdj

# 运行同步脚本
./scripts/sync-to-rds.sh
```

**脚本会自动**:
1. 连接到 RDS
2. 创建 `schema_migrations` 表（如果不存在）
3. 检查已应用的迁移
4. 按顺序应用未应用的迁移（001, 002, 003...）
5. 记录每个迁移到 `schema_migrations`
6. 显示迁移历史和统计信息

**示例输出**:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                      RateYourDJ - RDS 数据库同步
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 配置信息：
  主机:     rm-xxxxx.mysql.rds.aliyuncs.com
  端口:     3306
  数据库:   rateyourdj
  用户:     rateyourdj

🔌 测试 RDS 连接...
✅ 连接成功

📦 应用迁移文件...

⏭️  跳过 001_add_comments.sql（已应用）
⏭️  跳过 002_create_reviewer_invite_code.sql（已应用）
🔄 应用 003_add_user_badges.sql...
✅ 已应用 003_add_user_badges.sql

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 RDS 同步完成！
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

已应用的迁移总数: 3
数据表总数: 15
```

### Step 6: 验证部署

```bash
# 检查迁移历史
mysql -h $DB_HOST -u $DB_USER -p $DB_NAME -e "
  SELECT id, migration_name, applied_at
  FROM schema_migrations
  ORDER BY applied_at DESC
  LIMIT 5;
"

# 验证新表
mysql -h $DB_HOST -u $DB_USER -p $DB_NAME -e "
  SHOW TABLES LIKE 'user_badges';
"

# 验证表结构
mysql -h $DB_HOST -u $DB_USER -p $DB_NAME -e "
  DESCRIBE user_badges;
"
```

### Step 7: 提交到 Git

```bash
git add migrations/003_add_user_badges.sql
git commit -m "Migration: Add user badges system (003)

- Create user_badges table
- Add indexes on user_id and badge_type
- Add foreign key constraint to users table"

# ⚠️ 等待用户确认后再 push
```

---

## 🔍 迁移追踪机制

### schema_migrations 表

`sync-to-rds.sh` 自动创建并维护此表：

```sql
CREATE TABLE schema_migrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  migration_name VARCHAR(255) NOT NULL UNIQUE,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_migration_name (migration_name)
);
```

### 查看迁移历史

```bash
# 方法 1: 使用 MySQL 命令
mysql -h $DB_HOST -u $DB_USER -p $DB_NAME -e "
  SELECT * FROM schema_migrations ORDER BY applied_at DESC;
"

# 方法 2: 使用检查脚本
cd rateyourdj-backend/scripts
./check-rds-status.sh
```

### 手动标记迁移（不推荐）

如果需要手动标记迁移为已应用（例如，迁移在 `schema_migrations` 创建前已执行）：

```sql
INSERT INTO schema_migrations (migration_name)
VALUES ('001_add_comments.sql');
```

---

## 🚨 紧急回滚

### 场景：迁移导致问题

**步骤**:

1. **创建回滚迁移**（不要删除或修改原迁移文件）
   ```bash
   # 假设 003_add_user_badges.sql 有问题
   touch migrations/004_rollback_user_badges.sql
   ```

2. **编写回滚 SQL**
   ```sql
   -- 004_rollback_user_badges.sql
   -- 说明：回滚徽章系统（撤销 003）
   -- 日期：2026-02-XX

   -- 删除表
   DROP TABLE IF EXISTS user_badges;

   -- 验证删除
   SELECT COUNT(*) as table_count
   FROM information_schema.TABLES
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'user_badges';
   -- 预期结果: 0
   ```

3. **测试回滚**
   ```bash
   mysql -u root -p rateyourdj < migrations/004_rollback_user_badges.sql
   ```

4. **部署回滚到 RDS**
   ```bash
   ./scripts/sync-to-rds.sh
   ```

**重要**:
- ⚠️ 不要删除 `migrations/003_add_user_badges.sql`
- ⚠️ 不要修改 `migrations/003_add_user_badges.sql`
- ⚠️ 不要从 `schema_migrations` 表删除记录
- ✅ 总是创建新的迁移来修复问题

---

## 💡 最佳实践

### 1. 幂等性（Idempotency）

迁移应该可以安全地多次运行：

```sql
-- ✅ 幂等迁移
CREATE TABLE IF NOT EXISTS table_name (...);
ALTER TABLE table_name ADD COLUMN IF NOT EXISTS column_name VARCHAR(255);
INSERT INTO table_name (...) VALUES (...)
  ON DUPLICATE KEY UPDATE ...;

-- ❌ 非幂等迁移
CREATE TABLE table_name (...);  -- 第二次运行会报错
ALTER TABLE table_name ADD COLUMN column_name VARCHAR(255);
```

### 2. 原子性

一个迁移只做一件逻辑上的事：

```sql
-- ✅ 好的迁移：专注于徽章系统
CREATE TABLE user_badges (...);
CREATE TABLE badge_types (...);
ALTER TABLE users ADD COLUMN badge_count INT DEFAULT 0;

-- ❌ 坏的迁移：混合多个不相关的功能
CREATE TABLE user_badges (...);
CREATE TABLE notifications (...);  -- 应该是单独的迁移
ALTER TABLE djs ADD COLUMN verified BOOLEAN;  -- 应该是单独的迁移
```

### 3. 验证查询

每个迁移都应该包含验证查询：

```sql
-- 创建表
CREATE TABLE IF NOT EXISTS user_badges (...);

-- ✅ 验证表结构
DESCRIBE user_badges;

-- ✅ 验证索引
SHOW INDEX FROM user_badges;

-- ✅ 验证外键
SELECT
  CONSTRAINT_NAME,
  TABLE_NAME,
  REFERENCED_TABLE_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'user_badges'
  AND REFERENCED_TABLE_NAME IS NOT NULL;

-- ✅ 预期结果说明
-- 预期：应该看到 fk_user_id 外键约束
```

### 4. 数据迁移示例

如果需要迁移数据：

```sql
-- 003_migrate_user_access_levels.sql
-- 说明：将 access_level 从 VARCHAR 改为 ENUM

-- Step 1: 添加临时列
ALTER TABLE users
ADD COLUMN access_level_new ENUM('waitlist', 'full') DEFAULT 'waitlist'
AFTER access_level;

-- Step 2: 迁移数据
UPDATE users
SET access_level_new = CASE
  WHEN access_level = 'waitlist' THEN 'waitlist'
  WHEN access_level = 'full' THEN 'full'
  ELSE 'waitlist'
END;

-- Step 3: 删除旧列
ALTER TABLE users DROP COLUMN access_level;

-- Step 4: 重命名新列
ALTER TABLE users CHANGE COLUMN access_level_new access_level
  ENUM('waitlist', 'full') DEFAULT 'waitlist' NOT NULL;

-- 验证数据迁移
SELECT access_level, COUNT(*) as count
FROM users
GROUP BY access_level;
```

### 5. 索引管理

添加索引时考虑性能影响：

```sql
-- 对于大表，创建索引可能耗时
-- 考虑在低峰时段执行

-- ✅ 好的做法：添加 IF NOT EXISTS
CREATE INDEX IF NOT EXISTS idx_composite
ON large_table(column1, column2, column3 DESC);

-- 如果表很大，可以分步骤
-- 1. 在复制表上测试
-- 2. 在从库上先创建
-- 3. 再在主库创建
```

---

## 🛠️ 常用迁移模板

### 创建表

```sql
-- NNN_add_table_name.sql
CREATE TABLE IF NOT EXISTS table_name (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_status_created (status, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='表描述';

-- 验证
DESCRIBE table_name;
```

### 添加列

```sql
-- NNN_add_column_to_table.sql
ALTER TABLE table_name
ADD COLUMN IF NOT EXISTS new_column VARCHAR(255) DEFAULT NULL
AFTER existing_column;

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_new_column ON table_name(new_column);

-- 验证
DESCRIBE table_name;
SHOW INDEX FROM table_name WHERE Key_name = 'idx_new_column';
```

### 修改列

```sql
-- NNN_modify_column_in_table.sql
ALTER TABLE table_name
MODIFY COLUMN existing_column VARCHAR(500) NOT NULL COMMENT '列说明';

-- 验证
DESCRIBE table_name;
```

### 删除列

```sql
-- NNN_remove_column_from_table.sql
ALTER TABLE table_name
DROP COLUMN IF EXISTS deprecated_column;

-- 验证
DESCRIBE table_name;
```

### 添加外键

```sql
-- NNN_add_foreign_key_to_table.sql
ALTER TABLE table_name
ADD CONSTRAINT fk_table_user
FOREIGN KEY (user_id) REFERENCES users(id)
ON DELETE CASCADE
ON UPDATE CASCADE;

-- 验证
SELECT
  CONSTRAINT_NAME,
  TABLE_NAME,
  REFERENCED_TABLE_NAME,
  DELETE_RULE,
  UPDATE_RULE
FROM information_schema.REFERENTIAL_CONSTRAINTS
WHERE CONSTRAINT_SCHEMA = DATABASE()
  AND TABLE_NAME = 'table_name';
```

---

## 📞 故障排除

### 问题 1: 迁移未被检测到

**症状**: `sync-to-rds.sh` 没有应用新迁移

**排查**:
```bash
# 检查文件命名
ls -1 migrations/[0-9][0-9][0-9]_*.sql

# 检查文件位置（必须在 migrations/ 根目录）
find migrations/ -name "*.sql" -type f

# 检查文件权限
ls -l migrations/003_*.sql
```

### 问题 2: 迁移执行失败

**症状**: 迁移在中途报错

**解决**:
```bash
# 1. 查看错误信息
cat /tmp/migration_error.log

# 2. 本地测试语法
mysql -u root -p rateyourdj < migrations/003_failing.sql

# 3. 从 schema_migrations 删除失败的记录
mysql -h $DB_HOST -u $DB_USER -p $DB_NAME -e "
  DELETE FROM schema_migrations WHERE migration_name = '003_failing.sql';
"

# 4. 修复 SQL 后重新运行
./scripts/sync-to-rds.sh
```

### 问题 3: 重复应用迁移

**症状**: 迁移被应用了两次

**原因**: `schema_migrations` 表中没有正确记录

**解决**:
```sql
-- 检查迁移记录
SELECT * FROM schema_migrations WHERE migration_name = '003_xxx.sql';

-- 如果缺失，手动添加
INSERT INTO schema_migrations (migration_name) VALUES ('003_xxx.sql');
```

---

## 🔗 快捷命令

```bash
# 自动获取下一个迁移编号
cd rateyourdj-backend
NEXT_NUM=$(ls migrations/[0-9][0-9][0-9]_*.sql 2>/dev/null | tail -1 | sed 's/.*\/0*//' | sed 's/_.*//' | awk '{print $1+1}' | xargs printf "%03d")
echo "Next migration number: $NEXT_NUM"

# 创建新迁移模板
cat > migrations/${NEXT_NUM}_your_description.sql <<'EOF'
-- ===================================================================
-- ${NEXT_NUM}_your_description.sql
-- 说明：[描述你的变更]
-- 作者：[你的名字]
-- 日期：$(date +%Y-%m-%d)
-- ===================================================================

-- 在这里编写 SQL

-- 验证查询

EOF

# 测试所有迁移（本地）
for f in migrations/[0-9][0-9][0-9]_*.sql; do
  echo "Testing $f..."
  mysql -u root -p rateyourdj < "$f" || break
done

# 部署到 RDS
cd rateyourdj-backend
./scripts/sync-to-rds.sh
```

---

## 📚 相关文档

- **RDS 同步脚本**: `../scripts/sync-to-rds.sh`
- **RDS 同步文档**: `../scripts/README-SYNC.md`
- **项目主文档**: `../../CLAUDE.md`
- **迁移历史**: 查看 `git log -- migrations/`

---

**最后更新**: 2026-02-09
**维护者**: RateYourDJ Team

**问题反馈**: 如遇到迁移相关问题，请联系项目维护者或查阅 CLAUDE.md 中的"Database Migration Workflow"部分。
