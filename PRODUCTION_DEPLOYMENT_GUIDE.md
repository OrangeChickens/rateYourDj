# 生产环境部署指南 - Waitlist & Task System

**⚠️ 重要提醒**: 此操作会修改生产数据库结构，请务必按照步骤操作并做好备份！

---

## 前置准备

### 1. 获取阿里云 RDS 连接信息

确保你有以下信息：
- RDS 实例地址 (例如: `rm-xxx.mysql.rds.aliyuncs.com`)
- 端口 (通常是 3306)
- 数据库名 (例如: `rateyourdj`)
- 用户名 (例如: `root` 或其他管理员账号)
- 密码

### 2. 确认网络访问权限

检查你的本地 IP 是否在 RDS 白名单中：
1. 登录阿里云控制台
2. 进入 RDS 实例管理页面
3. 点击 "数据安全性" → "白名单设置"
4. 确认你的 IP 地址在白名单中（或添加临时访问权限）

### 3. 安装 MySQL 客户端

确保本地已安装 MySQL 客户端：
```bash
# macOS
brew install mysql-client

# 检查版本
mysql --version
```

---

## 部署步骤

### 步骤 1: 备份生产数据库 ⚠️

**在进行任何修改之前，必须先备份！**

#### 方法 A: 使用阿里云 RDS 自动备份（推荐）

1. 登录阿里云 RDS 控制台
2. 进入你的 RDS 实例
3. 点击 "备份恢复" → "备份实例"
4. 选择 "物理备份" 或 "逻辑备份"
5. 点击 "确定" 创建手动备份
6. **等待备份完成后再继续！**

#### 方法 B: 使用 mysqldump 手动备份

```bash
# 连接信息（请替换为你的实际信息）
RDS_HOST="rm-xxx.mysql.rds.aliyuncs.com"
RDS_PORT="3306"
RDS_USER="root"
RDS_DB="rateyourdj"

# 创建备份目录
mkdir -p ~/rateyourdj-backups
cd ~/rateyourdj-backups

# 备份整个数据库
mysqldump -h $RDS_HOST -P $RDS_PORT -u $RDS_USER -p \
  --single-transaction \
  --routines \
  --triggers \
  --databases $RDS_DB \
  > "rateyourdj_backup_$(date +%Y%m%d_%H%M%S).sql"

# 验证备份文件
ls -lh rateyourdj_backup_*.sql
```

**记录备份文件名，以便需要时回滚！**

---

### 步骤 2: 检查当前数据库状态

```bash
# 连接到生产数据库
mysql -h $RDS_HOST -P $RDS_PORT -u $RDS_USER -p $RDS_DB

# 或者交互式输入连接信息
mysql -h rm-xxx.mysql.rds.aliyuncs.com -P 3306 -u root -p rateyourdj
```

**在 MySQL 命令行中执行：**

```sql
-- 检查 users 表是否已有 access_level 列（不应该有）
SHOW COLUMNS FROM users LIKE 'access_level';

-- 检查是否已有 task_configs 表（不应该有）
SHOW TABLES LIKE 'task_configs';

-- 检查当前用户数量（记录下来）
SELECT COUNT(*) as total_users FROM users;

-- 退出
EXIT;
```

**如果发现已存在这些字段/表，说明已经执行过迁移，不要重复执行！**

---

### 步骤 3: 修改迁移脚本（重要！）

因为生产环境已有用户，我们需要修改迁移脚本，确保现有用户自动获得 `full` 访问权限。

**检查迁移脚本是否正确：**

```bash
# 查看迁移脚本
cat rateyourdj-backend/migrations/001_add_waitlist_and_tasks.sql | grep "UPDATE users"
```

**应该看到这行：**
```sql
UPDATE users SET access_level = 'full', access_granted_at = NOW() WHERE access_level = 'waitlist';
```

这会确保所有现有用户都获得 full 访问权限！

---

### 步骤 4: 执行数据库迁移

#### 方法 A: 直接在 MySQL 客户端执行（推荐）

```bash
# 连接到生产数据库
mysql -h $RDS_HOST -P $RDS_PORT -u $RDS_USER -p $RDS_DB

# 在 MySQL 命令行中执行迁移
source /Users/yichengliang/Desktop/ws/rateyourdj/rateyourdj-backend/migrations/001_add_waitlist_and_tasks.sql

# 或者使用绝对路径
```

