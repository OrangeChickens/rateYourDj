# RateYourDJ 生产环境部署指南

## 一、阿里云资源准备清单

### 1. ECS云服务器
- [ ] 购买ECS实例（推荐：2核4G，Ubuntu 22.04）
- [ ] 记录公网IP地址
- [ ] 配置安全组规则：
  - 开放端口：22（SSH）、80（HTTP）、443（HTTPS）
  - 如果使用Nginx反向代理，可不开放3000端口

### 2. RDS云数据库（推荐）或自建MySQL
**选项A：RDS（推荐）**
- [ ] 购买RDS MySQL 8.0实例
- [ ] 记录连接地址、端口、数据库名
- [ ] 创建数据库账号和密码
- [ ] 在白名单中添加ECS服务器IP

**选项B：自建MySQL**
- [ ] 在ECS上安装MySQL 8.0
- [ ] 配置远程访问和安全设置

### 3. OSS对象存储
- [ ] 创建Bucket（例如：rateyourdj-images）
- [ ] 选择地域（建议与ECS同地域，如：华东2-上海）
- [ ] 访问控制设置为：公共读（允许匿名访问图片）
- [ ] 记录以下信息：
  - Bucket名称
  - Region（如：oss-cn-shanghai）
  - 外网访问域名

### 4. AccessKey
- [ ] 登录阿里云控制台 → AccessKey管理
- [ ] 创建AccessKey（如果没有）
- [ ] **安全记录**：AccessKey ID 和 AccessKey Secret
- [ ] ⚠️ **重要**：不要提交到代码库

### 5. 域名和SSL证书
- [ ] 购买域名（如：api.rateyourdj.com）
- [ ] 完成域名实名认证
- [ ] 申请SSL证书（阿里云提供免费DV证书）
- [ ] 域名解析：添加A记录指向ECS公网IP
- [ ] 下载SSL证书文件（Nginx格式）

---

## 二、服务器环境配置

### 1. 连接到ECS服务器
```bash
ssh root@your-server-ip
```

### 2. 更新系统并安装基础软件
```bash
# 更新软件包
apt update && apt upgrade -y

# 安装必要工具
apt install -y curl git vim
```

### 3. 安装Node.js 18 LTS
```bash
# 使用nvm安装（推荐）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
nvm alias default 18

# 验证安装
node -v  # 应显示 v18.x.x
npm -v
```

### 4. 安装PM2（进程管理器）
```bash
npm install -g pm2

# 设置开机自启动
pm2 startup
```

### 5. 安装Nginx（反向代理和SSL）
```bash
apt install -y nginx

# 启动Nginx
systemctl start nginx
systemctl enable nginx
```

### 6. 安装MySQL（如果不使用RDS）
```bash
apt install -y mysql-server

# 安全配置
mysql_secure_installation

# 创建数据库
mysql -u root -p
CREATE DATABASE rateyourdj CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'rateyourdj'@'localhost' IDENTIFIED BY 'your-password';
GRANT ALL PRIVILEGES ON rateyourdj.* TO 'rateyourdj'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

---

## 三、部署后端代码

### 1. 克隆代码到服务器
```bash
# 创建项目目录
mkdir -p /var/www
cd /var/www

# 克隆代码（或通过git clone）
# 如果使用git：
git clone your-repository-url rateyourdj-backend

# 或者使用scp从本地上传：
# 本地执行：scp -r rateyourdj-backend root@your-server-ip:/var/www/
```

### 2. 安装依赖
```bash
cd /var/www/rateyourdj-backend
npm install --production
```

### 3. 配置环境变量
```bash
# 复制环境变量模板
cp .env.production.example .env

# 编辑配置文件
vim .env
```

填入以下真实值：
```bash
# Server
PORT=3000
NODE_ENV=production

# Database（RDS地址或本地MySQL）
DB_HOST=rm-xxxxxx.mysql.rds.aliyuncs.com
DB_PORT=3306
DB_USER=rateyourdj
DB_PASSWORD=你的数据库密码
DB_NAME=rateyourdj

# JWT（生成强随机密钥）
JWT_SECRET=使用命令生成：node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_EXPIRES_IN=7d

# WeChat（小程序后台获取）
WECHAT_APP_ID=你的小程序AppID
WECHAT_APP_SECRET=你的小程序AppSecret

