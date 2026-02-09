-- ===================================================================
-- check-invite-status.sql - 快速检查邀请码状态
-- ===================================================================

-- 1. 检查 REVIEWER2026 邀请码当前状态
SELECT
  code,
  used_count,
  usage_limit,
  is_active,
  expires_at,
  creator_type,
  created_at
FROM invite_codes
WHERE code = 'REVIEWER2026';

-- 2. 查看使用了 REVIEWER2026 的所有用户
SELECT
  id,
  nickname,
  access_level,
  invite_code_used,
  access_granted_at,
  created_at
FROM users
WHERE invite_code_used = 'REVIEWER2026';

-- 3. 查看最近创建的 waitlist 用户（可能是测试用户）
SELECT
  id,
  nickname,
  access_level,
  invite_code_used,
  created_at
FROM users
WHERE access_level = 'waitlist'
ORDER BY created_at DESC
LIMIT 5;

-- 4. 查看最近升级为 full 的用户
SELECT
  id,
  nickname,
  access_level,
  invite_code_used,
  access_granted_at
FROM users
WHERE access_level = 'full'
ORDER BY access_granted_at DESC
LIMIT 5;
