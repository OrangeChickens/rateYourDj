# 生产环境信息

⚠️ **此文件不包含敏感信息，实际密码和密钥请查看服务器上的.env文件**

## 服务器信息
- **服务器IP**: 你的服务器IP
- **SSH用户**: root
- **项目路径**: /var/www/rateYourDj/rateyourdj-backend

## 域名和SSL
- **域名**: https://rateyourdj.pbrick.cn
- **SSL证书位置**: /etc/nginx/ssl/

## 数据库配置
- **类型**: 阿里云RDS MySQL 8.0
- **Host**: 查看服务器 .env 中的 DB_HOST
- **Port**: 3306
- **Database**: rateyourdj
- **User**: rateyourdj
- **Password**: ⚠️ 查看服务器 .env 文件

### TablePlus连接
1. 获取配置：`ssh root@服务器IP "cat /var/www/rateYourDj/rateyourdj-backend/.env | grep DB_"`
2. 添加本地IP到RDS白名单
3. 本地公网IP：`curl ifconfig.me`

## OSS配置
- **Region**: 查看服务器 .env 中的 OSS_REGION
- **Bucket**: 查看服务器 .env 中的 OSS_BUCKET
- **AccessKey ID**: ⚠️ 查看服务器 .env 文件
- **AccessKey Secret**: ⚠️ 查看服务器 .env 文件

## 微信小程序
- **AppID**: 查看服务器 .env 中的 WECHAT_APP_ID
- **AppSecret**: ⚠️ 查看服务器 .env 文件

## 常用命令

### 查看应用状态
```bash
ssh root@服务器IP
pm2 status
pm2 logs rateyourdj-api
```

### 查看数据库配置
```bash
ssh root@服务器IP "cat /var/www/rateYourDj/rateyourdj-backend/.env | grep DB_"
```

### 更新代码（服务器无法访问GitHub，需要用scp上传）
```bash
# 本地上传文件
cd /Users/yichengliang/Desktop/ws/rateyourdj/rateyourdj-backend
scp -r src/ root@服务器IP:/var/www/rateYourDj/rateyourdj-backend/

# 服务器上重启
ssh root@服务器IP "pm2 restart rateyourdj-api"
```

### 重启服务
```bash
ssh root@服务器IP "pm2 restart rateyourdj-api"
```

### 查看Nginx日志
```bash
ssh root@服务器IP "tail -f /var/log/nginx/rateyourdj-error.log"
```

## 备份

### 数据库备份
```bash
ssh root@服务器IP "mysqldump -h RDS地址 -u rateyourdj -p rateyourdj > /backup/rateyourdj_$(date +%Y%m%d).sql"
```
