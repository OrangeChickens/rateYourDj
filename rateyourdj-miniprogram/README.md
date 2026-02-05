# RateYourDJ 微信小程序

DJ评分平台的微信小程序前端，采用极简主义设计（黑白黄配色）。

---

## 📊 开发完成度

### ✅ 已完成功能（~95%）

#### 1. 全局配置和基础架构 ✅
- [x] 应用配置（app.js, app.json, app.wxss）
- [x] 微信登录集成
- [x] JWT 认证
- [x] 统一请求封装
- [x] 国际化系统（中文/英文）
- [x] 工具函数库

#### 2. 页面实现 ✅
- [x] **首页** (pages/index) - 热门DJ列表、搜索入口、城市选择
- [x] **DJ详情页** (pages/dj-detail) - DJ信息、评分统计、评论列表
- [x] **评论创建页** (pages/review-create) - 多维度评分、标签选择、文字评论
- [x] **搜索页** (pages/search) - 搜索DJ、搜索历史、热门搜索
- [x] **我的收藏** (pages/my-favorites) - 收藏列表、取消收藏
- [x] **设置页** (pages/settings) - 用户资料、语言切换、退出登录
- [x] **城市列表** (pages/city-list) - 城市选择、DJ数量统计

#### 3. 核心功能 ✅
- [x] 用户认证（微信登录）
- [x] DJ浏览和搜索
- [x] 评论创建（多维度评分）
- [x] 收藏功能
- [x] 评论互动（点赞、举报）
- [x] 城市筛选
- [x] 语言切换（中文/英文）
- [x] 下拉刷新
- [x] 分页加载

#### 4. UI/UX ✅
- [x] 黑白黄极简主义设计
- [x] 响应式布局
- [x] 加载状态
- [x] 空状态提示
- [x] 错误处理
- [x] 国际化文本

---

## 🚧 待完成事项

### ⚠️ 必需（启动前）
1. **TabBar 图标** - 需要准备6个PNG图标文件（见 `images/README.md`）
2. **后端API地址** - 在 `app.js` 中配置 `apiBaseUrl`
3. **微信小程序AppID** - 在 `project.config.json` 中配置

### 📋 可选（后期优化）
- [ ] 创建复用组件（dj-card, review-card等）
- [ ] 图片懒加载优化
- [ ] 缓存策略优化
- [ ] 用户评论历史页面
- [ ] 数据统计图表

---

## 🚀 快速开始

### 1. 前置条件

- 微信开发者工具（最新版本）
- Node.js 环境（后端）
- 已启动的后端服务

### 2. 配置步骤

#### A. 准备图标资源
```bash
# 进入图标目录
cd images/

# 根据 README.md 的说明准备以下图标：
# - tab-home.png / tab-home-active.png
# - tab-favorite.png / tab-favorite-active.png
# - tab-profile.png / tab-profile-active.png
# - default-avatar.png
# - anonymous-avatar.png
```

#### B. 配置后端API地址
编辑 `app.js`：
```javascript
globalData: {
  apiBaseUrl: 'http://localhost:3000/api',  // 修改为你的后端地址
  // ...
}
```

#### C. 配置微信小程序AppID
创建或编辑 `project.config.json`：
```json
{
  "appid": "your_appid_here",
  "projectname": "rateyourdj-miniprogram",
  "miniprogramRoot": "./",
  "setting": {
    "es6": true,
    "enhance": true,
    "minified": true
  }
}
```

### 3. 启动小程序

1. **启动后端服务**
   ```bash
   cd ../rateyourdj-backend
   npm run dev
   ```

2. **打开微信开发者工具**
   - 选择"导入项目"
   - 项目目录选择：`rateyourdj-miniprogram/`
   - AppID：选择你的AppID或"测试号"
   - 点击"导入"

3. **编译运行**
   - 点击"编译"按钮
   - 在模拟器中查看效果
   - 或扫码在真机上预览

### 4. 测试功能

#### 测试清单
- [ ] 首页加载热门DJ
- [ ] 搜索DJ功能
- [ ] 点击DJ进入详情页
- [ ] 查看评论列表
- [ ] 写评论（需要登录）
- [ ] 收藏DJ
- [ ] 查看收藏列表
- [ ] 城市筛选
- [ ] 语言切换（中英文）
- [ ] 退出登录

---

## 📂 项目结构

```
rateyourdj-miniprogram/
├── app.js                      # 应用入口
├── app.json                    # 全局配置
├── app.wxss                    # 全局样式
├── pages/                      # 页面目录
│   ├── index/                  # 首页
│   ├── dj-detail/              # DJ详情页
│   ├── review-create/          # 评论创建页
│   ├── search/                 # 搜索页
│   ├── my-favorites/           # 我的收藏
│   ├── settings/               # 设置页
│   └── city-list/              # 城市列表
├── components/                 # 组件目录（待开发）
│   ├── dj-card/
│   ├── review-card/
│   ├── rating-stars/
│   └── tag-selector/
├── utils/                      # 工具函数
│   ├── api.js                  # API封装
│   ├── util.js                 # 工具函数
│   └── i18n.js                 # 国际化
├── i18n/                       # 语言包
│   ├── zh-CN.js                # 中文
│   ├── en-US.js                # 英文
│   └── index.js
└── images/                     # 图片资源
    └── README.md               # 图标说明
```

