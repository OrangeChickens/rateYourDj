# 快速部署指南（30分钟上线）

## 前置条件

确保你已经有：
- ✅ 阿里云ECS服务器（已安装Node.js 18、Nginx、MySQL）
- ✅ 域名（已解析到服务器IP）
- ✅ SSL证书（已下载）
- ✅ 阿里云OSS Bucket（已创建）
- ✅ AccessKey ID 和 Secret（已获取）

---

## 第一步：上传代码（5分钟）

### 方法A：使用Git（推荐）
```bash
# 在服务器上
cd /var/www
git clone your-repository-url rateyourdj-backend
cd rateyourdj-backend
```

### 方法B：使用SCP上传
```bash
# 在本地执行
cd /Users/yichengliang/Desktop/ws/rateyourdj
scp -r rateyourdj-backend root@your-server-ip:/var/www/
```

---

## 第二步：配置环境变量（5分钟）

```bash
# 在服务器上
cd /var/www/rateyourdj-backend

# 复制模板
cp .env.production.example .env

# 编辑配置
vim .env
```

**必须修改的配置项**：
```bash
# 数据库（RDS地址）
DB_HOST=rm-xxxxxx.mysql.rds.aliyuncs.com
DB_PASSWORD=你的数据库密码

# JWT密钥（生成随机密钥）
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# 微信小程序
WECHAT_APP_ID=wxXXXXXXXXXXXXXXXX
WECHAT_APP_SECRET=你的AppSecret

# 阿里云OSS
OSS_REGION=oss-cn-shanghai
OSS_ACCESS_KEY_ID=LTAI5XXXXXXXXX
OSS_ACCESS_KEY_SECRET=你的AccessKeySecret
OSS_BUCKET=rateyourdj-images
```

---

## 第三步：安装依赖并导入数据库（5分钟）

```bash
# 安装依赖
npm install --production

# 导入数据库
mysql -h rm-xxxxxx.mysql.rds.aliyuncs.com -u rateyourdj -p rateyourdj < database.sql

# 设置管理员（登录MySQL后执行）
mysql -h your-db-host -u rateyourdj -p rateyourdj
UPDATE users SET role = 'admin' WHERE id = 1;
EXIT;
```

---

## 第四步：启动应用（5分钟）

```bash
# 安装PM2（如果还没安装）
npm install -g pm2

# 使用配置文件启动
pm2 start ecosystem.config.js

# 或使用简单命令启动
pm2 start src/app.js --name rateyourdj-api

# 查看日志确认启动成功
pm2 logs rateyourdj-api

# 保存配置（开机自启）
pm2 save
pm2 startup  # 按照提示执行命令
```

**期望输出**：
```
✅ Database connected successfully
🚀 Server is running on http://localhost:3000
```

---

## 第五步：配置Nginx和SSL（10分钟）

### 1. 上传SSL证书
```bash
mkdir -p /etc/nginx/ssl
# 上传证书文件到这个目录
```

### 2. 创建Nginx配置
```bash
vim /etc/nginx/sites-available/rateyourdj
```

粘贴以下内容（**记得替换域名和证书路径**）：
```nginx
server {
    listen 80;
    server_name api.rateyourdj.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.rateyourdj.com;

    ssl_certificate /etc/nginx/ssl/your-domain.pem;
    ssl_certificate_key /etc/nginx/ssl/your-domain.key;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    client_max_body_size 10M;
}
```

### 3. 启用配置
```bash
ln -s /etc/nginx/sites-available/rateyourdj /etc/nginx/sites-enabled/
nginx -t  # 测试配置
systemctl restart nginx
```

---

## 第六步：测试部署（5分钟）

### 1. 测试API
```bash
curl https://api.rateyourdj.com/health
```

**期望返回**：
```json
{
  "success": true,
  "message": "RateYourDJ API is running",
  "timestamp": "2024-02-06T..."
}
```

### 2. 测试完整流程
- ✅ 访问小程序 → 能登录
- ✅ 浏览DJ列表 → 能看到数据
- ✅ 管理员上传DJ → 图片能上传到OSS

---

## 第七步：配置微信小程序（5分钟）

### 1. 小程序后台配置服务器域名
登录 [微信公众平台](https://mp.weixin.qq.com/)

开发管理 → 开发设置 → 服务器域名，添加：
- **request合法域名**：`https://api.rateyourdj.com`
- **uploadFile合法域名**：`https://api.rateyourdj.com`
- **downloadFile合法域名**：`https://rateyourdj-images.oss-cn-shanghai.aliyuncs.com`

### 2. 修改小程序代码
编辑 `rateyourdj-miniprogram/app.js`：
```javascript
globalData: {
  apiBaseUrl: 'https://api.rateyourdj.com/api'
}
```

### 3. 上传代码
在微信开发者工具：
1. 点击"上传"
2. 填写版本号
3. 提交审核

---

## 完成！🎉

你的RateYourDJ平台现已上线运行！

### 日常运维命令

```bash
# 查看应用状态
pm2 status

# 查看日志
pm2 logs rateyourdj-api

# 重启应用
pm2 restart rateyourdj-api

# 更新代码
cd /var/www/rateyourdj-backend
git pull
npm install --production
pm2 restart rateyourdj-api

# 或使用快捷脚本
./deploy.sh
```

---

## 故障排查

### 问题1：502 Bad Gateway
```bash
# 检查应用是否运行
pm2 status

# 如果没运行，启动它
pm2 start ecosystem.config.js

# 查看错误日志
pm2 logs rateyourdj-api --err
```

### 问题2：数据库连接失败
```bash
# 检查.env配置
cat .env | grep DB_

# 测试数据库连接
mysql -h your-db-host -u rateyourdj -p
```

### 问题3：OSS上传失败
```bash
# 查看应用日志
pm2 logs rateyourdj-api

# 常见原因：
# - AccessKey错误
# - Bucket名称错误
# - Region配置错误
```

### 获取帮助
如需详细部署文档，请查看：[DEPLOYMENT.md](./DEPLOYMENT.md)
