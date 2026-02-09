# 邀请码 used_count 不增加问题诊断

## 问题描述
用户验证邀请码成功，登录也成功，但数据库中邀请码的 `used_count` 没有增加。

## 诊断步骤

### 步骤 1: 运行诊断脚本

```bash
cd rateyourdj-backend
node diagnose-user.js
```

这会检查：
- REVIEWER2026 邀请码的当前状态
- 最近登录/创建的用户
- 使用了该邀请码的用户
- 数据一致性

### 步骤 2: 检查后端日志

**重启后端服务**（确保加载了最新代码）：
```bash
cd rateyourdj-backend
npm run dev
```

**重新执行登录流程**，然后在后端控制台查找这些关键输出：

#### 2.1 查找邀请码激活检查日志
```
========== 邀请码激活检查 ==========
inviteCode: REVIEWER2026
isNewUser: true/false
user.id: xxx
user.access_level: waitlist/full
user.invite_code_used: (无)
条件1 (inviteCode): true/false
条件2 (isNewUser || access_level=waitlist): true/false
=====================================
```

#### 2.2 根据输出判断问题

**情况 A: 没有这段日志**
→ 问题在前端，邀请码没有传递给后端
→ 检查：`pendingInviteCode` 是否存在于 wx.storage

**情况 B: 有日志，但条件1 或条件2 为 false**
→ 条件检查失败，邀请码激活代码没执行
→ 看下面的"条件检查失败分析"

**情况 C: 有日志，条件都为 true，但看到 "⏭️ 跳过邀请码激活"**
→ 不应该出现，代码逻辑错误

**情况 D: 有日志，看到 "🎫 用户 xxx 使用邀请码登录"**
→ 进入了使用分支，继续看是否有 "✅ 邀请码激活成功" 或 "❌ 邀请码激活失败"

**情况 E: 看到 "❌ 邀请码激活失败！"**
→ `InviteCode.use()` 抛出异常
→ 查看错误信息和堆栈

### 步骤 3: 条件检查失败分析

如果条件1 (inviteCode) 为 false：
```javascript
// 前端没有传递 inviteCode
// 检查 login.js 第 250-254 行
const pendingInviteCode = wx.getStorageSync('pendingInviteCode');
if (pendingInviteCode) {
  loginData.inviteCode = pendingInviteCode;
  console.log('🎫 携带邀请码登录:', pendingInviteCode);
}
```
→ 在小程序端添加 console.log 检查 `pendingInviteCode` 是否存在

如果条件2 (isNewUser || access_level=waitlist) 为 false：
```javascript
// 用户不是新用户，且 access_level 不是 waitlist
// 可能已经是 full access 用户了
```
→ 检查用户的 `access_level` 字段

### 步骤 4: 事务回滚检查

如果看到 "✅ 邀请码激活成功" 但 used_count 仍然是 0：

可能是事务在更外层回滚了。检查：
1. `wechatLogin` 函数是否有 try-catch 包裹所有逻辑
2. 是否在 `InviteCode.use()` 之后有其他操作失败导致整体回滚

## 临时解决方案（手动修复）

如果需要立即让用户获得 full access：

```sql
-- 1. 手动增加 used_count
UPDATE invite_codes SET used_count = used_count + 1 WHERE code = 'REVIEWER2026';

-- 2. 手动升级用户（替换 USER_ID）
UPDATE users
SET
  access_level = 'full',
  invite_code_used = 'REVIEWER2026',
  access_granted_at = NOW()
WHERE id = USER_ID;
```

## 常见问题排查

### Q1: 邀请码在 waitlist 页面验证成功，但登录时没有传递给后端

**原因**: `pendingInviteCode` 在 storage 中丢失

**检查**:
1. waitlist.js 第 49 行是否执行：`wx.setStorageSync('pendingInviteCode', inviteCode);`
2. login.js 第 250 行读取时是否存在

**调试**:
```javascript
// 在 login.js handleLogin() 函数开头添加：
console.log('Storage 中的 pendingInviteCode:', wx.getStorageSync('pendingInviteCode'));
```

### Q2: 用户已经使用过邀请码

**现象**: 后端日志显示 "⚠️ 用户 xxx 已使用过邀请码: XXX，跳过激活"

**原因**: 该用户之前已经成功使用过邀请码

**解决**: 这是正常行为，一个用户只能使用一次邀请码

### Q3: InviteCode.use() 抛出异常

**常见异常**:
- "邀请码不存在或已禁用" → 数据库中没有该邀请码或 is_active = FALSE
- "邀请码已过期" → expires_at 小于当前时间
- "邀请码已达使用上限" → used_count >= usage_limit
- "用户已使用过邀请码: XXX" → 用户的 invite_code_used 字段已有值

**解决**: 根据具体错误信息修复数据或逻辑

## 代码流程图

```
用户在 waitlist 页面输入 REVIEWER2026
         ↓
调用 verifyInviteCode API (只验证，不增加 used_count)
         ↓
验证成功，保存到 wx.setStorageSync('pendingInviteCode', 'REVIEWER2026')
         ↓
跳转到首页/登录页
         ↓
用户点击登录
         ↓
login.js 读取 wx.getStorageSync('pendingInviteCode')
         ↓
发送到后端: { code, userInfo, inviteCode: 'REVIEWER2026' }
         ↓
authController.wechatLogin 收到请求
         ↓
获取 openid，查找或创建用户
         ↓
检查条件: inviteCode && (isNewUser || access_level='waitlist')
         ↓
         ├─ 条件为 false → 跳过激活
         └─ 条件为 true → 调用 InviteCode.use(code, userId)
                              ↓
                         开始事务
                              ↓
                         查询邀请码 (FOR UPDATE 锁行)
                              ↓
                         验证有效性
                              ↓
                         检查用户是否已使用过
                              ↓
                         UPDATE invite_codes SET used_count = used_count + 1
                              ↓
                         UPDATE users SET access_level='full', invite_code_used=...
                              ↓
                         提交事务 ✅
                              ↓
                         返回登录成功
```

## 下一步行动

根据诊断脚本和后端日志的输出，确定具体是哪个环节出了问题，然后对症下药。

如果仍然无法解决，请提供：
1. `node diagnose-user.js` 的完整输出
2. 后端日志中 "========== 邀请码激活检查 ==========" 部分的完整输出
3. 小程序端 console.log 中关于 pendingInviteCode 的输出
