# RateYourDJ 后端 - 生产环境部署

## 📋 部署前准备清单

在开始部署之前，请确保你已经准备好以下资源：

### 1. 阿里云资源
- [ ] **ECS云服务器**（2核4G起步，Ubuntu 22.04）
- [ ] **RDS数据库**（MySQL 8.0）或自建MySQL
- [ ] **OSS对象存储**（用于存储DJ图片）
- [ ] **AccessKey**（AccessKey ID 和 Secret）
- [ ] **域名**（如：api.rateyourdj.com）
- [ ] **SSL证书**（HTTPS是微信小程序的必需要求）

### 2. 微信小程序
- [ ] 小程序AppID
- [ ] 小程序AppSecret

### 3. 本地环境
- [ ] Git已安装（用于代码管理）
- [ ] SSH工具（用于连接服务器）

---

## 🚀 快速部署（推荐）

如果你想在30分钟内快速上线，请查看：
👉 [快速开始指南 (QUICK_START.md)](./QUICK_START.md)

---

## 📖 详细部署文档

如果你是第一次部署，或需要了解每个步骤的详细说明，请查看：
👉 [完整部署指南 (DEPLOYMENT.md)](./DEPLOYMENT.md)

该文档包含：
- 阿里云资源的详细配置步骤
- 服务器环境的完整安装流程
- Nginx和SSL的详细配置
- OSS对象存储的配置方法
- 故障排查指南
- 日常运维命令

---

## 📁 项目文件说明

### 配置文件
- **`.env.production.example`** - 生产环境配置模板（复制为.env并填入真实值）
- **`ecosystem.config.js`** - PM2进程管理配置
- **`database.sql`** - 数据库结构文件

### 部署脚本
- **`deploy.sh`** - 自动化部署脚本（拉取代码、安装依赖、重启服务）

### 核心配置文件
- **`src/config/oss.js`** - 阿里云OSS上传配置
- **`src/config/database.js`** - 数据库连接配置
- **`src/controllers/uploadController.js`** - 图片上传控制器（支持开发/生产环境切换）

---

## 🔧 关键功能说明

### 1. 图片上传（自动切换开发/生产环境）

**开发环境**（NODE_ENV=development）：
- 图片存储在本地 `uploads/` 目录
- 返回URL：`http://localhost:3000/uploads/filename.jpg`

**生产环境**（NODE_ENV=production）：
- 图片上传到阿里云OSS
- 返回URL：`https://bucket-name.oss-region.aliyuncs.com/path/filename.jpg`
- 或使用CDN：`https://cdn.rateyourdj.com/path/filename.jpg`

代码会根据 `NODE_ENV` 和 `OSS_BUCKET` 配置自动选择存储方式。

### 2. 管理员权限

第一个注册的用户需要手动设置为管理员：
```sql
UPDATE users SET role = 'admin' WHERE id = 1;
```

管理员可以：
- 上传新的DJ资料（包括图片）
- 管理评论和评价

### 3. JWT认证

- Token有效期：7天
- Token存储在小程序的本地存储中
- 过期后需要重新登录

---

## 🔐 环境变量说明

以下是`.env`文件中所有配置项的说明：

### 服务器配置
```bash
PORT=3000                    # API服务端口
NODE_ENV=production          # 环境：development 或 production
```

### 数据库配置
```bash
DB_HOST=your-rds-host       # RDS数据库地址
DB_PORT=3306                # 数据库端口
DB_USER=rateyourdj          # 数据库用户名
DB_PASSWORD=your-password   # 数据库密码
DB_NAME=rateyourdj          # 数据库名称
```

### JWT配置
```bash
JWT_SECRET=random-string    # JWT密钥（必须修改为随机字符串）
JWT_EXPIRES_IN=7d          # Token有效期
```

### 微信配置
```bash
WECHAT_APP_ID=wxXXXX        # 小程序AppID
WECHAT_APP_SECRET=secret    # 小程序AppSecret
```

### OSS配置
```bash
OSS_REGION=oss-cn-shanghai              # OSS地域
OSS_ACCESS_KEY_ID=LTAI5XXX              # AccessKey ID
OSS_ACCESS_KEY_SECRET=secret            # AccessKey Secret
OSS_BUCKET=rateyourdj-images            # Bucket名称
OSS_CDN_DOMAIN=cdn.rateyourdj.com      # CDN域名（可选）
```

---

## 🛠️ 常用命令

### 本地开发
```bash
npm run dev          # 启动开发服务器（nodemon）
npm start            # 启动生产服务器
```

