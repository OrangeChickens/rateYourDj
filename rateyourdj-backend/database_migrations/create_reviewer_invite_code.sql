-- 为微信审核员生成专用邀请码
-- 此邀请码用于微信小程序审核时测试邀请码功能

-- 插入审核员邀请码（管理员类型，无使用次数限制，2026年12月31日过期）
INSERT INTO invite_codes (
  code,
  creator_type,
  created_by,
  usage_limit,
  used_count,
  is_active,
  expires_at,
  created_at
) VALUES (
  'REVIEWER2026',           -- 邀请码（简单易记）
  'admin',                  -- 管理员类型
  NULL,                     -- 无创建者（系统生成）
  999,                      -- 使用次数上限（足够多）
  0,                        -- 已使用次数
  TRUE,                     -- 激活状态
  '2026-12-31 23:59:59',   -- 过期时间
  NOW()                     -- 创建时间
)
ON DUPLICATE KEY UPDATE
  -- 如果邀请码已存在，更新其状态（重新激活）
  is_active = TRUE,
  usage_limit = 999,
  expires_at = '2026-12-31 23:59:59';

-- 验证插入结果
SELECT
  code,
  creator_type,
  usage_limit,
  used_count,
  is_active,
  expires_at,
  created_at
FROM invite_codes
WHERE code = 'REVIEWER2026';
