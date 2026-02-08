-- 简化版回滚脚本 - 删除所有新增内容
-- 注意：此脚本会忽略"不存在"的错误

-- 1. 删除新创建的表
DROP TABLE IF EXISTS user_tasks;
DROP TABLE IF EXISTS task_configs;
DROP TABLE IF EXISTS invite_codes;
DROP TABLE IF EXISTS waitlist;

-- 2. 尝试删除 users 表的索引（忽略错误）
-- 注意：如果索引不存在会报错，但不影响继续执行
SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0;

-- 尝试删除索引（每个都单独执行）
-- idx_access_level
SET @s = (SELECT IF(
    EXISTS(SELECT 1 FROM information_schema.statistics
           WHERE table_schema = DATABASE()
           AND table_name = 'users'
           AND index_name = 'idx_access_level'),
    'ALTER TABLE users DROP INDEX idx_access_level',
    'SELECT 1'
));
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- idx_waitlist_position
SET @s = (SELECT IF(
    EXISTS(SELECT 1 FROM information_schema.statistics
           WHERE table_schema = DATABASE()
           AND table_name = 'users'
           AND index_name = 'idx_waitlist_position'),
    'ALTER TABLE users DROP INDEX idx_waitlist_position',
    'SELECT 1'
));
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- idx_invited_by
SET @s = (SELECT IF(
    EXISTS(SELECT 1 FROM information_schema.statistics
           WHERE table_schema = DATABASE()
           AND table_name = 'users'
           AND index_name = 'idx_invited_by'),
    'ALTER TABLE users DROP INDEX idx_invited_by',
    'SELECT 1'
));
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. 尝试删除 users 表的列（如果存在）
-- access_level
SET @s = (SELECT IF(
    EXISTS(SELECT 1 FROM information_schema.columns
           WHERE table_schema = DATABASE()
           AND table_name = 'users'
           AND column_name = 'access_level'),
    'ALTER TABLE users DROP COLUMN access_level',
    'SELECT 1'
));
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- invite_quota
SET @s = (SELECT IF(
    EXISTS(SELECT 1 FROM information_schema.columns
           WHERE table_schema = DATABASE()
           AND table_name = 'users'
           AND column_name = 'invite_quota'),
    'ALTER TABLE users DROP COLUMN invite_quota',
    'SELECT 1'
));
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- invites_sent
SET @s = (SELECT IF(
    EXISTS(SELECT 1 FROM information_schema.columns
           WHERE table_schema = DATABASE()
           AND table_name = 'users'
           AND column_name = 'invites_sent'),
    'ALTER TABLE users DROP COLUMN invites_sent',
    'SELECT 1'
));
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- invites_accepted
SET @s = (SELECT IF(
    EXISTS(SELECT 1 FROM information_schema.columns
           WHERE table_schema = DATABASE()
           AND table_name = 'users'
           AND column_name = 'invites_accepted'),
    'ALTER TABLE users DROP COLUMN invites_accepted',
    'SELECT 1'
));
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- invited_by
SET @s = (SELECT IF(
    EXISTS(SELECT 1 FROM information_schema.columns
           WHERE table_schema = DATABASE()
           AND table_name = 'users'
           AND column_name = 'invited_by'),
    'ALTER TABLE users DROP COLUMN invited_by',
    'SELECT 1'
));
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- invite_code_used
SET @s = (SELECT IF(
    EXISTS(SELECT 1 FROM information_schema.columns
           WHERE table_schema = DATABASE()
           AND table_name = 'users'
           AND column_name = 'invite_code_used'),
    'ALTER TABLE users DROP COLUMN invite_code_used',
    'SELECT 1'
));
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- waitlist_position
SET @s = (SELECT IF(
    EXISTS(SELECT 1 FROM information_schema.columns
           WHERE table_schema = DATABASE()
           AND table_name = 'users'
           AND column_name = 'waitlist_position'),
    'ALTER TABLE users DROP COLUMN waitlist_position',
    'SELECT 1'
));
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- waitlist_joined_at
SET @s = (SELECT IF(
    EXISTS(SELECT 1 FROM information_schema.columns
           WHERE table_schema = DATABASE()
           AND table_name = 'users'
           AND column_name = 'waitlist_joined_at'),
    'ALTER TABLE users DROP COLUMN waitlist_joined_at',
    'SELECT 1'
));
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- access_granted_at
SET @s = (SELECT IF(
    EXISTS(SELECT 1 FROM information_schema.columns
           WHERE table_schema = DATABASE()
           AND table_name = 'users'
           AND column_name = 'access_granted_at'),
    'ALTER TABLE users DROP COLUMN access_granted_at',
    'SELECT 1'
));
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET SQL_NOTES=@OLD_SQL_NOTES;

SELECT '✅ 回滚完成，数据库已恢复到迁移前状态' as result;
