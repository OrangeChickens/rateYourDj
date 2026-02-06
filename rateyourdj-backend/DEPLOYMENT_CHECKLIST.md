# 部署检查清单

使用此清单确保所有部署步骤都已完成。

## 阶段一：准备工作

### 阿里云资源
- [ ] 购买ECS服务器（2核4G，Ubuntu 22.04）
- [ ] 记录ECS公网IP：________________
- [ ] 购买或准备RDS MySQL 8.0
- [ ] 记录RDS连接地址：________________
- [ ] 创建数据库账号和密码
- [ ] 将ECS IP添加到RDS白名单
- [ ] 创建OSS Bucket
- [ ] Bucket名称：________________
- [ ] Bucket地域：________________
- [ ] Bucket权限设置为"公共读"
- [ ] 获取AccessKey ID：________________
- [ ] 获取AccessKey Secret：________________（不要记录在此文件）

### 域名和证书
- [ ] 购买域名：________________
- [ ] 域名实名认证完成
- [ ] 申请SSL证书
- [ ] 下载SSL证书（Nginx格式）
- [ ] 域名解析：A记录指向ECS IP

### 微信小程序
- [ ] 记录小程序AppID：________________
- [ ] 记录小程序AppSecret：________________（不要记录在此文件）

---

## 阶段二：服务器配置

### 基础环境
- [ ] SSH连接到服务器成功
- [ ] 更新系统：`apt update && apt upgrade -y`
- [ ] 安装Node.js 18 LTS
- [ ] 验证：`node -v` 显示 v18.x.x
- [ ] 安装PM2：`npm install -g pm2`
- [ ] 安装Nginx：`apt install nginx`
- [ ] Nginx启动成功：`systemctl status nginx`

### 数据库（如果自建）
- [ ] 安装MySQL 8.0
- [ ] 创建数据库：rateyourdj
- [ ] 创建数据库用户
- [ ] 配置远程访问

---

## 阶段三：代码部署

### 上传代码
- [ ] 代码已上传到服务器：`/var/www/rateyourdj-backend`
- [ ] 安装依赖：`npm install --production`

### 配置文件
- [ ] 复制环境变量模板：`cp .env.production.example .env`
- [ ] 配置 PORT=3000
- [ ] 配置 NODE_ENV=production
- [ ] 配置 DB_HOST
- [ ] 配置 DB_PORT=3306
- [ ] 配置 DB_USER
- [ ] 配置 DB_PASSWORD
- [ ] 配置 DB_NAME=rateyourdj
- [ ] 生成JWT_SECRET（随机字符串）
- [ ] 配置 WECHAT_APP_ID
- [ ] 配置 WECHAT_APP_SECRET
- [ ] 配置 OSS_REGION
- [ ] 配置 OSS_ACCESS_KEY_ID
- [ ] 配置 OSS_ACCESS_KEY_SECRET
- [ ] 配置 OSS_BUCKET

### 数据库
- [ ] 导入数据库结构：`mysql ... < database.sql`
- [ ] 验证表已创建：`SHOW TABLES;`
- [ ] 设置管理员用户：`UPDATE users SET role = 'admin' WHERE id = 1;`

---

## 阶段四：启动服务

### PM2
- [ ] 启动应用：`pm2 start ecosystem.config.js`
- [ ] 查看日志：`pm2 logs`
- [ ] 确认启动成功：看到 "✅ Database connected successfully"
- [ ] 确认端口监听：看到 "🚀 Server is running"
- [ ] 保存配置：`pm2 save`
- [ ] 设置开机启动：`pm2 startup`

---

## 阶段五：Nginx和SSL

### SSL证书
- [ ] 创建证书目录：`mkdir -p /etc/nginx/ssl`
- [ ] 上传 .pem 文件到 `/etc/nginx/ssl/`
- [ ] 上传 .key 文件到 `/etc/nginx/ssl/`
- [ ] 设置证书文件权限：`chmod 600 /etc/nginx/ssl/*`

### Nginx配置
- [ ] 创建配置文件：`/etc/nginx/sites-available/rateyourdj`
- [ ] 修改 server_name 为你的域名
- [ ] 修改 ssl_certificate 路径
- [ ] 修改 ssl_certificate_key 路径
- [ ] 创建软链接：`ln -s /etc/nginx/sites-available/rateyourdj /etc/nginx/sites-enabled/`
- [ ] 测试配置：`nginx -t`（应显示"syntax is ok"）
- [ ] 重启Nginx：`systemctl restart nginx`

---

