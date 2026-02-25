# DJ导入指南

## 一、准备DJ资料表格

### 方式1：使用CSV模板（推荐）
使用项目提供的 `dj_import_template.csv` 作为模板

### 方式2：使用Excel自己创建
在Excel中创建表格，第一行为表头：

| name | city | label | photo_url | music_style |
|------|------|-------|-----------|-------------|
| TUBE | 北京市 | 音洋Productions | https://... | House,Techno |
| 梁益诚 | 上海市 |  |  | Techno |

**注意：保存时选择「CSV UTF-8（逗号分隔）」格式**

---

## 二、字段说明

### 必填字段

| 字段 | 说明 | 示例 |
|------|------|------|
| name | DJ名字 | TUBE |
| city | 所在城市 | 北京市 |

### 可选字段

| 字段 | 说明 | 示例 |
|------|------|------|
| label | 厂牌/所属 | 音洋Productions |
| photo_url | 照片链接（必须HTTPS） | https://example.com/photo.jpg |
| music_style | 音乐风格（多个用英文逗号分隔） | House,Techno,Minimal |

### 注意事项

1. **照片URL必须是HTTPS链接**
2. **音乐风格用英文逗号分隔**（不要用中文逗号）
3. **城市名称要统一**（推荐：`北京市`、`上海市`、`深圳市`）
4. **空字段留空即可**

---

## 三、导入步骤

### Step 1: 配置数据库连接

**开发环境**：使用默认 `.env` 配置

**生产环境**：编辑 `.env.production`：
```bash
DB_HOST=rm-xxxxx.mysql.rds.aliyuncs.com
DB_PORT=3306
DB_USER=rateyourdj
DB_PASSWORD=your-password
DB_NAME=rateyourdj
```

### Step 2: 确保数据库运行
```bash
# 启动数据库（如果使用Docker）
docker compose up -d
```

### Step 3: 运行导入脚本

```bash
cd rateyourdj-backend

# 方式1：基础版（适合已有图片URL）
node scripts/import-djs.js dj_import_template.csv

# 方式2：高级版（自动上传照片到OSS）
node scripts/import-djs-with-photos.js dj_import_template.csv

# 导入到生产环境（加 prod 参数）
node scripts/import-djs.js dj_import_template.csv prod
```

### Step 4: 查看导入结果
脚本会显示导入统计（成功/跳过/失败数量）。

---

## 四、验证导入结果

```bash
# 连接数据库验证
mysql -h your-host -u your-user -p rateyourdj

# 查看导入的DJ
SELECT id, name, city, created_at FROM djs ORDER BY created_at DESC LIMIT 10;

# 查看各城市DJ数量
SELECT city, COUNT(*) as count FROM djs GROUP BY city ORDER BY count DESC;
```

---

## 五、重要提示

1. **测试优先**：先在开发环境测试，确认CSV格式正确后再导入生产环境
2. **备份数据库**：导入前建议备份 `mysqldump -h host -u user -p rateyourdj > backup.sql`
3. **分批导入**：大量数据建议每次不超过500条
4. **不会重复导入**：脚本自动检测同名同城市的DJ，已存在的会跳过

---

## 六、常见问题

### 连接生产数据库失败
- 数据库地址、端口是否正确
- 用户名、密码是否正确
- 生产数据库是否允许你的IP访问（白名单）
- 防火墙是否开放3306端口

### 导入后小程序看不到DJ
- 前端 `apiBaseUrl` 可能还指向开发环境，需改为生产后端地址

### 照片显示不出来
- photo_url 必须是HTTPS链接
- 图片链接需可在浏览器中打开
- 建议使用高级版脚本自动上传到OSS

### 如何回滚导入
```sql
-- 查看最近导入的DJ
SELECT * FROM djs WHERE created_at > '2026-02-07 14:00:00';
-- 确认后删除
DELETE FROM djs WHERE created_at > '2026-02-07 14:00:00';
```

---

## 七、批量收集DJ资料的技巧

### 推荐的DJ信息来源
- Resident Advisor (RA)、Beatport、SoundCloud
- Instagram、微博、小红书
- LiveHouse活动海报、电音节阵容

### 照片获取建议
- 优先使用DJ官方宣传照
- 确保有使用权限
- 图片比例建议 1:1 或 4:5，分辨率至少 500x500px
