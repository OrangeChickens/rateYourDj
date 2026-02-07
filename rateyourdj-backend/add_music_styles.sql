-- 添加新的音乐风格标签到 preset_tags 表
--
-- 执行方式：
-- 1. 本地开发环境（Docker）：
--    docker exec -i rateyourdj-mysql mysql -uroot -prateyourdj123 rateyourdj < add_music_styles.sql
--
-- 2. 生产环境（直接安装的MySQL）：
--    mysql -u root -p rateyourdj < add_music_styles.sql
--    或者登录MySQL后执行：
--    mysql -u root -p
--    use rateyourdj;
--    source /path/to/add_music_styles.sql;
--
-- 新增50个音乐风格标签（原有10个，总计60个）

-- 主流 EDM 系列
INSERT INTO preset_tags (category, tag_name, tag_name_en) VALUES
('style', 'EDM', 'EDM'),
('style', 'Future Bass', 'Future Bass'),
('style', 'Electro House', 'Electro House'),
('style', 'Melbourne Bounce', 'Melbourne Bounce'),
('style', 'Hardstyle', 'Hardstyle'),
('style', 'Drum & Bass', 'Drum & Bass'),
('style', 'Future House', 'Future House'),

-- Techno/House 细分
('style', 'Tech House', 'Tech House'),
('style', 'Minimal Techno', 'Minimal Techno'),
('style', 'Industrial Techno', 'Industrial Techno'),
('style', 'Acid Techno', 'Acid Techno'),
('style', 'Breakbeat', 'Breakbeat'),
('style', 'Garage', 'Garage'),
('style', 'UK Garage', 'UK Garage'),
('style', 'Disco House', 'Disco House'),
('style', 'Afro House', 'Afro House'),
('style', 'Micro House', 'Micro House'),

-- Trance 系列
('style', 'Psytrance', 'Psytrance'),
('style', 'Progressive Trance', 'Progressive Trance'),
('style', 'Uplifting Trance', 'Uplifting Trance'),
('style', 'Tech Trance', 'Tech Trance'),

-- Bass 音乐系列
('style', 'Future Garage', 'Future Garage'),
('style', 'Riddim', 'Riddim'),
('style', 'Halftime', 'Halftime'),
('style', 'Neurofunk', 'Neurofunk'),

-- 实验性/小众风格
('style', 'Hyperpop', 'Hyperpop'),
('style', 'Glitch Hop', 'Glitch Hop'),
('style', 'IDM', 'IDM'),
('style', 'Vaporwave', 'Vaporwave'),
('style', 'Footwork', 'Footwork'),
('style', 'Jungle', 'Jungle'),
('style', 'Breakcore', 'Breakcore'),
('style', 'Ambient', 'Ambient'),
('style', 'Downtempo', 'Downtempo'),
('style', 'Trip Hop', 'Trip Hop'),
('style', 'Wave', 'Wave'),
('style', 'Jersey Club', 'Jersey Club'),

-- 其他流行风格
('style', 'Moombahton', 'Moombahton'),
('style', 'Hardwave', 'Hardwave'),
('style', 'Phonk', 'Phonk'),
('style', 'UK Drill', 'UK Drill'),
('style', 'Slap House', 'Slap House'),
('style', 'Bassline', 'Bassline'),
('style', 'Grime', 'Grime'),
('style', 'Electro Swing', 'Electro Swing'),

-- 中国/亚洲特色
('style', '国风电音', 'Chinese EDM'),
('style', 'J-Core', 'J-Core'),
('style', 'K-House', 'K-House'),
('style', 'Bounce', 'Bounce'),
('style', 'Hands Up', 'Hands Up');

-- 查询验证：查看所有音乐风格标签
SELECT tag_name, tag_name_en, usage_count 
FROM preset_tags 
WHERE category = 'style' 
ORDER BY tag_name;