# Aliyun OSS
OSS_REGION=oss-cn-shanghai
OSS_ACCESS_KEY_ID=你的AccessKey-ID
OSS_ACCESS_KEY_SECRET=你的AccessKey-Secret
OSS_BUCKET=rateyourdj-images
```

### 4. 导入数据库结构
```bash
# 如果使用RDS
mysql -h rm-xxxxxx.mysql.rds.aliyuncs.com -u rateyourdj -p rateyourdj < database.sql

# 如果使用本地MySQL
mysql -u rateyourdj -p rateyourdj < database.sql
```

### 5. 设置第一个管理员用户
```bash
# 连接数据库
mysql -h your-db-host -u rateyourdj -p rateyourdj

# 执行SQL（登录后手动设置某个用户为admin）
UPDATE users SET role = 'admin' WHERE id = 1;
EXIT;
```

### 6. 使用PM2启动应用
```bash
cd /var/www/rateyourdj-backend

# 启动应用
pm2 start src/app.js --name rateyourdj-api

# 查看日志
pm2 logs rateyourdj-api

# 保存PM2配置（开机自启）
pm2 save

# 查看状态
pm2 status
```

---

## 四、配置Nginx和SSL

### 1. 上传SSL证书
```bash
# 创建证书目录
mkdir -p /etc/nginx/ssl

