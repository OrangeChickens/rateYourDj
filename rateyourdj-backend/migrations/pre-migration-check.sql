-- 迁移前检查脚本
-- 执行方式：mysql -h RDS_HOST -P 3306 -u root -p rateyourdj < pre-migration-check.sql

SELECT '========== 当前数据库状态 ==========' as info;

-- 检查现有表数量
SELECT 'Tables Count' as metric, COUNT(*) as value
FROM information_schema.tables
WHERE table_schema = DATABASE();

-- 检查各表的数据量
SELECT '========== 各表数据量 ==========' as info;
SELECT
    table_name,
    table_rows as row_count,
    ROUND((data_length + index_length) / 1024 / 1024, 2) as size_mb
FROM information_schema.tables
WHERE table_schema = DATABASE()
ORDER BY table_rows DESC;

-- 检查 DJ 数量（你的 200 个 DJ）
SELECT '========== DJ 数据 ==========' as info;
SELECT 'Total DJs' as metric, COUNT(*) as count FROM djs;
SELECT 'Sample DJs' as metric, name, city FROM djs LIMIT 5;

-- 检查用户数量
SELECT '========== Users 数据 ==========' as info;
SELECT 'Total Users' as metric, COUNT(*) as count FROM users;

-- 检查评价数量
SELECT '========== Reviews 数据 ==========' as info;
SELECT 'Total Reviews' as metric, COUNT(*) as count FROM reviews;

-- 检查收藏数量
SELECT '========== Favorites 数据 ==========' as info;
SELECT 'Total Favorites' as metric, COUNT(*) as count FROM favorites;

-- 检查是否已经执行过迁移
SELECT '========== 迁移状态检查 ==========' as info;
SELECT
    CASE
        WHEN COUNT(*) > 0 THEN '⚠️  警告：access_level 字段已存在，可能已执行过迁移'
        ELSE '✅ 安全：可以执行迁移'
    END as migration_status
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND table_name = 'users'
  AND column_name = 'access_level';

SELECT
    CASE
        WHEN COUNT(*) > 0 THEN '⚠️  警告：task_configs 表已存在，可能已执行过迁移'
        ELSE '✅ 安全：可以执行迁移'
    END as migration_status
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND table_name = 'task_configs';

SELECT '========== 检查完成 ==========' as info;
