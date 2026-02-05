# RateYourDJ Backend API

DJ评价平台后端服务 - 类似 RateMyProfessors 的 DJ 评分系统

## 技术栈

- **Node.js** + **Express** - Web框架
- **MySQL** - 数据库
- **JWT** - 身份认证
- **微信小程序登录** - 用户认证

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动 MySQL 数据库

使用 Docker Compose（推荐）:

```bash
docker-compose up -d
```

或者手动安装 MySQL 8.0+，然后导入数据库：

```bash
mysql -u root -p < database.sql
```

### 3. 配置环境变量

复制 `.env.example` 到 `.env` 并修改配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填写微信小程序的 AppID 和 AppSecret。

### 4. 启动服务器

开发环境（热重载）：

```bash
npm run dev
```

生产环境：

```bash
npm start
```

服务器将在 `http://localhost:3000` 启动。

## API 端点

### 认证

- `POST /api/auth/login` - 微信登录

### DJ 相关

- `GET /api/dj/list` - 获取DJ列表（支持筛选、排序、分页）
- `GET /api/dj/:id` - 获取DJ详情
- `GET /api/dj/search/query` - 搜索DJ
- `GET /api/dj/hot/list` - 获取热门DJ
- `GET /api/dj/cities/all` - 获取所有城市列表

### 评论相关

- `POST /api/review/create` - 创建评论（需登录）
- `GET /api/review/list/:djId` - 获取DJ的评论列表
- `DELETE /api/review/:id` - 删除评论（需登录）
- `POST /api/review/:id/helpful` - 标记评论有帮助（需登录）
- `POST /api/review/:id/report` - 举报评论（需登录）

### 用户相关

- `GET /api/user/profile` - 获取用户资料（需登录）
- `GET /api/user/favorites` - 获取收藏列表（需登录）
- `POST /api/user/favorite/:djId` - 收藏/取消收藏DJ（需登录）
- `GET /api/user/reviews` - 获取用户评论历史（需登录）
- `GET /api/user/search-history` - 获取搜索历史（需登录）

### 标签相关

- `GET /api/tags/presets` - 获取预设标签
- `GET /api/tags/dj/:djId` - 获取DJ的热门标签

## 数据库结构

- `users` - 用户表
- `djs` - DJ表
- `reviews` - 评论表
- `review_tags` - 评论标签关联表
- `preset_tags` - 预设标签表
- `favorites` - 收藏表
- `review_interactions` - 评论互动表
- `search_history` - 搜索历史表

详见 `database.sql` 文件。

## 项目结构

```
rateyourdj-backend/
├── src/
│   ├── config/          # 配置文件（数据库等）
│   ├── middleware/      # 中间件（认证、错误处理）
│   ├── models/          # 数据模型
│   ├── routes/          # 路由定义
│   ├── controllers/     # 控制器（业务逻辑）
│   ├── services/        # 服务层（微信登录、评分计算）
│   ├── utils/           # 工具函数（JWT等）
│   └── app.js           # 应用入口
├── database.sql         # 数据库初始化脚本
├── docker-compose.yml   # Docker Compose配置
├── .env                 # 环境变量
└── package.json
```

## 开发指南

### 认证机制

所有需要登录的接口需要在请求头中携带 JWT token：

```
Authorization: Bearer <your_jwt_token>
```

### 创建评论示例

```bash
curl -X POST http://localhost:3000/api/review/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "dj_id": 1,
    "overall_rating": 5,
    "set_rating": 5,
    "performance_rating": 4,
    "personality_rating": 5,
    "would_choose_again": true,
    "comment": "非常棒的DJ！",
    "tags": ["Techno", "有张力", "专业"],
    "is_anonymous": false
  }'
```

## 环境变量说明

- `PORT` - 服务器端口（默认：3000）
- `NODE_ENV` - 环境（development/production）
- `DB_HOST` - 数据库主机
- `DB_PORT` - 数据库端口
- `DB_USER` - 数据库用户名
- `DB_PASSWORD` - 数据库密码
- `DB_NAME` - 数据库名称
- `JWT_SECRET` - JWT密钥
- `JWT_EXPIRES_IN` - JWT过期时间
- `WECHAT_APP_ID` - 微信小程序AppID
- `WECHAT_APP_SECRET` - 微信小程序AppSecret

## 许可证

ISC
