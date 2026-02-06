# 下一步操作指南

## 当前状态

✅ **已完成**:
- OSS 路径优化代码已完成（包含 DJ 名字和厂牌信息）
- 前端上传逻辑已更新（传递 DJ 元数据）
- 后端上传逻辑已更新（接收并使用 DJ 元数据构建路径）
- 代码已提交到 feature/dj-upload 分支

⚠️ **待解决**:
- OSS 图片已上传，但前端不显示
- 需要部署最新代码到服务器
- 需要调试图片显示问题

## 操作步骤

### 步骤 1: 部署最新代码到服务器

运行部署脚本：

```bash
cd /Users/yichengliang/Desktop/ws/rateyourdj
./deploy-oss-changes.sh
```

这个脚本会：
- 上传修改的后端文件（oss.js, uploadController.js, djController.js）
- 重启 PM2 应用
- 显示最新日志

**预计时间**: 2-3 分钟

---

### 步骤 2: 验证 OSS 配置

连接到服务器并验证 OSS 环境变量：

```bash
# SSH 到服务器
ssh root@rateyourdj.pbrick.cn

# 加载 Node 环境
source ~/.nvm/nvm.sh
nvm use 16

# 进入后端目录
cd /var/www/rateYourDj/rateyourdj-backend

# 运行配置验证脚本（需要先上传这个脚本）
node verify-oss-config.js
```

如果需要上传验证脚本：

```bash
# 在本地运行
scp verify-oss-config.js root@rateyourdj.pbrick.cn:/var/www/rateYourDj/rateyourdj-backend/
scp test-oss-upload.js root@rateyourdj.pbrick.cn:/var/www/rateYourDj/rateyourdj-backend/
```

**预计时间**: 2 分钟

---

### 步骤 3: 测试 OSS 上传功能

在服务器上运行 OSS 上传测试：

```bash
# 在服务器上
cd /var/www/rateYourDj/rateyourdj-backend
node test-oss-upload.js
```

如果测试成功，会看到：
```
✅ OSS 上传测试全部通过！
```

如果测试失败，会显示具体错误信息。

**预计时间**: 1 分钟

---

### 步骤 4: 检查数据库中的图片 URL

查询数据库，确认已上传的 DJ 图片 URL 格式：

```bash
# 在本地或服务器上连接数据库
mysql -h <RDS_HOST> -u <RDS_USER> -p rateyourdj

# 运行查询
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

**检查点**:
- photo_url 是否为 null？
- URL 是否完整（包含 https://）？
- URL 格式是否正确？

**示例正确格式**:
```
https://rateyourdj.oss-cn-shanghai.aliyuncs.com/dj-photos/independent/DJ_Name/2026-02-06_photo.jpg
```

**预计时间**: 1 分钟

---

### 步骤 5: 配置微信小程序域名白名单

#### 5.1 确定 OSS 域名

从数据库 photo_url 中提取域名，例如：
- `rateyourdj.oss-cn-shanghai.aliyuncs.com`

#### 5.2 添加到微信白名单

1. 登录微信公众平台: https://mp.weixin.qq.com/
2. 进入 **开发** → **开发管理** → **开发设置**
3. 找到 **服务器域名**
4. 在 **downloadFile 合法域名** 中添加:

   ```
   https://rateyourdj.oss-cn-shanghai.aliyuncs.com
   ```

   **注意**:
   - 必须是 https://
   - 不要包含路径，只填域名
   - 每月只能修改 5 次

5. 点击保存
6. **等待 5-10 分钟生效**

**预计时间**: 5 分钟 + 等待生效时间

---

### 步骤 6: 配置 OSS Bucket 权限

#### 6.1 登录阿里云 OSS 控制台

访问: https://oss.console.aliyun.com/

#### 6.2 设置 Bucket 为公共读

1. 选择 Bucket: `rateyourdj`（或你的实际 bucket 名称）
2. 进入 **权限管理** → **读写权限**
3. 设置为 **公共读**（Public Read）

#### 6.3 配置跨域规则 (CORS)

1. 进入 **权限管理** → **跨域设置**
2. 点击 **创建规则**
3. 填写：
   - 来源: `*`
   - 允许 Methods: `GET, HEAD`
   - 允许 Headers: `*`
   - 暴露 Headers: `ETag`
   - 缓存时间: `0`
4. 保存

**预计时间**: 5 分钟

---

### 步骤 7: 测试新上传流程

#### 7.1 在微信开发者工具中打开小程序

```bash
# 小程序路径
/Users/yichengliang/Desktop/ws/rateyourdj/rateyourdj-miniprogram
```

#### 7.2 临时关闭域名校验（测试用）

在开发者工具中：
- 点击右上角 **详情**
- 勾选 **不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书**

#### 7.3 测试上传流程

1. 登录小程序（确保是 admin 账号）
2. 进入 **设置** 页面
3. 检查角色显示是否为 `admin`
4. 点击 **上传DJ资料**
5. 填写信息：
   - 名称: `TestDJ_$(date +%s)`（用时间戳避免重复）
   - 城市: `上海`
   - 厂牌: `TestLabel`
   - 音乐风格: `House,Techno`
6. 选择图片并上传
7. 点击提交

#### 7.4 查看服务器日志

```bash
# 在服务器上
ssh root@rateyourdj.pbrick.cn
source ~/.nvm/nvm.sh && nvm use 16
pm2 logs rateyourdj-api --lines 50
```

**期望看到**:
```
📤 开始上传图片:
  - DJ名字: TestDJ_xxx
  - DJ厂牌: TestLabel