#### 方法 B: 使用管道执行

```bash
mysql -h $RDS_HOST -P $RDS_PORT -u $RDS_USER -p $RDS_DB < \
  /Users/yichengliang/Desktop/ws/rateyourdj/rateyourdj-backend/migrations/001_add_waitlist_and_tasks.sql
```

**等待执行完成（可能需要几秒到几分钟，取决于现有数据量）**

---

### 步骤 5: 验证迁移结果

```bash
# 重新连接数据库
mysql -h $RDS_HOST -P $RDS_PORT -u $RDS_USER -p $RDS_DB
```

**在 MySQL 命令行中执行验证查询：**

```sql
-- 1. 检查 users 表新增字段
SHOW COLUMNS FROM users LIKE 'access_level';
SHOW COLUMNS FROM users LIKE 'invite_quota';
SHOW COLUMNS FROM users LIKE 'invited_by';

-- 2. 确认所有现有用户都是 full 访问权限
SELECT access_level, COUNT(*) as count
FROM users
GROUP BY access_level;
-- 应该看到: full | <用户数量>

-- 3. 检查新表是否创建成功
SHOW TABLES LIKE 'task_configs';
SHOW TABLES LIKE 'user_tasks';
SHOW TABLES LIKE 'invite_codes';
SHOW TABLES LIKE 'waitlist';

-- 4. 检查任务配置是否插入成功
SELECT COUNT(*) as total_tasks FROM task_configs;
-- 应该返回: 9

SELECT task_code, task_name, reward FROM task_configs ORDER BY sort_order;
-- 应该看到 9 个任务

-- 5. 检查测试邀请码（如果执行了 generate-invite-codes.sql）
SELECT COUNT(*) as total_codes FROM invite_codes;
SELECT code, usage_limit FROM invite_codes WHERE is_admin_code = TRUE;

-- 6. 检查现有用户的 invite_quota（应该都是 0）
SELECT MIN(invite_quota) as min_quota, MAX(invite_quota) as max_quota
FROM users;
-- 应该返回: 0, 0

EXIT;
```

**如果所有检查都通过，迁移成功！✅**

---

### 步骤 6: 生成测试邀请码（可选但推荐）

如果你想在生产环境生成一些测试邀请码供初期测试使用：

```bash
# 连接到生产数据库
mysql -h $RDS_HOST -P $RDS_PORT -u $RDS_USER -p $RDS_DB

# 执行测试邀请码生成脚本
source /Users/yichengliang/Desktop/ws/rateyourdj/rateyourdj-backend/scripts/generate-invite-codes.sql
```

**或者手动插入几个邀请码：**

```sql
INSERT INTO invite_codes (code, created_by, usage_limit, is_admin_code, created_at) VALUES
('UDISK-PROD01', NULL, 1, TRUE, NOW()),
('UDISK-PROD02', NULL, 1, TRUE, NOW()),
('UDISK-PROD03', NULL, 1, TRUE, NOW()),
('UDISK-VIP', NULL, 10, TRUE, NOW()),
('UDISK-UNLIMITED', NULL, 999999, TRUE, NOW());

SELECT * FROM invite_codes WHERE is_admin_code = TRUE;
EXIT;
```

**保存这些邀请码供测试使用！**

---

### 步骤 7: 部署后端代码

#### 7.1 连接到生产服务器

```bash
# SSH 连接到你的生产服务器
ssh your-username@your-server-ip

# 或者使用阿里云 ECS 控制台的 Web 终端
```

#### 7.2 拉取最新代码

```bash
# 进入后端目录
cd /path/to/rateyourdj-backend

# 拉取最新代码
git fetch origin
git checkout feature/waitlist-task-system
git pull origin feature/waitlist-task-system

# 或者如果你已经 merge 到 main
git checkout main
git pull origin main
```

#### 7.3 安装依赖（如果有新依赖）

```bash
npm install
```

#### 7.4 重启后端服务

```bash
# 如果使用 PM2
pm2 restart rateyourdj
pm2 logs rateyourdj --lines 50

# 如果使用其他进程管理器
# systemctl restart rateyourdj
# 或者
# npm run dev
```

#### 7.5 验证后端 API