## 阶段六：验证部署

### API测试
- [ ] 测试HTTP重定向：`curl -I http://api.rateyourdj.com`
  - 应返回301重定向到HTTPS
- [ ] 测试HTTPS健康检查：`curl https://api.rateyourdj.com/health`
  - 应返回 `{"success": true, ...}`
- [ ] 测试DJ列表接口：`curl https://api.rateyourdj.com/api/dj/list`

### 数据库连接
- [ ] 查看PM2日志无数据库错误
- [ ] 能成功查询DJ列表

### OSS上传
- [ ] 登录阿里云OSS控制台
- [ ] 验证Bucket存在
- [ ] 验证CORS配置已添加
- [ ] 后续将通过小程序测试实际上传

---

## 阶段七：微信小程序配置

### 服务器域名配置
- [ ] 登录微信公众平台：https://mp.weixin.qq.com
- [ ] 进入：开发管理 → 开发设置 → 服务器域名
- [ ] 添加 request合法域名：`https://api.rateyourdj.com`
- [ ] 添加 uploadFile合法域名：`https://api.rateyourdj.com`
- [ ] 添加 downloadFile合法域名：`https://your-bucket.oss-region.aliyuncs.com`
  - 实际域名：________________

### 小程序代码
- [ ] 修改 `app.js` 中的 `apiBaseUrl` 为 `https://api.rateyourdj.com/api`
- [ ] 在微信开发者工具中测试登录
- [ ] 测试浏览DJ列表
- [ ] 测试查看DJ详情
- [ ] 测试管理员上传DJ（含图片上传）
- [ ] 测试写评价
- [ ] 测试收藏功能

### 提交审核
- [ ] 微信开发者工具点击"上传"
- [ ] 填写版本号和备注
- [ ] 在公众平台提交审核
- [ ] 补充审核资料（如需要）

---

## 阶段八：安全加固

### 防火墙
- [ ] 安装UFW：`apt install ufw`
- [ ] 允许SSH：`ufw allow 22/tcp`
- [ ] 允许HTTP：`ufw allow 80/tcp`
- [ ] 允许HTTPS：`ufw allow 443/tcp`
- [ ] 启用防火墙：`ufw enable`

### SSH安全
- [ ] 禁用root密码登录（使用密钥）
- [ ] 安装fail2ban防暴力破解

### 备份
- [ ] 设置数据库定时备份（crontab）
- [ ] 测试备份是否正常生成
- [ ] 配置备份文件存储位置

---

## 阶段九：监控和告警

### 云监控
- [ ] 登录阿里云云监控控制台
- [ ] 为ECS配置CPU告警（>80%）
- [ ] 为ECS配置内存告警（>80%）
- [ ] 为ECS配置磁盘告警（>80%）
- [ ] 为RDS配置连接数告警

### 日志
- [ ] 确认PM2日志正常写入：`ls -lh logs/`
- [ ] 确认Nginx日志正常写入：`ls -lh /var/log/nginx/`

---

## 阶段十：最终验证

### 完整流程测试
- [ ] 用户注册登录
- [ ] 浏览DJ列表
- [ ] 搜索DJ
- [ ] 查看DJ详情
- [ ] 写评价（含标签选择）
- [ ] 收藏DJ
- [ ] 查看我的收藏
- [ ] 管理员上传DJ（含图片）
- [ ] 图片能正常显示（来自OSS）
- [ ] 切换语言（中英文）

### 性能测试
- [ ] 首页加载速度 < 2秒
- [ ] API响应时间 < 500ms
- [ ] 图片加载速度正常

### 压力测试（可选）
- [ ] 使用ab或wrk进行压力测试
- [ ] 验证并发处理能力

---

## 完成！

所有检查项都已完成？恭喜你！🎉

### 下一步
1. 监控前几天的运行状态
2. 收集用户反馈
3. 根据实际使用情况优化配置

### 常用维护命令
```bash
# 查看应用状态
pm2 status

# 查看日志
pm2 logs rateyourdj-api

# 重启应用
pm2 restart rateyourdj-api

# 更新代码
cd /var/www/rateyourdj-backend
./deploy.sh
```

### 紧急联系
- PM2日志：`/var/www/rateyourdj-backend/logs/`
- Nginx日志：`/var/log/nginx/`
- 故障排查：查看 [DEPLOYMENT.md](./DEPLOYMENT.md) 第十章

---

**部署完成日期**：________________

**部署人员**：________________

**备注**：
_______________________________________________
_______________________________________________
_______________________________________________
