# 图片显示问题调试指南

## 问题描述
OSS 里有图片文件，但前端小程序不显示图片

## 调试步骤

### 1. 检查数据库中的 photo_url

运行以下 SQL 查询，检查实际存储的 URL 格式：

```bash
# 连接生产数据库
mysql -h <RDS_HOST> -u <RDS_USER> -p rateyourdj

# 查询最近创建的 DJ 的照片 URL
SELECT
  id,
  name,
  label,
  photo_url,
  created_at
FROM djs
ORDER BY id DESC
LIMIT 10;
```

**期望的 URL 格式** (新版本):
```
https://rateyourdj.oss-cn-shanghai.aliyuncs.com/dj-photos/independent/DJ_Name/2026-02-06_photo.jpg
```

或者使用 CDN 域名（如果配置了）:
```
https://cdn.rateyourdj.com/dj-photos/independent/DJ_Name/2026-02-06_photo.jpg
```

**检查点**:
- ✅ URL 是否完整（包含 https://）
- ✅ 域名是否正确
- ✅ 路径格式是否符合新的组织结构
- ✅ URL 是否可以在浏览器中直接访问

---

### 2. 验证 OSS Bucket 权限配置

#### 2.1 登录阿里云 OSS 控制台

1. 访问: https://oss.console.aliyun.com/
2. 选择 Bucket: `rateyourdj`
3. 进入 "权限管理" → "读写权限"

#### 2.2 检查 Bucket ACL

**必须设置为**: `公共读` (Public Read)

如果不是，需要修改：
- 在 OSS 控制台点击 "设置"
- 选择 "公共读"（允许匿名用户读取对象）

#### 2.3 检查跨域配置 (CORS)

进入 "权限管理" → "跨域设置"，确保有以下规则：

```
来源: *
允许 Methods: GET, HEAD
允许 Headers: *
暴露 Headers: ETag
缓存时间: 0
```

如果没有，点击 "创建规则" 添加。

---

### 3. 配置微信小程序域名白名单

#### 3.1 获取 OSS 域名

从数据库 photo_url 中提取域名，例如：
- `rateyourdj.oss-cn-shanghai.aliyuncs.com`

#### 3.2 添加到微信白名单

1. 登录微信公众平台: https://mp.weixin.qq.com/
2. 进入 "开发" → "开发管理" → "开发设置"
3. 找到 "服务器域名" 部分
4. 在 **downloadFile 合法域名** 中添加:

   ```
   https://rateyourdj.oss-cn-shanghai.aliyuncs.com
   ```

   **注意事项**:
   - 必须是 https://
   - 不要包含端口号
   - 不要包含路径（只填域名）
   - 域名必须备案
   - 每月只能修改 5 次

5. 保存后等待 5-10 分钟生效

#### 3.3 临时测试方法（开发阶段）

在微信开发者工具中：
- 点击右上角 "详情"
- 勾选 "不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书"

这样可以临时跳过域名验证，用于开发测试。

---

### 4. 测试新上传的图片

#### 4.1 部署最新代码

运行部署脚本：

```bash
cd /Users/yichengliang/Desktop/ws/rateyourdj
./deploy-oss-changes.sh
```

#### 4.2 在小程序中上传新 DJ

1. 登录小程序（确保是 admin 账号）
2. 进入 "设置" 页面，检查角色显示是否为 "admin"
3. 点击 "上传DJ资料"
4. 填写 DJ 信息：
   - 名称: TestDJ001
   - 城市: 上海
   - 厂牌: TestLabel
5. 选择照片并上传
6. 提交

#### 4.3 查看服务器日志

```bash
ssh root@rateyourdj.pbrick.cn

# 加载 nvm
source ~/.nvm/nvm.sh
nvm use 16

# 查看实时日志
pm2 logs rateyourdj-api --lines 50

# 查找图片上传相关日志
pm2 logs rateyourdj-api --lines 200 | grep "上传图片\|OSS"
```

**期望看到的日志**:
```
📤 开始上传图片:
  - 文件名: xxx.jpg
  - 大小: xxx KB
  - DJ名字: TestDJ001
  - DJ厂牌: TestLabel
🚀 使用阿里云OSS上传...
📂 OSS路径: dj-photos/TestLabel/TestDJ001/2026-02-06_xxx.jpg
⏳ 开始上传到OSS...
✅ OSS上传成功
  - OSS返回URL: https://rateyourdj.oss-cn-shanghai.aliyuncs.com/...
```

#### 4.4 验证 OSS 文件存在

登录 OSS 控制台，进入 Bucket，查看文件列表：
- 路径: `dj-photos/TestLabel/TestDJ001/`
- 应该能看到上传的图片文件

点击文件，复制 "URL"，在浏览器中直接访问，看是否能显示图片。

#### 4.5 检查数据库记录

```sql
SELECT id, name, label, photo_url
FROM djs
WHERE name = 'TestDJ001';
```