```bash
# 健康检查
curl https://rateyourdj.pbrick.cn/health

# 测试任务列表接口（需要 token）
curl -X GET https://rateyourdj.pbrick.cn/api/tasks/list \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 测试访问级别检查接口
curl -X GET https://rateyourdj.pbrick.cn/api/auth/check-access \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 步骤 8: 部署前端代码

#### 8.1 在本地更新小程序代码

```bash
# 确保在正确的分支
cd /Users/yichengliang/Desktop/ws/rateyourdj/rateyourdj-miniprogram
git status

# 如果还在 feature 分支，先 merge 到 main
git checkout main
git merge feature/waitlist-task-system
git push origin main
```

#### 8.2 在微信开发者工具中上传

1. 打开微信开发者工具
2. 打开项目：`rateyourdj-miniprogram/`
3. 确认 `app.js` 中的 `apiBaseUrl` 指向生产环境：
   ```javascript
   apiBaseUrl: 'https://rateyourdj.pbrick.cn/api'
   ```
4. 点击右上角 "上传"
5. 填写版本号（例如：`v1.1.0 - 添加 Waitlist 和任务系统`）
6. 填写项目备注
7. 上传完成

#### 8.3 提交微信审核

1. 登录微信公众平台
2. 进入 "开发管理" → "版本管理"
3. 找到刚上传的版本
4. 点击 "提交审核"
5. 填写审核信息（功能说明、测试账号等）
6. 等待审核通过（通常 1-7 天）

#### 8.4 审核通过后发布

1. 审核通过后，点击 "发布"
2. 用户将在下次启动小程序时获得更新

---

## 测试清单

### 后端测试

```bash
# 1. 测试新用户登录（应该进入 waitlist）
curl -X POST https://rateyourdj.pbrick.cn/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "code": "WECHAT_LOGIN_CODE",
    "userInfo": {
      "nickname": "测试用户",
      "avatar_url": "https://example.com/avatar.jpg"
    }
  }'
# 检查返回的 user.access_level 是否为 "waitlist"

# 2. 测试使用邀请码
curl -X POST https://rateyourdj.pbrick.cn/api/auth/use-invite-code \
  -H "Authorization: Bearer NEW_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code": "UDISK-PROD01"}'
# 检查是否返回 success: true

# 3. 测试任务列表
curl -X GET https://rateyourdj.pbrick.cn/api/tasks/list \
  -H "Authorization: Bearer USER_TOKEN"
# 检查是否返回 9 个任务

# 4. 测试生成邀请码（需要先有 invite_quota）
curl -X POST https://rateyourdj.pbrick.cn/api/invite/generate \
  -H "Authorization: Bearer USER_TOKEN"
# 如果 quota=0，应该返回错误
```

### 前端测试（小程序）

1. **新用户流程**：
   - 登录 → 看到 Waitlist 页面 ✓
   - 输入邀请码 → 升级到 full 访问 ✓
   - 跳转到首页，能正常使用 ✓

2. **任务系统流程**：
   - 进入 "任务" 页面 ✓
   - 看到 9 个任务，分类显示 ✓
   - 完成一个评价 → first_review 任务完成 ✓
   - 点击领取 → invite_quota +1 ✓

3. **邀请码管理流程**：
   - 进入 "我的邀请码" 页面 ✓
   - 生成邀请码 → quota -1 ✓
   - 复制邀请码 ✓
   - 分享邀请码 ✓

4. **现有用户测试**：
   - 现有用户登录 → 直接进入首页（不看到 waitlist）✓
   - 可以正常使用所有功能 ✓
   - 可以查看任务并完成 ✓

---

## 回滚方案（如果出现问题）

### 场景 1: 数据库迁移失败

```bash
# 使用之前的备份恢复
mysql -h $RDS_HOST -P $RDS_PORT -u $RDS_USER -p $RDS_DB < ~/rateyourdj-backups/rateyourdj_backup_YYYYMMDD_HHMMSS.sql
```

### 场景 2: 数据库迁移成功，但后端出现问题

```bash
# 回滚后端代码到之前的版本
cd /path/to/rateyourdj-backend
git checkout main  # 或者之前的 commit hash
pm2 restart rateyourdj
```

### 场景 3: 需要完全回滚数据库更改

**⚠️ 警告：这会删除所有任务和邀请码数据！**

```sql
-- 连接数据库
mysql -h $RDS_HOST -P $RDS_PORT -u $RDS_USER -p $RDS_DB

-- 删除新增的表
DROP TABLE IF EXISTS user_tasks;
DROP TABLE IF EXISTS task_configs;
DROP TABLE IF EXISTS invite_codes;
DROP TABLE IF EXISTS waitlist;

