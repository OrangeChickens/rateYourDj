# RateYourDJ 后端设置指南

## 前置要求

1. **Node.js** (v16+)
2. **MySQL** (8.0+)

---

## 选项 1: 使用 Docker（推荐）

### 1. 安装 Docker Desktop

**macOS**:

从官网下载并安装 Docker Desktop：
https://www.docker.com/products/docker-desktop

安装完成后启动 Docker Desktop。

### 2. 启动 MySQL

```bash
cd rateyourdj-backend
docker compose up -d
```

这将自动：
- 启动 MySQL 8.0 容器
- 创建数据库 `rateyourdj`
- 导入数据库表结构和示例数据
- MySQL 运行在 `localhost:3306`

### 3. 验证 MySQL 是否运行

```bash
docker ps
```

应该看到 `rateyourdj-mysql` 容器正在运行。

### 4. 停止 MySQL（需要时）

```bash
docker compose down
```

### 5. 查看 MySQL 日志

```bash
docker logs rateyourdj-mysql
```

---

## 选项 2: 手动安装 MySQL

### 1. 安装 MySQL

**macOS (使用 Homebrew)**:

```bash
brew install mysql
brew services start mysql
```

**Windows**:

从官网下载并安装 MySQL：
https://dev.mysql.com/downloads/mysql/

### 2. 登录 MySQL

```bash
mysql -u root -p
```

### 3. 创建数据库和用户

```sql
CREATE DATABASE rateyourdj CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'rateyourdj'@'localhost' IDENTIFIED BY 'rateyourdj123';
GRANT ALL PRIVILEGES ON rateyourdj.* TO 'rateyourdj'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 4. 导入数据库结构

```bash
mysql -u root -p rateyourdj < database.sql
```

---

## 启动后端服务器

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 到 `.env`：

```bash
cp .env.example .env
```

编辑 `.env` 文件，确保数据库配置正确：

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root           # 或 rateyourdj
DB_PASSWORD=rateyourdj123
DB_NAME=rateyourdj
```

**重要**: 修改微信小程序配置（获取方式见下方）：

```env
WECHAT_APP_ID=你的小程序AppID
WECHAT_APP_SECRET=你的小程序AppSecret
```

### 3. 启动开发服务器

```bash
npm run dev
```

服务器启动在 `http://localhost:3000`

### 4. 测试接口

打开浏览器访问：

```
http://localhost:3000/health
```

应该返回：

```json
{
  "success": true,
  "message": "RateYourDJ API is running",
  "timestamp": "2024-..."
}
```

---

## 获取微信小程序 AppID 和 AppSecret

### 1. 注册微信小程序

访问：https://mp.weixin.qq.com/

### 2. 创建小程序

登录后，选择"开发" -> "开发管理" -> "开发设置"

### 3. 获取凭证

- **AppID**: 在"开发设置"页面可以看到
- **AppSecret**: 点击"生成"按钮获取（注意保存，只显示一次）

### 4. 配置服务器域名

在"开发" -> "开发管理" -> "开发设置" -> "服务器域名"中添加：

```
request合法域名: https://你的域名.com
```

（开发阶段可以在小程序开发工具中勾选"不校验合法域名"）

---

## 测试 API

### 使用 curl

```bash
# 健康检查
curl http://localhost:3000/health

# 获取热门DJ
curl http://localhost:3000/api/dj/hot/list

# 获取预设标签
curl http://localhost:3000/api/tags/presets

# 获取DJ详情
curl http://localhost:3000/api/dj/1
```

### 使用 Postman

1. 导入接口文档 `API.md`
2. 设置 Base URL: `http://localhost:3000/api`
3. 测试各个端点

---

## 常见问题

### 1. MySQL 连接失败

**错误**: `ER_ACCESS_DENIED_ERROR: Access denied for user`

**解决**:
- 检查 `.env` 中的数据库用户名和密码是否正确
- 确保 MySQL 服务正在运行

### 2. Docker 容器启动失败

**错误**: `port 3306 is already allocated`

**解决**:
- 本地已有 MySQL 在运行，停止本地 MySQL 或修改 Docker 端口

```bash
# 停止本地 MySQL (macOS)
brew services stop mysql
```

### 3. 数据库表不存在

**解决**:

重新导入数据库：

```bash
# Docker
docker exec -i rateyourdj-mysql mysql -uroot -prateyourdj123 rateyourdj < database.sql

# 本地 MySQL
mysql -u root -p rateyourdj < database.sql
```

---

## 下一步

后端启动成功后，可以：

1. 查看 `API.md` 了解所有接口
2. 开始开发微信小程序前端
3. 使用 Postman 测试各个 API 端点

---

## 生产部署建议

### 1. 环境变量

- 修改 `JWT_SECRET` 为强随机字符串
- 设置 `NODE_ENV=production`
- 使用强密码作为数据库密码

### 2. 数据库优化

- 配置数据库连接池大小
- 添加适当的索引
- 定期备份数据库

### 3. 安全性

- 启用 HTTPS
- 配置 CORS 白名单
- 添加请求频率限制
- 添加敏感词过滤

### 4. 监控

- 添加日志系统（Winston/Bunyan）
- 配置错误监控（Sentry）
- 设置性能监控（PM2）
