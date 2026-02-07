# 批量导入脚本使用说明

本目录包含DJ数据批量导入工具。

## 📦 可用脚本

### 1. `import-djs.js` - 基础版（推荐新手）

**功能：**
- ✅ 从CSV导入DJ信息
- ✅ 自动去重
- ✅ 简单快速

**使用：**
```bash
node scripts/import-djs.js dj_import_template.csv
```

**适用场景：**
- DJ照片已经上传到OSS，有完整URL
- 不需要自动处理照片
- 快速导入大量DJ

---

### 2. `import-djs-with-photos.js` - 高级版（推荐）

**功能：**
- ✅ 从CSV导入DJ信息
- ✅ 自动下载网络图片
- ✅ 自动上传到阿里云OSS
- ✅ 自动去重
- ✅ HTTP/HTTPS图片自动转换

**使用：**
```bash
node scripts/import-djs-with-photos.js dj_list.csv
```

**适用场景：**
- 从网络收集的DJ照片URL
- 需要批量上传照片到OSS
- 一次性完成导入+上传

**注意事项：**
- 需要配置OSS（在 `.env` 中设置）
- 照片下载可能较慢，请耐心等待
- 建议分批导入（每次50-100条）

---

## 📋 CSV文件格式

### 必需字段
- `name` - DJ名字
- `city` - 城市

### 可选字段
- `label` - 厂牌
- `photo_url` - 照片URL
- `music_style` - 音乐风格（逗号分隔）

### 示例

```csv
name,city,label,photo_url,music_style
TUBE,北京市,音洋Productions,https://example.com/tube.jpg,"House,Techno"
梁益诚,上海市,,,Techno
SHAO,深圳市,TAO Records,,"Bass House,Dubstep"
```

---

## 🚀 快速开始

### Step 1: 准备CSV文件

使用项目提供的模板 `dj_import_template.csv`，或创建自己的CSV文件。

### Step 2: 确保数据库运行

```bash
# Docker方式
docker compose up -d

# 或检查数据库连接
mysql -u root -p rateyourdj
```

### Step 3: 运行导入脚本

```bash
# 基础版（照片URL已准备好）
node scripts/import-djs.js your_dj_list.csv

# 高级版（自动上传照片）
node scripts/import-djs-with-photos.js your_dj_list.csv
```

---

## ⚠️  注意事项

### 1. CSV编码
确保CSV文件使用 **UTF-8** 编码，否则中文会乱码。

**Excel保存方式：**
- 文件 → 另存为
- 格式选择：**CSV UTF-8（逗号分隔）**

### 2. 照片URL格式
- ✅ 正确：`https://example.com/photo.jpg`
- ❌ 错误：`http://example.com/photo.jpg`（小程序只支持HTTPS）

### 3. 音乐风格分隔符
- ✅ 正确：`House,Techno,Minimal`（英文逗号）
- ❌ 错误：`House，Techno，Minimal`（中文逗号）

### 4. 重复数据
脚本会自动跳过已存在的DJ（同名+同城市）。

---

## 🐛 常见问题

### Q1: 导入失败，提示"文件不存在"
**A:** 检查文件路径是否正确，可以使用绝对路径：
```bash
node scripts/import-djs.js /Users/xxx/Desktop/dj_list.csv
```

### Q2: 照片没有显示
**A:** 检查：
1. photo_url是否是有效的HTTPS链接
2. 图片URL是否可以在浏览器中打开
3. 使用 `import-djs-with-photos.js` 自动上传到OSS

### Q3: 部分DJ没有导入
**A:** 查看控制台输出，通常原因：
- 缺少必填字段（name或city）
- DJ已存在（会跳过）
- 数据格式错误

### Q4: 如何更新已存在的DJ？
**A:** 两种方式：
1. 在数据库中先删除，再导入
2. 直接在数据库中UPDATE

### Q5: 可以导入多少条DJ？
**A:** 理论无限制，建议：
- 基础版：每次500条以内
- 高级版：每次50-100条（因为要下载照片）

---

## 📊 导入结果说明

导入完成后会显示统计信息：

```
📊 导入统计：
   ✅ 成功: 45 条    <- 成功导入的DJ数量
   ⚠️  跳过: 5 条     <- 已存在或数据不完整的DJ
   ❌ 失败: 0 条     <- 导入出错的DJ
   📝 总计: 50 条    <- CSV文件中的总记录数
```

---

## 💡 高级技巧

### 1. 分批导入大量数据

```bash
# 将大文件拆分成多个小文件
split -l 100 large_dj_list.csv small_dj_

# 分批导入
for file in small_dj_*; do
  node scripts/import-djs-with-photos.js "$file"
  sleep 5  # 休息5秒，避免OSS限流
done
```

### 2. 只导入特定城市的DJ

```bash
# 使用grep过滤CSV
grep "上海" dj_list.csv > shanghai_djs.csv
node scripts/import-djs.js shanghai_djs.csv
```

### 3. 验证导入结果

```sql
-- 查看导入的DJ数量
SELECT city, COUNT(*) as count
FROM djs
GROUP BY city
ORDER BY count DESC;

-- 查看最新导入的DJ
SELECT id, name, city, created_at
FROM djs
ORDER BY created_at DESC
LIMIT 20;
```

---

需要帮助？请查看 `DJ批量导入指南.md`
