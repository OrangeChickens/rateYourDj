# 阿里云RDS数据库迁移指南

## 执行前准备

### 1. 获取RDS连接信息
登录阿里云控制台，找到以下信息：
- **内网地址**：`rm-xxxxx.mysql.rds.aliyuncs.com`（如果从ECS连接）
- **外网地址**：`rm-xxxxx.mysql.rds.aliyuncs.com`（如果从本地连接，需要先开通外网）
- **端口**：通常是 `3306`
- **数据库名**：`rateyourdj`
- **用户名**：主账号或子账号
- **密码**：数据库密码

### 2. 配置白名单（如果从本地连接）
在阿里云RDS控制台：
1. 进入 RDS 实例详情页
2. 点击"数据安全性" → "白名单设置"
3. 添加本地公网IP或选择"允许所有IP访问"（临时，迁移后记得删除）

### 3. 测试连接
```bash
mysql -h rm-xxxxx.mysql.rds.aliyuncs.com -P 3306 -u username -p
# 输入密码后，如果能连接成功，说明配置正确
```

---

## 方式一：从本地执行迁移（推荐用于开发环境测试）

### 步骤 1：备份现有数据
```bash
# 导出整个数据库备份
mysqldump -h rm-xxxxx.mysql.rds.aliyuncs.com -P 3306 -u username -p \
  --single-transaction \
  --databases rateyourdj \
  > rateyourdj_backup_$(date +%Y%m%d_%H%M%S).sql

# 或者仅备份 preset_tags 表
mysqldump -h rm-xxxxx.mysql.rds.aliyuncs.com -P 3306 -u username -p \
  --single-transaction \
  rateyourdj preset_tags \
  > preset_tags_backup_$(date +%Y%m%d_%H%M%S).sql
```

### 步骤 2：执行迁移脚本
```bash
cd /Users/yichengliang/Desktop/ws/rateyourdj/rateyourdj-backend

mysql -h rm-xxxxx.mysql.rds.aliyuncs.com -P 3306 -u username -p rateyourdj \
  < migrations/update_tags_20260206.sql
```

### 步骤 3：验证结果
```bash
# 检查标签数量
mysql -h rm-xxxxx.mysql.rds.aliyuncs.com -P 3306 -u username -p rateyourdj \
  -e "SELECT category, COUNT(*) as count FROM preset_tags GROUP BY category;"

# 预期输出：
# +-------------+-------+
# | category    | count |
# +-------------+-------+
# | style       |    10 |
# | performance |     5 |
# | personality |     5 |
# +-------------+-------+

# 查看具体标签
mysql -h rm-xxxxx.mysql.rds.aliyuncs.com -P 3306 -u username -p rateyourdj \
  -e "SELECT id, tag_name, tag_name_en, category FROM preset_tags WHERE category IN ('performance', 'personality') ORDER BY category, id;"
```

---

## 方式二：使用阿里云DMS（数据管理服务）- 推荐

### 步骤 1：登录DMS
1. 访问 https://dms.console.aliyun.com/
2. 找到你的RDS实例并登录

### 步骤 2：备份数据
1. 在DMS中选择 `preset_tags` 表
2. 点击"导出" → "导出数据"
3. 保存备份文件到本地

### 步骤 3：执行SQL
1. 在DMS中点击"SQL窗口"
2. 打开本地文件 `migrations/update_tags_20260206.sql`
3. 复制全部内容
4. 粘贴到DMS SQL窗口
5. 点击"执行"

### 步骤 4：验证结果
在SQL窗口中运行：
```sql
-- 检查标签分类统计
SELECT category, COUNT(*) as count
FROM preset_tags
GROUP BY category;

-- 查看新的标签
SELECT id, tag_name, tag_name_en, category
FROM preset_tags
WHERE category IN ('performance', 'personality')
ORDER BY category, id;
```

---

## 方式三：从ECS服务器执行（如果后端部署在ECS上）

### 步骤 1：上传迁移脚本
```bash
# 从本地上传到ECS
scp migrations/update_tags_20260206.sql root@your-ecs-ip:/path/to/rateyourdj-backend/migrations/
```

### 步骤 2：SSH到ECS服务器
```bash
ssh root@your-ecs-ip
cd /path/to/rateyourdj-backend
```

### 步骤 3：备份数据库
```bash
mysqldump -h rm-xxxxx.mysql.rds.aliyuncs.com -P 3306 -u username -p \
  --single-transaction \
  rateyourdj preset_tags \
  > preset_tags_backup_$(date +%Y%m%d_%H%M%S).sql
```

### 步骤 4：执行迁移
```bash
mysql -h rm-xxxxx.mysql.rds.aliyuncs.com -P 3306 -u username -p rateyourdj \
  < migrations/update_tags_20260206.sql
```

### 步骤 5：重启后端服务（确保应用加载新标签）
```bash
# 如果使用PM2
pm2 restart rateyourdj-backend

# 如果使用Docker
docker compose restart

# 如果使用systemd
systemctl restart rateyourdj-backend
```

---

## 常见问题

### Q1: 出现 "Access denied" 错误
**解决方案：**
- 检查用户名密码是否正确
- 确认该用户有 DELETE、INSERT 权限
- 检查白名单是否包含你的IP

### Q2: 连接超时
**解决方案：**
- 检查网络连接
- 确认RDS实例是否开通了外网访问（或者你在内网环境）
- 检查白名单配置

### Q3: 字符集乱码
**解决方案：**
```bash
# 连接时指定字符集
mysql -h rm-xxxxx.mysql.rds.aliyuncs.com -P 3306 -u username -p \
  --default-character-set=utf8mb4 \
  rateyourdj < migrations/update_tags_20260206.sql
```

### Q4: 如何回滚？
如果迁移后发现问题，使用备份恢复：
```bash
# 从备份恢复 preset_tags 表
mysql -h rm-xxxxx.mysql.rds.aliyuncs.com -P 3306 -u username -p rateyourdj \
  < preset_tags_backup_TIMESTAMP.sql
```

---

## 迁移检查清单

- [ ] 已获取RDS连接信息
- [ ] 已配置白名单（如需要）
- [ ] 已测试数据库连接
- [ ] 已备份 preset_tags 表或整个数据库
- [ ] 已在测试环境验证迁移脚本
- [ ] 已选择低峰时段执行
- [ ] 执行迁移脚本
- [ ] 验证标签数量和内容
- [ ] 测试小程序"写评价"功能
- [ ] 如从本地连接，迁移后关闭外网访问或删除白名单IP

---

## 安全建议

1. **备份优先**：无论选择哪种方式，都先备份数据
2. **测试连接**：先用 `SELECT 1` 测试连接是否正常
3. **低峰执行**：选择用户较少的时段执行迁移
4. **立即验证**：迁移后立即验证结果，有问题及时回滚
5. **关闭外网**：如果开通了外网访问，迁移完成后记得关闭
6. **监控日志**：迁移后观察应用日志是否有异常

---

## 执行时间估算

- 备份 preset_tags 表：< 1秒
- 执行迁移脚本：< 2秒
- 验证结果：< 1秒
- 总计：< 5秒（不影响用户使用）

该迁移脚本使用事务包裹，要么全部成功，要么全部回滚，不会出现数据不一致的情况。