🚀 使用阿里云OSS上传...
📂 OSS路径: dj-photos/TestLabel/TestDJ_xxx/2026-02-06_xxx.jpg
✅ OSS上传成功
🎵 创建DJ请求:
  - 照片URL: https://...
✅ DJ创建成功: 123
```

#### 7.5 验证 OSS 文件

登录 OSS 控制台，查看文件列表：
- 路径: `dj-photos/TestLabel/TestDJ_xxx/`
- 应该能看到上传的图片

点击文件，复制 URL，在浏览器中直接访问，确认能显示图片。

#### 7.6 验证前端显示

1. 在小程序首页刷新
2. 找到刚上传的 DJ
3. 检查是否显示图片（不是默认头像）
4. 点击进入详情页
5. 检查详情页是否显示大图

**预计时间**: 10 分钟

---

### 步骤 8: 真机测试（可选）

如果开发工具中图片显示正常，进行真机测试：

1. 在开发者工具中点击 **预览**
2. 用微信扫描二维码
3. 在真机上测试图片显示

**注意**: 真机会严格检查域名白名单，所以步骤 5 必须完成。

---

## 故障排查

如果遇到问题，参考详细调试指南：

```bash
cat DEBUG_IMAGE_DISPLAY.md
```

或者运行快速诊断：

```bash
# 检查数据库
mysql -h <RDS_HOST> -u <USER> -p rateyourdj < check-dj-photos.sql

# 检查服务器日志
ssh root@rateyourdj.pbrick.cn
pm2 logs rateyourdj-api --lines 100 | grep -i "oss\|upload"

# 测试 URL 可访问性
curl -I "https://rateyourdj.oss-cn-shanghai.aliyuncs.com/dj-photos/..."
```

---

## 常见问题

### Q1: 图片显示默认头像
**A**: photo_url 为空或 null，检查上传流程和数据库保存逻辑

### Q2: 图片加载失败（裂图）
**A**: OSS 权限问题或域名白名单未配置

### Q3: 开发工具能显示，真机不显示
**A**: 微信域名白名单未生效，需要等待或重新配置

### Q4: OSS 上传失败
**A**: 检查 .env 中的 OSS 配置，运行 `node verify-oss-config.js`

---

## 完成后检查清单

- [ ] 服务器代码已更新
- [ ] PM2 应用已重启
- [ ] OSS 配置验证通过
- [ ] OSS 上传测试成功
- [ ] 数据库 photo_url 格式正确
- [ ] OSS Bucket 设置为公共读
- [ ] OSS 跨域配置已添加
- [ ] 微信 downloadFile 域名白名单已配置
- [ ] 新上传的 DJ 图片能正常显示
- [ ] 真机测试通过

---

## 相关文档

- **详细调试指南**: `DEBUG_IMAGE_DISPLAY.md`
- **部署脚本**: `deploy-oss-changes.sh`
- **OSS 配置验证**: `verify-oss-config.js`
- **OSS 上传测试**: `test-oss-upload.js`
- **数据库查询**: `check-dj-photos.sql`

---

**更新时间**: 2026-02-06
**估计总耗时**: 30-40 分钟（不包括白名单生效等待时间）