# 上传证书文件（本地执行）
scp your-domain.pem root@your-server-ip:/etc/nginx/ssl/
scp your-domain.key root@your-server-ip:/etc/nginx/ssl/
```

### 2. 配置Nginx反向代理
```bash
vim /etc/nginx/sites-available/rateyourdj
```

粘贴以下配置：
```nginx
# HTTP重定向到HTTPS
server {
    listen 80;
    server_name api.rateyourdj.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS配置
server {
    listen 443 ssl http2;
    server_name api.rateyourdj.com;

    # SSL证书配置
    ssl_certificate /etc/nginx/ssl/your-domain.pem;
    ssl_certificate_key /etc/nginx/ssl/your-domain.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # 日志
    access_log /var/log/nginx/rateyourdj-access.log;
    error_log /var/log/nginx/rateyourdj-error.log;

    # 反向代理到Node.js应用
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 上传文件大小限制
    client_max_body_size 10M;
}
```

### 3. 启用站点并重启Nginx
```bash
# 创建软链接
ln -s /etc/nginx/sites-available/rateyourdj /etc/nginx/sites-enabled/

# 测试配置
nginx -t

# 重启Nginx
systemctl restart nginx
```

---

## 五、配置OSS（对象存储）

### 1. 登录阿里云OSS控制台
- 进入你创建的Bucket（rateyourdj-images）

### 2. 配置跨域访问（CORS）
在Bucket设置中添加CORS规则：
```
来源：*
允许方法：GET, POST, PUT, DELETE, HEAD
允许Headers：*
暴露Headers：ETag, x-oss-request-id
缓存时间：0
```

### 3. 配置访问控制
- 读写权限：公共读（允许匿名访问图片）
- 防盗链：可选，建议配置Referer白名单

### 4. （可选）配置CDN加速
- 开通CDN服务
- 添加加速域名（如：cdn.rateyourdj.com）
- 源站选择OSS Bucket
- 配置HTTPS证书
- 在.env中添加：`OSS_CDN_DOMAIN=cdn.rateyourdj.com`

---

## 六、微信小程序配置

### 1. 配置服务器域名白名单
登录微信小程序后台 → 开发管理 → 开发设置 → 服务器域名

添加以下域名：
- **request合法域名**：`https://api.rateyourdj.com`
- **uploadFile合法域名**：`https://api.rateyourdj.com`
- **downloadFile合法域名**：
  - `https://rateyourdj-images.oss-cn-shanghai.aliyuncs.com`（OSS域名）
  - 或 `https://cdn.rateyourdj.com`（如果使用CDN）

### 2. 修改小程序代码
编辑 `rateyourdj-miniprogram/app.js`：
```javascript
globalData: {
  apiBaseUrl: 'https://api.rateyourdj.com/api'  // 修改为生产环境域名
}
```

### 3. 上传小程序代码
- 在微信开发者工具中点击"上传"
- 填写版本号和备注
- 提交审核

---

## 七、验证部署

### 1. 测试API接口
```bash
# 测试健康检查
curl https://api.rateyourdj.com/health

# 应返回：
{
  "success": true,
  "message": "RateYourDJ API is running",
  "timestamp": "..."
}
```

### 2. 测试数据库连接
查看PM2日志：
```bash
pm2 logs rateyourdj-api
# 应显示：✅ Database connected successfully
```

### 3. 测试OSS上传
- 使用小程序管理员账号
- 进入"上传DJ资料"页面
- 上传图片测试

### 4. 测试完整流程
- [ ] 用户登录
- [ ] 浏览DJ列表
- [ ] 查看DJ详情
- [ ] 收藏DJ
- [ ] 写评价
- [ ] 管理员上传DJ

---

## 八、日常运维

### PM2常用命令
```bash
# 查看应用状态
pm2 status

# 查看日志
pm2 logs rateyourdj-api

# 重启应用
pm2 restart rateyourdj-api

# 停止应用
pm2 stop rateyourdj-api

# 重载应用（零停机）
pm2 reload rateyourdj-api

# 查看详细信息
pm2 show rateyourdj-api

# 监控资源
pm2 monit
```

### 代码更新流程
```bash
# 1. 拉取最新代码
cd /var/www/rateyourdj-backend
git pull

# 2. 安装新依赖（如果有）
npm install --production

# 3. 重启应用
pm2 restart rateyourdj-api

# 4. 查看日志确认启动成功
pm2 logs rateyourdj-api
```

### 数据库备份
```bash
# 手动备份
mysqldump -h your-db-host -u rateyourdj -p rateyourdj > backup_$(date +%Y%m%d).sql

# 设置定时备份（crontab）
crontab -e
# 添加：每天凌晨2点备份
0 2 * * * mysqldump -h your-db-host -u rateyourdj -p'password' rateyourdj > /backup/rateyourdj_$(date +\%Y\%m\%d).sql
```

### 查看系统资源
```bash
# CPU和内存使用
htop

# 磁盘空间
df -h

# 网络连接
netstat -tunlp
```

---

## 九、安全建议

1. **防火墙配置**
```bash
# 使用UFW防火墙
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
```

2. **SSH安全**
- 禁用root密码登录，使用密钥认证
- 修改SSH默认端口
- 安装fail2ban防止暴力破解

3. **定期更新**
```bash
# 定期更新系统
apt update && apt upgrade -y
```

4. **监控和告警**
- 配置阿里云云监控
- 设置CPU、内存、磁盘告警
- PM2 Plus（付费）进行应用监控

---

## 十、故障排查

### 应用无法启动
```bash
# 查看详细错误日志
pm2 logs rateyourdj-api --lines 100

# 常见问题：
# 1. 数据库连接失败 → 检查.env中的数据库配置
# 2. 端口被占用 → lsof -i :3000
# 3. 依赖缺失 → npm install
```

### Nginx 502错误
```bash
# 检查Node.js应用是否运行
pm2 status

# 检查Nginx错误日志
tail -f /var/log/nginx/rateyourdj-error.log

# 测试Nginx配置
nginx -t
```

### OSS上传失败
- 检查AccessKey是否正确
- 检查Bucket权限设置
- 检查服务器网络连接
- 查看应用日志：`pm2 logs`

---

## 部署检查清单

部署完成后，请确认以下所有项目：

- [ ] ECS服务器可访问
- [ ] MySQL数据库已导入schema
- [ ] 环境变量已正确配置
- [ ] PM2应用正常运行
- [ ] Nginx反向代理正常工作
- [ ] SSL证书配置成功（HTTPS可访问）
- [ ] OSS Bucket创建并配置
- [ ] 微信小程序服务器域名已配置
- [ ] 小程序apiBaseUrl已更新为生产域名
- [ ] API健康检查接口返回正常
- [ ] 管理员账号已设置
- [ ] 图片上传到OSS测试成功
- [ ] 小程序提交审核

---

如有问题，请检查：
1. PM2日志：`pm2 logs rateyourdj-api`
2. Nginx日志：`/var/log/nginx/rateyourdj-error.log`
3. 系统日志：`journalctl -xe`
