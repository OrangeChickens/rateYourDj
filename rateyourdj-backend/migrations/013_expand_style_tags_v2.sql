-- 013: 扩充风格标签 (#18 更多风格选项, #31 新增Bounce等)

-- 新增缺失的高频标签
INSERT IGNORE INTO preset_tags (tag_name, category, genre_group, sub_group) VALUES
('Experimental', 'style', 'Downtempo & Experimental', 'Experimental'),
('Electronic', 'style', 'EDM / Dance', 'Main Stage'),
('Industrial', 'style', 'Techno', 'Hard'),
('Electro', 'style', 'Breaks & Beats', 'Breakbeat'),
('EBM', 'style', 'Techno', 'Hard'),
('Jazz', 'style', 'Disco & Retro', 'Funk & Soul'),
('Minimal', 'style', 'Techno', 'Modern'),
('Acid', 'style', 'Techno', 'Classic'),
('Halftime', 'style', 'Bass Music', 'Drum & Bass'),
('Harddrum', 'style', 'Techno', 'Hard'),
('Rap', 'style', 'Urban & Trap', 'Hip Hop');

-- 统一DJ数据中的标签变体
UPDATE djs SET music_style = REPLACE(music_style, 'Hip-Hop', 'Hip Hop') WHERE music_style LIKE '%Hip-Hop%';
UPDATE djs SET music_style = REPLACE(music_style, 'Drum&Bass', 'Drum & Bass') WHERE music_style LIKE '%Drum&Bass%';
