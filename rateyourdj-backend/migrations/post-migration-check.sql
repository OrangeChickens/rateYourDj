-- 迁移后验证脚本
-- 执行方式：mysql -h RDS_HOST -P 3306 -u root -p rateyourdj < post-migration-check.sql

SELECT '========== 验证迁移结果 ==========' as info;

-- 1. 验证 DJ 数据完整性（你的 200 个 DJ 应该一个都不少！）
SELECT '========== DJ 数据完整性 ==========' as info;
SELECT 'Total DJs' as metric, COUNT(*) as count FROM djs;
-- 应该还是 200 个！

-- 2. 验证 users 表新增字段
SELECT '========== Users 新增字段 ==========' as info;
SELECT
    column_name,
    column_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND table_name = 'users'
  AND column_name IN ('access_level', 'invite_quota', 'invites_sent', 'invited_by', 'waitlist_position')
ORDER BY ordinal_position;

-- 3. 验证现有用户都是 full 访问权限
SELECT '========== Users 访问级别分布 ==========' as info;
SELECT
    access_level,
    COUNT(*) as user_count
FROM users
GROUP BY access_level;
-- 应该所有用户都是 'full'

-- 4. 验证新表创建成功
SELECT '========== 新表创建验证 ==========' as info;
SELECT
    CASE WHEN COUNT(*) = 4 THEN '✅ 所有新表创建成功'
         ELSE '⚠️  部分表未创建' END as status,
    GROUP_CONCAT(table_name) as created_tables
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND table_name IN ('task_configs', 'user_tasks', 'invite_codes', 'waitlist');

-- 5. 验证任务配置插入成功
SELECT '========== 任务配置验证 ==========' as info;
SELECT 'Total Tasks' as metric, COUNT(*) as count FROM task_configs;
-- 应该是 9 个任务

SELECT task_code, task_name, task_category, reward_invites, repeatable
FROM task_configs
ORDER BY sort_order;

-- 6. 验证 reviews 数据完整性
SELECT '========== Reviews 数据完整性 ==========' as info;
SELECT 'Total Reviews' as metric, COUNT(*) as count FROM reviews;

-- 7. 验证 favorites 数据完整性
SELECT '========== Favorites 数据完整性 ==========' as info;
SELECT 'Total Favorites' as metric, COUNT(*) as count FROM favorites;

-- 8. 验证外键约束
SELECT '========== 外键约束验证 ==========' as info;
SELECT
    table_name,
    constraint_name,
    referenced_table_name
FROM information_schema.key_column_usage
WHERE table_schema = DATABASE()
  AND table_name IN ('user_tasks', 'invite_codes', 'waitlist')
  AND referenced_table_name IS NOT NULL;

SELECT '========== 验证完成 ==========' as info;
SELECT '✅ 如果以上所有检查都通过，迁移成功！' as result;
SELECT '✅ 你的 200 个 DJ 数据应该完好无损！' as result;
