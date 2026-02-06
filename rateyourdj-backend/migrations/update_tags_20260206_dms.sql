-- ===================================================================
-- 标签精简迁移脚本 - DMS版本（无事务）
-- 创建时间: 2026-02-06
-- 说明: 精简表现力和性格标签，每类从10个减少到5个（2正面+1中性+2负面）
-- 适用于: 阿里云DMS SQL Console
-- ===================================================================

-- 删除所有现有的表现力和性格标签
DELETE FROM preset_tags WHERE category IN ('performance', 'personality');

-- 插入新的精简标签

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

-- 验证插入结果
SELECT 'Performance tags:' as info;
SELECT id, tag_name, tag_name_en, category FROM preset_tags WHERE category = 'performance' ORDER BY id;

SELECT 'Personality tags:' as info;
SELECT id, tag_name, tag_name_en, category FROM preset_tags WHERE category = 'personality' ORDER BY id;

-- ===================================================================
-- 执行后验证
-- ===================================================================
-- 运行以下查询验证迁移是否成功：
-- SELECT category, COUNT(*) as count FROM preset_tags GROUP BY category;
-- 预期结果：
-- style: 10
-- performance: 5
-- personality: 5
