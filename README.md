# RateYourDJ - DJ评价平台

类似 RateMyProfessors 的 DJ 评分系统（微信小程序）

## 项目结构

```
rateyourdj/
├── rateyourdj-backend/          # Node.js 后端 API
│   ├── src/
│   │   ├── config/              # 数据库配置
│   │   ├── controllers/         # 业务逻辑控制器
│   │   ├── middleware/          # 中间件（认证、错误处理）
│   │   ├── models/              # 数据模型
│   │   ├── routes/              # 路由定义
│   │   ├── services/            # 服务层（微信登录、评分计算）
│   │   ├── utils/               # 工具函数
│   │   └── app.js               # 应用入口
│   ├── database.sql             # 数据库初始化脚本
│   ├── docker-compose.yml       # Docker Compose 配置
│   ├── README.md                # 后端文档
│   ├── API.md                   # API 接口文档
│   └── SETUP.md                 # 安装配置指南
│
└── rateyourdj-miniprogram/      # 微信小程序前端（待开发）
    └── (即将创建)
```

## 技术栈

### 后端
- **Node.js** + **Express** - Web框架
- **MySQL 8.0** - 数据库
- **JWT** - 身份认证
- **微信小程序 SDK** - 用户登录

### 前端（待开发）
- **微信小程序**
- **i18n** - 多语言支持（中文/英文）

## 快速开始

### 后端

详见 `rateyourdj-backend/SETUP.md`

```bash
cd rateyourdj-backend

# 安装依赖
npm install

# 启动 MySQL（使用 Docker）
docker compose up -d

# 启动开发服务器
npm run dev
```

服务器运行在: `http://localhost:3000`

### 前端（即将开发）

待后端完成后开始开发微信小程序。

## 功能特性

### 已完成 ✅

- [x] 数据库设计（8个表）
- [x] 用户认证（微信登录 + JWT）
- [x] DJ管理（列表、详情、搜索、筛选）
- [x] 评论系统（创建、删除、互动）
- [x] 评分计算（自动更新DJ评分）
- [x] 收藏功能
- [x] 标签系统（预设标签 + 热门标签）
- [x] 搜索历史
- [x] API文档

### 待开发 📋

- [ ] 微信小程序前端
  - [ ] 首页（热门DJ、搜索）
  - [ ] DJ详情页
  - [ ] 评论页面
  - [ ] 用户中心
  - [ ] 收藏列表
- [ ] 敏感词过滤
- [ ] 图片上传（CDN）
- [ ] 数据统计
- [ ] 管理后台

## 数据库表结构

1. **users** - 用户表
2. **djs** - DJ表
3. **reviews** - 评论表
4. **review_tags** - 评论标签关联表
5. **preset_tags** - 预设标签表
6. **favorites** - 收藏表
7. **review_interactions** - 评论互动表
8. **search_history** - 搜索历史表

详见 `rateyourdj-backend/database.sql`

## API 端点

### 认证
- `POST /api/auth/login` - 微信登录

### DJ
- `GET /api/dj/list` - DJ列表
- `GET /api/dj/:id` - DJ详情
- `GET /api/dj/search/query` - 搜索DJ
- `GET /api/dj/hot/list` - 热门DJ
- `GET /api/dj/cities/all` - 城市列表

### 评论
- `POST /api/review/create` - 创建评论
- `GET /api/review/list/:djId` - 评论列表
- `DELETE /api/review/:id` - 删除评论
- `POST /api/review/:id/helpful` - 标记有帮助
- `POST /api/review/:id/report` - 举报评论

### 用户
- `GET /api/user/profile` - 用户资料
- `GET /api/user/favorites` - 收藏列表
- `POST /api/user/favorite/:djId` - 收藏/取消收藏
- `GET /api/user/reviews` - 评论历史
- `GET /api/user/search-history` - 搜索历史

### 标签
- `GET /api/tags/presets` - 预设标签
- `GET /api/tags/dj/:djId` - DJ热门标签

完整文档见 `rateyourdj-backend/API.md`

## 开发进度

### Phase 1: 后端基础 ✅ (已完成)
- [x] 项目结构搭建
- [x] 数据库设计
- [x] 基础 CRUD 操作
- [x] 微信登录认证
- [x] JWT 认证中间件

### Phase 2: 核心功能 ✅ (已完成)
- [x] DJ相关API
- [x] 评论相关API
- [x] 用户相关API
- [x] 搜索功能
- [x] 评分自动计算

### Phase 3: 小程序前端 📋 (待开发)
- [ ] 项目初始化
- [ ] 页面开发
- [ ] API对接
- [ ] 国际化（i18n）

### Phase 4: 优化与部署 📋 (待开发)
- [ ] 性能优化
- [ ] 安全加固
- [ ] 生产部署
- [ ] 微信审核

## UI/UX 设计规范

### 设计风格
极简主义 - 黑白黄配色

### 配色方案
- **主色**: 黄色 #FFD700 (Gold)
- **文字**: 黑色 #000000 / 灰色 #666666
- **背景**: 白色 #FFFFFF

详见计划文档中的 UI/UX 设计部分。

## 文档

- `README.md` - 项目总览（本文件）
- `rateyourdj-backend/README.md` - 后端说明
- `rateyourdj-backend/API.md` - API接口文档
- [DJ 内容管理](docs/dj-content-tools.md) - SET 投稿/审核、演出、重复资料合并与 DJ 分享码
- `rateyourdj-backend/SETUP.md` - 安装配置指南
- `rateyourdj-backend/database.sql` - 数据库结构

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

ISC
