-- 生成测试邀请码
-- 执行方式：docker exec -i rateyourdj-mysql mysql -uroot -prateyourdj123 rateyourdj < scripts/generate-invite-codes.sql

-- 生成 10 个管理员邀请码（单次使用）
INSERT INTO invite_codes (code, creator_type, usage_limit, is_active) VALUES
('UDISK-TEST01', 'admin', 1, TRUE),
('UDISK-TEST02', 'admin', 1, TRUE),
('UDISK-TEST03', 'admin', 1, TRUE),
('UDISK-TEST04', 'admin', 1, TRUE),
('UDISK-TEST05', 'admin', 1, TRUE),
('UDISK-BETA01', 'admin', 1, TRUE),
('UDISK-BETA02', 'admin', 1, TRUE),
('UDISK-BETA03', 'admin', 1, TRUE),
('UDISK-BETA04', 'admin', 1, TRUE),
('UDISK-BETA05', 'admin', 1, TRUE);

-- 生成 3 个无限使用邀请码（用于开发测试）
INSERT INTO invite_codes (code, creator_type, usage_limit, is_active) VALUES
('UDISK-UNLIMITED', 'admin', 999999, TRUE),
('UDISK-DEV', 'admin', 999999, TRUE),
('UDISK-FRIEND', 'admin', 10, TRUE);

-- 查看生成的邀请码
SELECT code, creator_type, usage_limit, used_count, is_active, created_at
FROM invite_codes
ORDER BY created_at DESC;
