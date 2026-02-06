-- ===================================================================
-- 标签精简迁移脚本
-- 创建时间: 2026-02-06
-- 说明: 精简表现力和性格标签，每类从10个减少到5个（2正面+1中性+2负面）
-- ===================================================================

-- 开始事务
START TRANSACTION;

-- 1. 备份现有标签数据（可选，用于回滚）
-- CREATE TABLE IF NOT EXISTS preset_tags_backup_20260206 AS SELECT * FROM preset_tags WHERE category IN ('performance', 'personality');

-- 2. 记录需要删除的标签ID（用于清理 review_tags 中的关联数据）
-- 注意：如果已有用户评论使用了这些标签，需要决定是否保留关联数据
-- 当前策略：删除标签但保留 review_tags 中的关联（历史评论标签保持不变）

-- 3. 删除所有现有的表现力和性格标签
DELETE FROM preset_tags WHERE category IN ('performance', 'personality');

-- 4. 插入新的精简标签

-- 表现力标签（5个：2正面+1中性+2负面）
INSERT INTO preset_tags (category, tag_name, tag_name_en) VALUES
('performance', '技术精湛', 'Technically Skilled'),
('performance', '控场能力强', 'Great Crowd Control'),
('performance', '稳定发挥', 'Consistent Performance'),
('performance', '失误较多', 'Frequent Mistakes'),
('performance', '气氛平淡', 'Lackluster Atmosphere');

-- 性格标签（5个：2正面+1中性+2负面）
INSERT INTO preset_tags (category, tag_name, tag_name_en) VALUES
('personality', '友好', 'Friendly'),
('personality', '专业', 'Professional'),
('personality', '低调', 'Humble'),
('personality', '难沟通', 'Hard to Communicate'),
('personality', '不守时', 'Often Late');

-- 5. 验证插入结果
SELECT 'Performance tags:' as info;
SELECT id, tag_name, tag_name_en, category FROM preset_tags WHERE category = 'performance' ORDER BY id;

SELECT 'Personality tags:' as info;
SELECT id, tag_name, tag_name_en, category FROM preset_tags WHERE category = 'personality' ORDER BY id;

-- 提交事务
COMMIT;

-- ===================================================================
-- 执行后验证
-- ===================================================================
-- 运行以下查询验证迁移是否成功：
-- SELECT category, COUNT(*) as count FROM preset_tags GROUP BY category;
-- 预期结果：
-- style: 10
-- performance: 5
-- personality: 5

-- ===================================================================
-- 回滚脚本（如需回滚，执行以下命令）
-- ===================================================================
-- START TRANSACTION;
-- DELETE FROM preset_tags WHERE category IN ('performance', 'personality');
-- INSERT INTO preset_tags SELECT * FROM preset_tags_backup_20260206;
-- DROP TABLE preset_tags_backup_20260206;
-- COMMIT;
