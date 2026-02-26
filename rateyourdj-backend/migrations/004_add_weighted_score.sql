-- ===================================================================
-- Bayesian Average weighted_score 迁移脚本
-- 创建时间: 2026-02-26
-- 说明: 为 djs 表添加 weighted_score 列，用于按贝叶斯平均排序
-- ===================================================================

-- 开始事务
START TRANSACTION;

-- 1. 添加 weighted_score 列
ALTER TABLE djs ADD COLUMN weighted_score DECIMAL(4,2) DEFAULT 0 AFTER would_choose_again_percent;

-- 2. 添加索引（用于排序查询）
ALTER TABLE djs ADD INDEX idx_weighted_score (weighted_score);

-- 3. 验证
SELECT 'weighted_score column added:' as info;
DESCRIBE djs weighted_score;

-- 提交事务
COMMIT;

-- ===================================================================
-- 执行后验证
-- ===================================================================
-- SELECT name, overall_rating, review_count, weighted_score FROM djs LIMIT 5;

-- ===================================================================
-- 回滚脚本（如需回滚，执行以下命令）
-- ===================================================================
-- ALTER TABLE djs DROP INDEX idx_weighted_score;
-- ALTER TABLE djs DROP COLUMN weighted_score;
