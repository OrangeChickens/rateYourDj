# DJ批量导入指南

## 📋 一、准备DJ资料表格

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

## 📊 二、字段说明

### ✅ 必填字段

| 字段 | 说明 | 示例 |
|------|------|------|
| name | DJ名字 | TUBE |
| city | 所在城市 | 北京市 |

### 📝 可选字段

| 字段 | 说明 | 示例 |
|------|------|------|
| label | 厂牌/所属 | 音洋Productions |
| photo_url | 照片链接 | https://example.com/photo.jpg |
| music_style | 音乐风格（多个用逗号分隔） | House,Techno,Minimal |

### 📌 注意事项

1. **照片URL必须是HTTPS链接**
   - ✅ 正确：`https://example.com/photo.jpg`
   - ❌ 错误：`http://example.com/photo.jpg`（HTTP不支持）

2. **音乐风格用英文逗号分隔**
   - ✅ 正确：`House,Techno,Minimal`
   - ❌ 错误：`House，Techno，Minimal`（中文逗号）

3. **城市名称要统一**
   - ✅ 推荐：`北京市`、`上海市`、`深圳市`
   - ❌ 避免：`北京`、`上海`（不统一）

4. **空字段留空即可**
   - 如果某个DJ没有厂牌，label列留空
   - 如果没有照片，photo_url列留空

---

## 🚀 三、导入步骤

### Step 1: 准备CSV文件
将你的DJ资料整理成CSV格式，保存到后端项目目录

### Step 2: 确保数据库运行
```bash
# 启动数据库（如果使用Docker）
docker compose up -d
```

### Step 3: 运行导入脚本
```bash
# 进入后端目录
cd rateyourdj-backend

# 导入DJ数据
node scripts/import-djs.js dj_import_template.csv

# 或指定完整路径
node scripts/import-djs.js /path/to/your/dj_list.csv
```

### Step 4: 查看导入结果
脚本会显示：
- ✅ 成功导入多少条
- ⚠️  跳过多少条（已存在）
- ❌ 失败多少条（错误）

---

## 📝 四、示例数据

### CSV格式示例

```csv
name,city,label,photo_url,music_style
TUBE,北京市,音洋Productions,https://example.com/tube.jpg,"House,Techno"
梁益诚,上海市,,,Techno
SHAO,深圳市,TAO Records,,"Bass House,Dubstep"
CARTA,成都市,,,House
DJ MAG,广州市,MAO Livehouse,,"Progressive House,Trance"
```

### Excel表格示例

| name | city | label | photo_url | music_style |
|------|------|-------|-----------|-------------|
| TUBE | 北京市 | 音洋Productions | https://example.com/tube.jpg | House,Techno |
| 梁益诚 | 上海市 |  |  | Techno |
| SHAO | 深圳市 | TAO Records |  | Bass House,Dubstep |
| CARTA | 成都市 |  |  | House |
| DJ MAG | 广州市 | MAO Livehouse |  | Progressive House,Trance |

---

## ⚠️  五、常见问题

### 1. 导入后DJ页面没有照片？
- 检查 photo_url 是否是有效的HTTPS链接
- 确认图片链接可以在浏览器中打开

### 2. 某些DJ没有导入？
- 查看控制台输出，找到跳过/失败的原因
- 通常是因为：
  - 缺少必填字段（name或city）
  - DJ已存在（同名同城市）
  - 数据格式错误

### 3. 如何更新已存在的DJ信息？
当前脚本会跳过已存在的DJ。如需更新，两种方式：
- 方式1：先在数据库中删除，再重新导入
- 方式2：直接在数据库中修改

### 4. 可以导入多少条DJ？
- 理论上无限制
- 建议每次导入不超过500条
- 大批量建议分批导入

---

## 🎯 六、批量收集DJ资料的技巧

### 推荐的DJ信息来源：

1. **电音平台**
   - Resident Advisor (RA)
   - Beatport
   - SoundCloud

2. **社交媒体**
   - Instagram
   - 微博
   - 小红书

3. **活动海报**
   - LiveHouse活动信息
   - 电音节阵容

4. **DJ个人主页**
   - 官网
   - Facebook页面

### 照片获取建议：

- 优先使用DJ的官方宣传照
- 确保有使用权限
- 图片比例建议：1:1 或 4:5
- 分辨率：至少 500x500px

---

## 📞 需要帮助？

如有问题，请检查：
1. CSV文件编码是否为 UTF-8
2. 数据库连接是否正常
3. 必填字段是否都有值
4. 照片链接是否是HTTPS

祝导入顺利！🎉