### 生产环境（服务器上）
```bash
# 使用PM2管理
pm2 start ecosystem.config.js    # 启动应用
pm2 restart rateyourdj-api       # 重启应用
pm2 stop rateyourdj-api          # 停止应用
pm2 logs rateyourdj-api          # 查看日志
pm2 monit                        # 监控资源

# 使用部署脚本
./deploy.sh                      # 自动拉取代码并重启
```

### 数据库操作
```bash
# 导入数据库
mysql -h host -u user -p database < database.sql

# 备份数据库
mysqldump -h host -u user -p database > backup.sql

# 连接数据库
mysql -h host -u user -p database
```

---

## 🔍 健康检查

部署完成后，可以通过以下方式检查服务状态：

### 1. API健康检查
```bash
curl https://api.rateyourdj.com/health
```

### 2. PM2状态检查
```bash
pm2 status
```

### 3. Nginx状态检查
```bash
systemctl status nginx
```

### 4. 数据库连接检查
查看PM2日志中是否有：
```
✅ Database connected successfully
```

---

## 📊 监控和日志

### 应用日志
```bash
# PM2日志
pm2 logs rateyourdj-api

# 日志文件位置
./logs/out.log    # 标准输出
./logs/error.log  # 错误日志
```

### Nginx日志
```bash
# 访问日志
tail -f /var/log/nginx/rateyourdj-access.log

# 错误日志
tail -f /var/log/nginx/rateyourdj-error.log
```

### 系统资源监控
```bash
pm2 monit           # PM2内置监控
htop               # 系统资源监控
df -h              # 磁盘使用情况
```

---

## 🚨 故障排查

### 常见问题

**1. 应用无法启动**
```bash
# 查看详细错误
pm2 logs rateyourdj-api --lines 50

# 常见原因：
# - 数据库连接失败（检查.env配置）
# - 端口被占用（lsof -i :3000）
# - 依赖未安装（npm install）
```

**2. 502 Bad Gateway**
```bash
# 检查应用状态
pm2 status

# 如果应用未运行，重启它
pm2 restart rateyourdj-api

# 检查Nginx配置
nginx -t
```

**3. OSS上传失败**
```bash
# 检查环境变量
cat .env | grep OSS_

# 常见原因：
# - AccessKey错误
# - Bucket名称或Region错误
# - Bucket权限设置问题（需要设置为公共读）
```

**4. 数据库连接超时**
```bash
# 检查RDS白名单
# 确保ECS服务器IP已添加到RDS白名单

# 测试连接
mysql -h your-rds-host -u user -p
```

---

## 📚 相关文档

- [快速开始 (QUICK_START.md)](./QUICK_START.md) - 30分钟快速部署
- [详细部署 (DEPLOYMENT.md)](./DEPLOYMENT.md) - 完整部署指南
- [API文档 (API.md)](./API.md) - 接口文档
- [数据库设计 (database.sql)](./database.sql) - 数据库结构

---

## ⚙️ 技术栈

- **运行环境**：Node.js 18 LTS
- **Web框架**：Express 5
- **数据库**：MySQL 8.0
- **认证**：JWT
- **文件上传**：Multer + 阿里云OSS
- **进程管理**：PM2
- **反向代理**：Nginx
- **SSL证书**：Let's Encrypt / 阿里云证书

---

## 🔄 更新流程

### 方法1：使用部署脚本（推荐）
```bash
cd /var/www/rateyourdj-backend
./deploy.sh
```

### 方法2：手动更新
```bash
cd /var/www/rateyourdj-backend
git pull
npm install --production
pm2 restart rateyourdj-api
```

---

## 🔒 安全建议

1. **定期更新系统**
   ```bash
   apt update && apt upgrade -y
   ```

2. **配置防火墙**
   ```bash
   ufw allow 22/tcp    # SSH
   ufw allow 80/tcp    # HTTP
   ufw allow 443/tcp   # HTTPS
   ufw enable
   ```

3. **保护敏感信息**
   - 不要将`.env`文件提交到Git
   - 定期更换AccessKey
   - 使用强密码

4. **数据库备份**
   ```bash
   # 设置每日自动备份
   crontab -e
   # 添加：0 2 * * * mysqldump -h host -u user -ppass db > /backup/$(date +\%Y\%m\%d).sql
   ```

---

## 📞 技术支持

如有问题，请：
1. 查看 [DEPLOYMENT.md](./DEPLOYMENT.md) 中的故障排查章节
2. 检查日志：`pm2 logs rateyourdj-api`
3. 查看Nginx日志：`/var/log/nginx/rateyourdj-error.log`

---

**祝部署顺利！🎉**
