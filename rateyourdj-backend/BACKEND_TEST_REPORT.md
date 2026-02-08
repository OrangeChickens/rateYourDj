# 后端测试报告 - Waitlist & 任务系统

## ✅ 数据库迁移测试结果

### 1. 表结构创建
- ✅ `task_configs` - 任务配置表
- ✅ `user_tasks` - 用户任务表
- ✅ `invite_codes` - 邀请码表
- ✅ `waitlist` - 等待列表追踪表

### 2. Users 表字段添加
- ✅ `access_level` ENUM('waitlist', 'full')
- ✅ `invite_quota` INT - 邀请码额度
- ✅ `invites_sent` INT - 已发出邀请数
- ✅ `invites_accepted` INT - 成功邀请数
- ✅ `invited_by` INT - 邀请人 ID
- ✅ `invite_code_used` VARCHAR(32) - 使用的邀请码
- ✅ `waitlist_position` INT - 排队位置
- ✅ `waitlist_joined_at` TIMESTAMP
- ✅ `access_granted_at` TIMESTAMP

### 3. 任务配置数据插入
```
任务代码            任务名称        分类       目标  奖励  可重复  最大次数
--------------------------------------------------------------------------------
first_review       首次评价        beginner    1     1     否      1
reviews_3          活跃评价        beginner    3     1     否      1
favorite_5         收藏专家        beginner    5     1     否      1
quality_review     优质评价        advanced    1     2     否      1
helpful_received_5 有用评价        advanced    5     3     否      1
reviews_10         评价达人        advanced   10     3     否      1
share_review       分享评价        advanced    1     1     是      5
invite_active_user 邀请活跃用户    vip         1     1     是     10
helpful_received_20 超赞评价       vip        20     3     否      1
```

**总计**: 9 个任务
- 新手任务: 3 个（总奖励 3 个邀请码）
- 进阶任务: 4 个（总奖励 9 个邀请码 + 可重复 5 次分享）
- VIP 任务: 2 个（总奖励 4 个邀请码 + 可重复 10 次邀请）

### 4. 测试邀请码生成
已生成 13 个测试邀请码：

**单次使用邀请码** (10 个):
- UDISK-TEST01
- UDISK-TEST02
- UDISK-TEST03
- UDISK-TEST04
- UDISK-TEST05
- UDISK-BETA01
- UDISK-BETA02
- UDISK-BETA03
- UDISK-BETA04
- UDISK-BETA05

**无限使用邀请码** (2 个):
- UDISK-UNLIMITED (999999 次)
- UDISK-DEV (999999 次)

**多次使用邀请码** (1 个):
- UDISK-FRIEND (10 次)

### 5. 现有用户升级
- ✅ 所有现有用户已自动升级为 `access_level = 'full'`
- ✅ 默认 `invite_quota = 0`

---

## 📋 API 测试清单

### 测试环境
- Backend URL: `http://localhost:3000`
- 数据库: rateyourdj (MySQL 8.0 in Docker)

### 需要测试的 API 端点

#### 1. 认证相关

**POST /api/auth/login**
- 测试微信登录（新用户应为 waitlist）
- 测试现有用户登录（应为 full）

**POST /api/auth/use-invite-code**
```bash
curl -X POST http://localhost:3000/api/auth/use-invite-code \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"code": "UDISK-TEST01"}'
```

**GET /api/auth/check-access**
```bash
curl http://localhost:3000/api/auth/check-access \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 2. Waitlist 相关

**GET /api/user/waitlist-status**
```bash
curl http://localhost:3000/api/user/waitlist-status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 3. 任务系统

**GET /api/tasks/list**
```bash
curl http://localhost:3000/api/tasks/list \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**POST /api/tasks/claim**
```bash
curl -X POST http://localhost:3000/api/tasks/claim \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"taskCode": "first_review"}'
```

**GET /api/tasks/stats**
```bash
curl http://localhost:3000/api/tasks/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 4. 邀请码系统

**POST /api/invite/generate**
```bash
curl -X POST http://localhost:3000/api/invite/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**GET /api/invite/my-codes**
```bash
curl http://localhost:3000/api/invite/my-codes \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**POST /api/invite/validate**
```bash
curl -X POST http://localhost:3000/api/invite/validate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"code": "UDISK-TEST01"}'
```

