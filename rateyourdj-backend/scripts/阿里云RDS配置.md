# 阿里云 RDS 配置指南

## ✅ 完全兼容

脚本已确认 **完全兼容** 阿里云 RDS MySQL：

- ✅ MySQL 协议完全相同
- ✅ 所有 SQL 语法支持
- ✅ mysql 命令行工具通用
- ✅ 端口默认都是 3306
- ✅ utf8mb4 字符集支持

## 快速配置

### 1. 获取 RDS 连接信息

在阿里云控制台 → 云数据库 RDS → 实例列表 → 点击实例 ID：

```
基本信息：
- 外网地址：rm-bp1xxxxx.mysql.rds.aliyuncs.com
- 内网地址：rm-bp1xxxxx.mysql.rds.aliyuncs.com (VPC 内使用)
- 端口：3306
- 账号：root 或你创建的账号
```

### 2. 配置白名单（重要！）

**阿里云 RDS 默认不允许外网访问**，需要先添加白名单：

1. 进入 RDS 实例详情页
2. 左侧菜单：数据安全性 → 白名单设置
3. 点击"添加白名单分组"
4. 输入你的本机公网 IP

查看本机公网 IP：
```bash
curl ifconfig.me
```

或者临时测试可以添加：`0.0.0.0/0`（不推荐生产环境）

### 3. 配置 .env.rds

```bash
# 编辑配置文件
cd rateyourdj-backend
nano .env.rds
```

填入：
```bash
RDS_HOST=rm-bp1xxxxx.mysql.rds.aliyuncs.com
RDS_PORT=3306
RDS_USER=root
RDS_PASSWORD=你的密码
RDS_DB_NAME=rateyourdj
```

### 4. 测试连接

```bash
# 检查连接和状态
./scripts/check-rds-status.sh
```

如果连接成功，会显示：
```
✅ 连接成功
✅ 数据库存在
📊 数据表：总数 XX
```

### 5. 同步数据库

```bash
./scripts/sync-to-rds.sh
```

## 阿里云 RDS 特有配置

### 白名单设置

**方式一：指定 IP**（推荐）
```
123.45.67.89/32
```

**方式二：IP 段**
```
123.45.67.0/24
```

**方式三：临时测试**（不安全）
```
0.0.0.0/0
```

### 内网 vs 外网

| 连接方式 | 地址格式 | 使用场景 | 需要白名单 |
|---------|---------|---------|-----------|
| 外网 | rm-xxxxx.mysql.rds.aliyuncs.com | 本地开发、远程管理 | ✅ 是 |
| 内网 | rm-xxxxx.mysql.rds.aliyuncs.com | ECS 同 VPC | ✅ 是 |

**推荐**：生产环境使用内网地址，开发环境使用外网地址

### 性能优化建议

1. **使用内网连接**（如果 ECS 和 RDS 在同一区域）
2. **启用 SSL 加密**（生产环境）
3. **配置慢查询日志**（监控性能）
4. **定期备份**（自动备份策略）

## 常见问题

### Q1: 连接超时

```
ERROR 2003 (HY000): Can't connect to MySQL server
```

**解决方案**：
1. 检查白名单是否包含你的 IP
2. 确认使用的是外网地址（rm-xxxxx.mysql.rds.aliyuncs.com）
3. 检查本地防火墙是否允许出站 3306 端口

### Q2: 访问被拒绝

```
ERROR 1045 (28000): Access denied for user 'root'@'xxx'
```

**解决方案**：
1. 确认用户名和密码正确
2. 检查账号是否有远程访问权限
3. 在 RDS 控制台 → 账号管理 → 确认账号状态

### Q3: 数据库不存在

```
ERROR 1049 (42000): Unknown database 'rateyourdj'
```

**解决方案**：
脚本会自动创建数据库，如果失败请检查账号权限：
```sql
GRANT ALL PRIVILEGES ON rateyourdj.* TO 'your_user'@'%';
FLUSH PRIVILEGES;
```

### Q4: 字符集问题

如果遇到中文乱码，确认字符集：
```sql
SHOW VARIABLES LIKE 'character%';
```

应该都是 `utf8mb4`，脚本已自动配置。

## 安全建议

### 生产环境清单

- ✅ 使用强密码（至少 12 位，包含大小写字母、数字、特殊字符）
- ✅ 白名单只添加必要的 IP
- ✅ 使用专用数据库账号（不要用 root）
- ✅ 启用 SSL/TLS 连接
- ✅ 定期更新密码
- ✅ 启用审计日志
- ✅ 配置自动备份（至少保留 7 天）

### 创建专用账号

```sql
-- 在 RDS 控制台或通过 root 账号执行
CREATE USER 'rateyourdj_app'@'%' IDENTIFIED BY '强密码';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, INDEX, ALTER
  ON rateyourdj.* TO 'rateyourdj_app'@'%';
FLUSH PRIVILEGES;
```

然后在 `.env.rds` 使用这个账号。

## 性能监控

### 阿里云控制台

1. **实例监控**：查看 CPU、内存、IOPS
2. **慢查询统计**：优化慢查询
3. **空间使用**：监控磁盘使用率
4. **性能洞察**：分析 SQL 性能

### 命令行监控

```bash
# 查看当前连接数
mysql -h RDS_HOST -u USER -p -e "SHOW PROCESSLIST"

# 查看表大小
mysql -h RDS_HOST -u USER -p DB_NAME -e "
SELECT
  table_name AS '表名',
  ROUND(((data_length + index_length) / 1024 / 1024), 2) AS '大小(MB)'
FROM information_schema.TABLES
WHERE table_schema = 'rateyourdj'
ORDER BY (data_length + index_length) DESC;
"
```

## 与 AWS RDS 的区别

| 特性 | 阿里云 RDS | AWS RDS |
|-----|-----------|---------|
| 访问控制 | 白名单 | 安全组 |
| 地址格式 | .mysql.rds.aliyuncs.com | .rds.amazonaws.com |
| 默认用户 | root | admin |
| MySQL 版本 | 5.7, 8.0 | 5.7, 8.0 |
| 脚本兼容性 | ✅ 完全兼容 | ✅ 完全兼容 |

## 总结

✅ **脚本已完全适配阿里云 RDS**

只需要：
1. 配置白名单
2. 填写 `.env.rds`
3. 运行 `./scripts/sync-to-rds.sh`

所有功能都能正常工作，无需任何代码修改！
