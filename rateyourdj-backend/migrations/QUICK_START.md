# 快速开始 - RDS标签迁移

## 推荐方式：使用阿里云DMS（最简单，无需配置）

### 1. 登录阿里云DMS
访问：https://dms.console.aliyun.com/
找到你的RDS实例并登录

### 2. 备份（重要！）
在SQL窗口执行：
```sql
-- 查看当前标签
SELECT category, COUNT(*) as count FROM preset_tags GROUP BY category;
```
截图保存结果

### 3. 执行迁移
1. 打开文件：`migrations/update_tags_20260206_dms.sql` （⚠️ 注意使用 `_dms.sql` 版本）
2. 复制全部内容
3. 粘贴到DMS SQL窗口
4. 点击"执行"按钮

### 4. 验证结果
在SQL窗口执行：
```sql
-- 应该看到：style=10, performance=5, personality=5
SELECT category, COUNT(*) as count FROM preset_tags GROUP BY category;

-- 查看新标签
SELECT id, tag_name, tag_name_en FROM preset_tags
WHERE category IN ('performance', 'personality')
ORDER BY category, id;
```

### 5. 测试小程序
打开小程序 → 点击任意DJ → 点击"写评价" → 查看标签是否正确显示

---

## 方式2：使用命令行（需要配置白名单）

### 快速执行脚本
```bash
cd /Users/yichengliang/Desktop/ws/rateyourdj/rateyourdj-backend/migrations
./migrate-to-rds.sh
```

按提示输入RDS连接信息，脚本会自动完成：
- 测试连接
- 备份数据
- 执行迁移
- 验证结果

### 或者手动执行
```bash
# 1. 测试连接（替换连接信息）
mysql -h rm-xxxxx.mysql.rds.aliyuncs.com -P 3306 -u username -p -e "SELECT 1"

# 2. 备份
mysqldump -h rm-xxxxx.mysql.rds.aliyuncs.com -P 3306 -u username -p \
  --single-transaction rateyourdj preset_tags \
  > backup_$(date +%Y%m%d_%H%M%S).sql

# 3. 执行迁移
mysql -h rm-xxxxx.mysql.rds.aliyuncs.com -P 3306 -u username -p \
  --default-character-set=utf8mb4 rateyourdj \
  < update_tags_20260206.sql

# 4. 验证
mysql -h rm-xxxxx.mysql.rds.aliyuncs.com -P 3306 -u username -p rateyourdj \
  -e "SELECT category, COUNT(*) FROM preset_tags GROUP BY category;"
```

---

## 遇到问题？

### 问题1: "Access denied"
- 检查用户名密码是否正确
- 确认用户有 DELETE、INSERT 权限

### 问题2: 无法连接
- 在RDS控制台检查白名单配置
- 确认已开通外网访问（如从本地连接）

### 问题3: 字符集乱码
- 使用 `--default-character-set=utf8mb4` 参数
- 或在DMS中设置字符集为 UTF8MB4

### 问题4: 需要回滚
```sql
-- 删除新标签
DELETE FROM preset_tags WHERE category IN ('performance', 'personality');

-- 插入旧标签（需要先查看备份内容）
-- 或者直接导入备份文件
```

---

## 预期结果

迁移后的标签数量：
- 音乐风格 (style): 10个 ✓
- 表现力 (performance): 5个 ✓
- 性格 (personality): 5个 ✓

新标签列表：
**Performance (表现力):**
1. 技术精湛 - Technically Skilled
2. 控场能力强 - Great Crowd Control
3. 稳定发挥 - Consistent Performance
4. 失误较多 - Frequent Mistakes
5. 气氛平淡 - Lackluster Atmosphere

**Personality (性格):**
1. 友好 - Friendly
2. 专业 - Professional
3. 低调 - Humble
4. 难沟通 - Hard to Communicate
5. 不守时 - Often Late

---

## 执行时间
整个过程约 1-2 分钟，不影响用户使用。
