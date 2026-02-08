-- 回滚部分执行的迁移
-- 如果迁移失败了，使用此脚本清理已创建的部分

-- 删除可能已创建的表（按依赖顺序）
DROP TABLE IF EXISTS user_tasks;
DROP TABLE IF EXISTS task_configs;
DROP TABLE IF EXISTS invite_codes;
DROP TABLE IF EXISTS waitlist;

-- 删除 users 表的索引（如果存在）
ALTER TABLE users DROP INDEX IF EXISTS idx_access_level;
ALTER TABLE users DROP INDEX IF EXISTS idx_waitlist_position;
ALTER TABLE users DROP INDEX IF EXISTS idx_invited_by;

-- 删除 users 表的新增列（逐个删除，忽略错误）
SET @drop_access_level = IF(
    EXISTS(SELECT * FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'access_level'),
    'ALTER TABLE users DROP COLUMN access_level',
    'SELECT "access_level column does not exist"'
);
PREPARE stmt FROM @drop_access_level;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @drop_invite_quota = IF(
    EXISTS(SELECT * FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'invite_quota'),
    'ALTER TABLE users DROP COLUMN invite_quota',
    'SELECT "invite_quota column does not exist"'
);
PREPARE stmt FROM @drop_invite_quota;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @drop_invites_sent = IF(
    EXISTS(SELECT * FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'invites_sent'),
    'ALTER TABLE users DROP COLUMN invites_sent',
    'SELECT "invites_sent column does not exist"'
);
PREPARE stmt FROM @drop_invites_sent;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @drop_invites_accepted = IF(
    EXISTS(SELECT * FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'invites_accepted'),
    'ALTER TABLE users DROP COLUMN invites_accepted',
    'SELECT "invites_accepted column does not exist"'
);
PREPARE stmt FROM @drop_invites_accepted;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @drop_invited_by = IF(
    EXISTS(SELECT * FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'invited_by'),
    'ALTER TABLE users DROP COLUMN invited_by',
    'SELECT "invited_by column does not exist"'
);
PREPARE stmt FROM @drop_invited_by;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @drop_invite_code_used = IF(
    EXISTS(SELECT * FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'invite_code_used'),
    'ALTER TABLE users DROP COLUMN invite_code_used',
    'SELECT "invite_code_used column does not exist"'
);
PREPARE stmt FROM @drop_invite_code_used;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @drop_waitlist_position = IF(
    EXISTS(SELECT * FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'waitlist_position'),
    'ALTER TABLE users DROP COLUMN waitlist_position',
    'SELECT "waitlist_position column does not exist"'
);
PREPARE stmt FROM @drop_waitlist_position;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @drop_waitlist_joined_at = IF(
    EXISTS(SELECT * FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'waitlist_joined_at'),
    'ALTER TABLE users DROP COLUMN waitlist_joined_at',
    'SELECT "waitlist_joined_at column does not exist"'
);
PREPARE stmt FROM @drop_waitlist_joined_at;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @drop_access_granted_at = IF(
    EXISTS(SELECT * FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'access_granted_at'),
    'ALTER TABLE users DROP COLUMN access_granted_at',
    'SELECT "access_granted_at column does not exist"'
);
PREPARE stmt FROM @drop_access_granted_at;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT '✅ 回滚完成，可以重新执行迁移了' as status;