确认 photo_url 字段已正确保存 OSS URL。

---

### 5. 检查前端渲染逻辑

#### 5.1 检查 DJ 列表页面

文件: `rateyourdj-miniprogram/pages/index/index.wxml`

```xml
<image
  class="dj-avatar"
  src="{{item.photo_url || '/images/default-avatar.png'}}"
  mode="aspectFill"
/>
```

**检查点**:
- ✅ `item.photo_url` 是否有值
- ✅ 如果没有值，会显示默认头像

#### 5.2 检查 DJ 详情页面

文件: `rateyourdj-miniprogram/pages/dj-detail/dj-detail.wxml`

```xml
<image
  src="{{dj.photo_url || '/images/default-avatar.png'}}"
  mode="aspectFill"
  class="photo"
/>
```

#### 5.3 在开发者工具中调试

1. 打开微信开发者工具
2. 进入 DJ 列表或详情页
3. 打开 "调试器" → "Console"
4. 输入以下命令查看数据:

```javascript
// 在 index 页面
console.log(this.data.hotDJs)

// 在 dj-detail 页面
console.log(this.data.dj)
```

检查 photo_url 字段的值。

#### 5.4 检查网络请求

1. 在调试器中点击 "Network" 标签
2. 刷新页面
3. 查找图片请求（通常是 .jpg 或 .png 结尾）
4. 检查请求状态:
   - 200: 成功
   - 403: 权限问题（OSS 权限或域名白名单）
   - 404: 文件不存在
   - net::ERR_NAME_NOT_RESOLVED: 域名未添加到白名单

---

### 6. 常见问题和解决方案

#### 问题 1: 图片显示默认头像

**可能原因**:
- photo_url 为 null 或空字符串
- URL 格式错误

**解决方法**:
1. 检查数据库 photo_url 字段
2. 如果为空，说明上传时没有保存 URL
3. 检查 djController.js 的 createDJ 方法是否接收并保存了 photo_url

#### 问题 2: 图片加载失败（显示裂图）

**可能原因**:
- OSS bucket 不是公共读
- 域名未添加到微信白名单
- URL 格式错误

**解决方法**:
1. 设置 OSS bucket 为公共读
2. 添加 OSS 域名到微信 downloadFile 白名单
3. 验证 URL 在浏览器中能否直接访问

#### 问题 3: 开发工具能显示，真机不显示

**可能原因**:
- 开发工具中关闭了域名校验
- 真机会严格检查域名白名单

**解决方法**:
- 确保 OSS 域名已添加到微信白名单
- 等待 5-10 分钟让白名单生效
- 清除小程序缓存后重试

#### 问题 4: HTTPS 证书问题

**可能原因**:
- OSS 域名证书有问题
- 使用了自定义 CDN 域名但证书未配置

**解决方法**:
- 使用 OSS 默认域名（自带证书）
- 或者为自定义域名配置有效的 SSL 证书

---

### 7. 最终验证清单

部署和调试完成后，逐项检查：

- [ ] 数据库中 photo_url 字段格式正确，包含完整 https URL
- [ ] OSS Bucket 设置为公共读
- [ ] OSS 跨域配置已添加
- [ ] OSS 文件路径遵循新格式: `dj-photos/{label}/{name}/{date}_filename.jpg`
- [ ] 微信小程序 downloadFile 域名白名单已配置 OSS 域名
- [ ] 在浏览器中可以直接访问 photo_url
- [ ] 服务器日志显示 OSS 上传成功
- [ ] 前端页面可以正确显示上传的图片
- [ ] 真机测试图片显示正常

---

## 快速排查命令

### 检查数据库 URL
```sql
SELECT id, name, photo_url FROM djs ORDER BY id DESC LIMIT 5;
```

### 检查服务器日志
```bash
ssh root@rateyourdj.pbrick.cn
source ~/.nvm/nvm.sh && nvm use 16
pm2 logs rateyourdj-api --lines 100 | grep -i "oss\|upload\|image"
```

### 测试 URL 可访问性
```bash
# 从数据库复制 photo_url，然后测试
curl -I "https://rateyourdj.oss-cn-shanghai.aliyuncs.com/dj-photos/..."
# 期望返回: HTTP/2 200
```

### 检查 OSS 文件列表
在 OSS 控制台，或使用 ossutil:
```bash
ossutil ls oss://rateyourdj/dj-photos/ --recursive
```

---

## 联系支持

如果按照以上步骤仍然无法解决：

1. 收集以下信息：
   - 数据库中的 photo_url 示例
   - 服务器日志（上传相关部分）
   - OSS 控制台截图（文件列表、权限设置）
   - 微信开发者工具 Network 截图
   - 微信域名白名单配置截图

2. 提供问题详细描述：
   - 什么时候出现问题
   - 错误信息是什么
   - 已尝试的解决方法

---

**更新时间**: 2026-02-06
**文档版本**: 1.0