---

## 🎨 设计规范

### 配色方案
- **主色**：#FFD700（金黄色） - 用于按钮、选中状态、标签
- **文字**：#000000（黑色）、#666666（灰色）、#999999（浅灰）
- **背景**：#FFFFFF（白色）、#F5F5F5（浅灰背景）
- **边框**：#F0F0F0、#E0E0E0

### 字体大小
- 标题：36-40rpx（粗体）
- 正文：28-32rpx
- 辅助文字：24-26rpx
- 小字：20-22rpx

### 间距
- 大间距：40rpx
- 中间距：20-30rpx
- 小间距：12-16rpx
- 微间距：8rpx

---

## 🔌 API集成

### 后端API端点

所有API请求通过 `utils/api.js` 统一管理：

#### DJ相关
- `GET /dj/list` - DJ列表
- `GET /dj/:id` - DJ详情
- `GET /dj/search/query` - 搜索DJ
- `GET /dj/hot/list` - 热门DJ
- `GET /dj/cities/all` - 城市列表

#### 评论相关
- `POST /review/create` - 创建评论（需认证）
- `GET /review/list/:djId` - 评论列表
- `DELETE /review/:id` - 删除评论（需认证）
- `POST /review/:id/helpful` - 标记有帮助（需认证）
- `POST /review/:id/report` - 举报评论（需认证）

#### 用户相关
- `POST /auth/login` - 微信登录
- `GET /user/profile` - 用户资料（需认证）
- `GET /user/favorites` - 收藏列表（需认证）
- `POST /user/favorite/:djId` - 收藏/取消收藏（需认证）

#### 标签相关
- `GET /tags/presets` - 预设标签
- `GET /tags/dj/:djId` - DJ热门标签

### 认证机制

- 使用JWT Token认证
- Token存储在 `wx.storage`
- 请求拦截器自动添加 `Authorization` 头
- 登录失效自动跳转登录

---

## 🌐 国际化支持

### 支持语言
- 简体中文（zh-CN）
- English（en-US）

### 语言切换
- 在设置页面切换语言
- 语言偏好保存到本地存储
- 切换后立即生效

### 添加新语言
1. 在 `i18n/` 目录创建新语言包（如 `ja-JP.js`）
2. 在 `i18n/index.js` 中注册
3. 在设置页添加切换选项

---

## 🐛 常见问题

### 1. 无法显示TabBar图标
**原因**：缺少图标文件
**解决**：参考 `images/README.md` 准备图标

### 2. API请求失败
**原因**：后端未启动或地址配置错误
**解决**：
- 检查后端服务是否运行（`npm run dev`）
- 检查 `app.js` 中的 `apiBaseUrl` 配置
- 确保在开发者工具中勾选"不校验合法域名"

### 3. 微信登录失败
**原因**：AppID未配置或后端微信配置错误
**解决**：
- 配置正确的AppID
- 检查后端 `config/wechat.js` 配置
- 确保 AppSecret 正确

### 4. 页面空白
**原因**：语法错误或API请求失败
**解决**：
- 打开调试器查看Console错误
- 检查Network请求状态
- 查看后端日志

---

## 📱 测试建议

### 功能测试
1. 未登录状态：浏览DJ、搜索、查看详情
2. 登录后：写评论、收藏、点赞
3. 切换语言：所有文本正确显示
4. 边界情况：空列表、网络错误、登录失效

### 兼容性测试
- iOS真机
- Android真机
- 不同屏幕尺寸

### 性能测试
- 页面加载速度
- 滚动流畅度
- 图片加载

---

## 🔄 后续优化建议

### 短期优化（1-2周）
1. 创建复用组件，提高代码复用性
2. 添加图片懒加载
3. 优化长列表性能（虚拟列表）
4. 添加骨架屏加载效果

### 中期优化（1个月）
1. 用户评论历史页面
2. DJ筛选和排序优化
3. 评论回复功能
4. 消息通知功能

### 长期优化（3个月+）
1. 数据统计和可视化
2. 个性化推荐
3. 社交分享功能
4. 离线缓存

---

## 📄 相关文档

- [后端API文档](../rateyourdj-backend/API.md)
- [数据库设计](../rateyourdj-backend/database.sql)
- [功能清单](../RateMyProfessors_功能清单.md)
- [项目总览](../README.md)

---

## 📝 更新日志

### v1.0.0 (2024-02-05)
- ✅ 完成7个核心页面开发
- ✅ 实现用户认证和API集成
- ✅ 完成国际化支持（中英文）
- ✅ 完成UI设计和样式系统
- ⚠️ 待补充TabBar图标

---

## 👥 贡献

欢迎提交Issue和Pull Request！

## 📄 许可证

ISC