-- 删除 users 表的新增列
ALTER TABLE users
  DROP COLUMN IF EXISTS access_level,
  DROP COLUMN IF EXISTS invite_quota,
  DROP COLUMN IF EXISTS invites_sent,
  DROP COLUMN IF EXISTS invites_accepted,
  DROP COLUMN IF EXISTS invited_by,
  DROP COLUMN IF EXISTS invite_code_used,
  DROP COLUMN IF EXISTS waitlist_position,
  DROP COLUMN IF EXISTS waitlist_joined_at,
  DROP COLUMN IF EXISTS access_granted_at;

EXIT;
```

---

## 监控建议

部署后，建议监控以下指标：

1. **用户访问分布**：
   ```sql
   SELECT access_level, COUNT(*) FROM users GROUP BY access_level;
   ```

2. **邀请码使用情况**：
   ```sql
   SELECT
     COUNT(*) as total_codes,
     SUM(used_count) as total_uses,
     AVG(used_count) as avg_uses_per_code
   FROM invite_codes;
   ```

3. **任务完成率**：
   ```sql
   SELECT
     tc.task_code,
     tc.task_name,
     COUNT(DISTINCT ut.user_id) as users_with_task,
     SUM(ut.completed) as completed_count,
     ROUND(SUM(ut.completed) * 100.0 / COUNT(DISTINCT ut.user_id), 2) as completion_rate
   FROM task_configs tc
   LEFT JOIN user_tasks ut ON tc.task_code = ut.task_code
   GROUP BY tc.task_code, tc.task_name;
   ```

4. **邀请增长率**：
   ```sql
   SELECT
     DATE(access_granted_at) as date,
     COUNT(*) as new_full_users,
     SUM(CASE WHEN invited_by IS NOT NULL THEN 1 ELSE 0 END) as invited_users
   FROM users
   WHERE access_granted_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
   GROUP BY DATE(access_granted_at)
   ORDER BY date DESC;
   ```

---

## 常见问题

### Q1: 迁移脚本执行时间过长怎么办？

A: 如果现有用户很多（>10万），可以考虑：
1. 在低峰期执行（凌晨）
2. 分批执行 ALTER TABLE 语句
3. 使用 pt-online-schema-change 工具

### Q2: 迁移后现有用户能否正常使用？

A: 可以！迁移脚本会自动将所有现有用户的 `access_level` 设置为 `full`，他们不会受到任何影响。

### Q3: 如何批量生成邀请码？

A: 可以直接在数据库中执行 SQL：
```sql
INSERT INTO invite_codes (code, created_by, usage_limit, is_admin_code, created_at)
SELECT
  CONCAT('UDISK-', UPPER(SUBSTRING(MD5(RAND()), 1, 6))),
  NULL,
  1,
  TRUE,
  NOW()
FROM
  (SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5) t1
CROSS JOIN
  (SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5) t2;
-- 这会生成 25 个邀请码
```

### Q4: 阿里云 RDS 白名单如何配置？

A:
1. 登录阿里云控制台
2. 进入 RDS 实例
3. 数据安全性 → 白名单设置
4. 添加白名单分组，输入你的 IP 地址
5. 如果是临时访问，建议设置过期时间

---

## 部署检查清单

- [ ] 已备份生产数据库（阿里云 RDS 备份或 mysqldump）
- [ ] 已检查 RDS 白名单，可以连接
- [ ] 已验证迁移脚本会将现有用户设为 full 访问
- [ ] 已在测试环境验证迁移脚本无误
- [ ] 已执行数据库迁移脚本
- [ ] 已验证数据库表结构和数据正确
- [ ] 已生成测试邀请码
- [ ] 已部署后端代码并重启服务
- [ ] 已验证后端 API 正常工作
- [ ] 已更新小程序代码（确认 apiBaseUrl）
- [ ] 已上传小程序到微信平台
- [ ] 已进行端到端测试
- [ ] 已监控错误日志和用户反馈

---

## 支持联系

如果遇到问题，请检查：
1. 后端日志：`pm2 logs rateyourdj`
2. 数据库连接：确认 RDS 白名单和连接信息
3. 前端调试：微信开发者工具的 Console 和 Network

---

**祝部署顺利！🚀**

*文档创建时间: 2026-02-08*