---

## 🧪 完整测试流程

### 场景 1: 新用户 Waitlist 流程

1. **用户微信登录（新用户）**
   - 调用 `POST /api/auth/login`
   - 用户应被创建为 `access_level = 'waitlist'`
   - 应分配 `waitlist_position`

2. **查看 Waitlist 状态**
   - 调用 `GET /api/user/waitlist-status`
   - 应返回排队位置和总人数

3. **输入邀请码**
   - 调用 `POST /api/auth/use-invite-code` with `UDISK-TEST01`
   - 用户应升级为 `access_level = 'full'`
   - 应初始化用户任务（9 个任务）

4. **查看任务列表**
   - 调用 `GET /api/tasks/list`
   - 应返回 9 个任务，全部 `progress = 0`

### 场景 2: 完成任务获得邀请码

1. **模拟完成首次评价**
   - 创建一条评价（通过现有评价 API）
   - 任务系统应自动更新 `first_review` 进度

2. **领取奖励**
   - 调用 `POST /api/tasks/claim` with `taskCode: "first_review"`
   - 用户 `invite_quota` 应增加 1

3. **生成邀请码**
   - 调用 `POST /api/invite/generate`
   - 应返回新的邀请码（格式：UDISK-XXXXXX）

4. **查看我的邀请码**
   - 调用 `GET /api/invite/my-codes`
   - 应显示刚生成的邀请码

### 场景 3: 邀请好友

1. **用户 A 生成邀请码**
   - 用户 A 调用 `POST /api/invite/generate`
   - 获得邀请码 `CODE-ABC`

2. **用户 B 使用邀请码**
   - 用户 B 登录（新用户，waitlist）
   - 用户 B 调用 `POST /api/auth/use-invite-code` with `CODE-ABC`
   - 用户 B 升级为 full access
   - 用户 A 的 `invites_accepted` 应 +1

3. **用户 B 完成首次评价**
   - 用户 B 创建评价
   - 用户 A 的 `invite_active_user` 任务进度应 +1

---

## ⚠️ 注意事项

### 已知问题
1. **任务触发器未集成** - 需要在现有 reviewController, userController 中添加任务触发逻辑
2. **前端未实现** - Waitlist 页面、任务中心、邀请码管理页面

### 下一步

#### 后端
1. 在 `reviewController.createReview` 中集成任务触发
2. 在 `userController.toggleFavorite` 中集成任务触发
3. 添加分享统计（需要前端配合）

#### 前端
1. 实现 Waitlist 页面
2. 实现任务中心页面
3. 实现我的邀请码页面
4. 在 app.js 中添加访问控制拦截

---

## 📊 数据验证查询

```sql
-- 查看所有任务配置
SELECT * FROM task_configs WHERE is_active = TRUE ORDER BY task_category, sort_order;

-- 查看所有邀请码
SELECT * FROM invite_codes ORDER BY created_at DESC;

-- 查看用户访问级别分布
SELECT access_level, COUNT(*) as count FROM users GROUP BY access_level;

-- 查看某个用户的任务进度
SELECT ut.*, tc.task_name
FROM user_tasks ut
JOIN task_configs tc ON ut.task_code = tc.task_code
WHERE ut.user_id = 1;

-- 查看邀请关系
SELECT
  u1.nickname as inviter,
  u2.nickname as invitee,
  u2.invite_code_used as code,
  u2.access_granted_at
FROM users u2
LEFT JOIN users u1 ON u2.invited_by = u1.id
WHERE u2.invited_by IS NOT NULL;
```

---

## 📝 测试日志

**日期**: 2026-02-08
**测试人**: Claude
**状态**: ✅ 数据库迁移成功，等待前端联调测试

### 已完成
- ✅ 数据库迁移脚本执行
- ✅ 表结构验证
- ✅ 任务配置数据插入
- ✅ 测试邀请码生成
- ✅ 现有用户升级
- ✅ 后端服务启动

### 待测试
- ⏳ 完整 API 流程测试（需要真实 token）
- ⏳ 任务触发器集成测试
- ⏳ 邀请关系测试
- ⏳ 前端集成测试
