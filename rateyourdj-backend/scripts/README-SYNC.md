# RDS 同步脚本使用说明

## 快速开始

### 1. 配置 RDS 凭证

编辑 `.env.rds` 文件：

```bash
RDS_HOST=你的RDS地址.rds.amazonaws.com
RDS_PORT=3306
RDS_USER=admin
RDS_PASSWORD=你的密码
RDS_DB_NAME=rateyourdj
```

### 2. 检查状态（可选）

```bash
./scripts/check-rds-status.sh
```

会显示：
- ✅ 连接状态
- 📊 现有表格和数据
- 📝 已应用的迁移
- 📦 待应用的迁移

### 3. 同步到 RDS

```bash
./scripts/sync-to-rds.sh
```

## 工作原理

### 🔒 安全保证

脚本使用 `schema_migrations` 表追踪已应用的迁移：

- ✅ **幂等性**：多次运行安全，已应用的迁移会自动跳过
- ✅ **顺序保证**：按文件名排序应用（001, 002, 003...）
- ✅ **只应用 numbered migrations**：只处理 `migrations/` 目录下的 `001_xxx.sql`, `002_xxx.sql` 等文件
- ✅ **自动跳过**：rollback、check、update_tags 等文件会被忽略

### 📋 当前迁移列表

```
migrations/
├── 001_add_waitlist_and_tasks_fixed.sql  ← 已应用（Waitlist + 任务系统）
├── 002_add_comments.sql                  ← 新的（评论系统）
├── rollback_partial.sql                  ← 不会被应用（没有数字前缀）
├── update_tags_20260206.sql              ← 不会被应用（没有数字前缀）
└── ...其他文件
```

### 🎯 只会同步 002_add_comments.sql

因为：
- `001_add_waitlist_and_tasks_fixed.sql` 已经在 RDS 的 `schema_migrations` 表中记录
- `002_add_comments.sql` 是新的，会被应用
- 其他文件没有 `001_`, `002_` 等前缀，会被忽略

## 迁移记录表

脚本会自动创建 `schema_migrations` 表：

```sql
CREATE TABLE schema_migrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  migration_name VARCHAR(255) NOT NULL UNIQUE,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

查看已应用的迁移：

```bash
mysql -h <RDS_HOST> -u <USER> -p<PASSWORD> <DB_NAME> -e \
  "SELECT * FROM schema_migrations ORDER BY applied_at DESC"
```

## 手动标记迁移

如果某个迁移已经手动应用过，可以标记为已完成：

```bash
mysql -h <RDS_HOST> -u <USER> -p<PASSWORD> <DB_NAME> -e \
  "INSERT INTO schema_migrations (migration_name) VALUES ('002_add_comments.sql')"
```

## 预期输出

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                      RateYourDJ - RDS Database Sync
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Configuration:
  Host:     rateyourdj.xxxxx.rds.amazonaws.com
  Port:     3306
  Database: rateyourdj
  User:     admin

🔌 Testing RDS connection...
✅ Connection successful

🗄️  Checking database...
✅ Database ready

📝 Setting up migration tracking...
✅ Migration tracking ready

📦 Applying migrations...

⏭️  Skipping 001_add_waitlist_and_tasks_fixed.sql (already applied)

🔄 Applying 002_add_comments.sql...
✅ Applied 002_add_comments.sql

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 RDS sync completed successfully!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total migrations applied: 2
Total tables: 13

📋 Recent migrations:
+----+---------------------------------------+---------------------+
| id | migration_name                        | applied_at          |
+----+---------------------------------------+---------------------+
|  2 | 002_add_comments.sql                  | 2026-02-08 18:00:00 |
|  1 | 001_add_waitlist_and_tasks_fixed.sql  | 2026-02-06 10:00:00 |
+----+---------------------------------------+---------------------+

✨ Done!
```

## 002_add_comments.sql 包含什么？

新的评论系统迁移包括：

### 1. review_comments 表（评论表）

```sql
CREATE TABLE review_comments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  review_id INT NOT NULL,
  parent_comment_id INT NULL,  -- NULL = 顶级评论
  user_id INT NOT NULL,
  content TEXT NOT NULL,
  vote_score INT DEFAULT 0,    -- 投票分数（upvotes - downvotes）
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_comment_id) REFERENCES review_comments(id) ON DELETE CASCADE
);
```

### 2. comment_votes 表（评论投票表）

```sql
CREATE TABLE comment_votes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  comment_id INT NOT NULL,
  user_id INT NOT NULL,
  vote_type ENUM('upvote', 'downvote') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (comment_id) REFERENCES review_comments(id) ON DELETE CASCADE,
  UNIQUE KEY unique_vote (comment_id, user_id)
);
```

### 功能特性

- ✅ Reddit 风格嵌套评论（最多 3 层）
- ✅ Upvote/Downvote 投票系统
- ✅ 级联删除（删除评价时自动删除评论）
- ✅ 投票唯一性（每个用户对每条评论只能投一票）

## 常见问题

### Q: 重复运行会有问题吗？

A: **不会**。脚本会检查 `schema_migrations` 表，跳过已应用的迁移。

### Q: 如何只同步 002_add_comments.sql？

A: 脚本会自动判断。如果 `001_add_waitlist_and_tasks_fixed.sql` 已经在 `schema_migrations` 表中，就会跳过它，只应用 `002_add_comments.sql`。

### Q: 连接失败怎么办？

A: 检查：
1. RDS 安全组是否允许你的 IP（端口 3306）
2. RDS 是否设置为公开访问
3. `.env.rds` 中的用户名、密码是否正确

### Q: 迁移失败怎么办？

A: 查看错误信息，如果表已存在，可以手动标记为已应用（见上面"手动标记迁移"部分）。

## 下一步

同步完成后，更新应用配置连接到 RDS：

```bash
# .env (生产环境)
DB_HOST=你的RDS地址.rds.amazonaws.com
DB_PORT=3306
DB_USER=admin
DB_PASSWORD=你的密码
DB_NAME=rateyourdj
```

重启应用即可！
