-- RateYourDJ Database Schema
-- MySQL 8.0+

CREATE DATABASE IF NOT EXISTS rateyourdj CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE rateyourdj;

-- 1. 用户表 (users)
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  wx_openid VARCHAR(100) UNIQUE NOT NULL,
  wx_unionid VARCHAR(100),
  nickname VARCHAR(50),
  avatar_url VARCHAR(500),
  role VARCHAR(20) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_openid (wx_openid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. DJ表 (djs)
CREATE TABLE djs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  city VARCHAR(50) NOT NULL,
  label VARCHAR(100),
  photo_url VARCHAR(500),
  music_style VARCHAR(200),
  overall_rating DECIMAL(3,2) DEFAULT 0,
  set_rating DECIMAL(3,2) DEFAULT 0,
  performance_rating DECIMAL(3,2) DEFAULT 0,
  personality_rating DECIMAL(3,2) DEFAULT 0,
  review_count INT DEFAULT 0,
  would_choose_again_percent INT DEFAULT 0,
  weighted_score DECIMAL(4,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_city (city),
  INDEX idx_name (name),
  INDEX idx_overall_rating (overall_rating),
  INDEX idx_weighted_score (weighted_score),
  FULLTEXT idx_name_fulltext (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. 评论表 (reviews)
CREATE TABLE reviews (
  id INT PRIMARY KEY AUTO_INCREMENT,
  dj_id INT NOT NULL,
  user_id INT NOT NULL,
  is_anonymous BOOLEAN DEFAULT FALSE,
  overall_rating INT NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  set_rating INT NOT NULL CHECK (set_rating BETWEEN 1 AND 5),
  performance_rating INT NOT NULL CHECK (performance_rating BETWEEN 1 AND 5),
  personality_rating INT NOT NULL CHECK (personality_rating BETWEEN 1 AND 5),
  would_choose_again BOOLEAN,
  comment TEXT,
  helpful_count INT DEFAULT 0,
  not_helpful_count INT DEFAULT 0,
  report_count INT DEFAULT 0,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'approved',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (dj_id) REFERENCES djs(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_dj_id (dj_id),
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. 评论标签关联表 (review_tags)
CREATE TABLE review_tags (
  id INT PRIMARY KEY AUTO_INCREMENT,
  review_id INT NOT NULL,
  tag_name VARCHAR(50) NOT NULL,
  FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
  INDEX idx_review_id (review_id),
  INDEX idx_tag_name (tag_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. 预设标签表 (preset_tags)
CREATE TABLE preset_tags (
  id INT PRIMARY KEY AUTO_INCREMENT,
  category ENUM('style', 'performance', 'personality') NOT NULL,
  tag_name VARCHAR(50) NOT NULL,
  tag_name_en VARCHAR(50),
  usage_count INT DEFAULT 0,
  genre_group VARCHAR(50) DEFAULT NULL,
  sub_group VARCHAR(50) DEFAULT NULL,
  sort_order INT DEFAULT 0,
  UNIQUE KEY unique_tag (category, tag_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 初始标签数据

-- House
INSERT INTO preset_tags (category, tag_name, tag_name_en, genre_group, sub_group, sort_order) VALUES
('style', 'House',            'House',            'House', 'Classic',         10),
('style', 'Chicago House',    'Chicago House',    'House', 'Classic',         11),
('style', 'Acid House',       'Acid House',       'House', 'Classic',         12),
('style', 'Disco House',      'Disco House',      'House', 'Classic',         13),
('style', 'Vogue',            'Vogue',            'House', 'Classic',         14),
('style', 'Deep House',       'Deep House',       'House', 'Deep & Melodic',  20),
('style', 'Progressive House','Progressive House','House', 'Deep & Melodic',  21),
('style', 'Afro House',       'Afro House',       'House', 'Deep & Melodic',  22),
('style', 'Tropical House',   'Tropical House',   'House', 'Deep & Melodic',  23),
('style', 'Tribal House',    'Tribal House',     'House', 'Deep & Melodic',  24),
('style', 'Tech House',       'Tech House',       'House', 'Modern',          30),
('style', 'Bass House',       'Bass House',       'House', 'Modern',          31),
('style', 'Future House',     'Future House',     'House', 'Modern',          32),
('style', 'Slap House',       'Slap House',       'House', 'Modern',          33),
('style', 'Micro House',      'Micro House',      'House', 'Niche',           34),
('style', 'Ambient House',    'Ambient House',    'House', 'Niche',           35);

-- Techno
INSERT INTO preset_tags (category, tag_name, tag_name_en, genre_group, sub_group, sort_order) VALUES
('style', 'Techno',           'Techno',           'Techno', 'Classic',        40),
('style', 'Detroit Techno',   'Detroit Techno',   'Techno', 'Classic',        41),
('style', 'Acid Techno',      'Acid Techno',      'Techno', 'Classic',        42),
('style', 'Melodic Techno',   'Melodic Techno',   'Techno', 'Modern',         50),
('style', 'Minimal Techno',   'Minimal Techno',   'Techno', 'Modern',         51),
('style', 'Industrial Techno','Industrial Techno','Techno', 'Modern',         52),
('style', 'Hard Groove',      'Hard Groove',      'Techno', 'Modern',         53),
('style', 'Hardcore Techno',  'Hardcore Techno',  'Techno', 'Hard',           55),
('style', 'Hard Techno',      'Hard Techno',      'Techno', 'Hard',           56),
('style', 'Ghetto Techno',   'Ghetto Techno',    'Techno', 'Hard',           57),
('style', 'Gabber',           'Gabber',           'Techno', 'Hard',           58),
('style', 'Dub Techno',       'Dub Techno',       'Techno', 'Hypnotic',       60),
('style', 'Ambient Techno',   'Ambient Techno',   'Techno', 'Hypnotic',       61);

-- Trance
INSERT INTO preset_tags (category, tag_name, tag_name_en, genre_group, sub_group, sort_order) VALUES
('style', 'Trance',           'Trance',           'Trance', 'Melodic',        70),
('style', 'Uplifting Trance', 'Uplifting Trance', 'Trance', 'Melodic',        71),
('style', 'Progressive Trance','Progressive Trance','Trance','Melodic',       72),
('style', 'Neo Trance',       'Neo Trance',       'Trance', 'Melodic',        73),
('style', 'Psytrance',        'Psytrance',        'Trance', 'Dark & Driving', 75),
('style', 'Tech Trance',      'Tech Trance',      'Trance', 'Dark & Driving', 76);

-- Bass Music
INSERT INTO preset_tags (category, tag_name, tag_name_en, genre_group, sub_group, sort_order) VALUES
('style', 'Dubstep',          'Dubstep',          'Bass Music', 'Dubstep',     90),
('style', 'Riddim',           'Riddim',           'Bass Music', 'Dubstep',     91),
('style', 'Melodic Dubstep',  'Melodic Dubstep',  'Bass Music', 'Dubstep',     92),
('style', 'Drum & Bass',      'Drum & Bass',      'Bass Music', 'Drum & Bass', 95),
('style', 'Neurofunk',        'Neurofunk',        'Bass Music', 'Drum & Bass', 96),
('style', 'Jungle',           'Jungle',           'Bass Music', 'Drum & Bass', 97),
('style', 'Techstep',         'Techstep',         'Bass Music', 'Drum & Bass', 98),
('style', 'Halftime',         'Halftime',         'Bass Music', 'Drum & Bass', 99),
('style', 'Liquid Funk',      'Liquid Funk',      'Bass Music', 'Drum & Bass', 94),
('style', 'UK Garage',        'UK Garage',        'Bass Music', 'UK Bass',    100),
('style', 'Grime',            'Grime',            'Bass Music', 'UK Bass',    101),
('style', 'Bassline',         'Bassline',         'Bass Music', 'UK Bass',    102),
('style', 'Future Garage',    'Future Garage',    'Bass Music', 'UK Bass',    103),
('style', 'Baile Funk',       'Baile Funk',       'Bass Music', 'Global Bass', 105),
('style', 'Gqom',             'Gqom',             'Bass Music', 'Global Bass', 106),
('style', 'Latin Core',       'Latin Core',       'Bass Music', 'Global Bass', 107);

-- EDM / Dance
INSERT INTO preset_tags (category, tag_name, tag_name_en, genre_group, sub_group, sort_order) VALUES
('style', 'EDM',              'EDM',              'EDM / Dance', 'Main Stage',  119),
('style', 'Big Room',         'Big Room',         'EDM / Dance', 'Main Stage',  120),
('style', 'Electro House',    'Electro House',    'EDM / Dance', 'Main Stage',  121),
('style', 'Hardstyle',        'Hardstyle',        'EDM / Dance', 'Main Stage',  122),
('style', 'Club',             'Club',             'EDM / Dance', 'Main Stage',  123),
('style', 'Future Bass',      'Future Bass',      'EDM / Dance', 'Future Pop',  125),
('style', 'Melbourne Bounce', 'Melbourne Bounce', 'EDM / Dance', 'Future Pop',  126),
('style', 'Moombahton',       'Moombahton',       'EDM / Dance', 'Future Pop',  127);

-- Breaks & Beats
INSERT INTO preset_tags (category, tag_name, tag_name_en, genre_group, sub_group, sort_order) VALUES
('style', 'Breakbeat',        'Breakbeat',        'Breaks & Beats', 'Breakbeat', 130),
('style', 'Big Beat',         'Big Beat',         'Breaks & Beats', 'Breakbeat', 131),
('style', 'Electro Swing',    'Electro Swing',    'Breaks & Beats', 'Breakbeat', 132),
('style', 'Footwork',         'Footwork',         'Breaks & Beats', 'Footwork',  135),
('style', 'Jersey Club',      'Jersey Club',      'Breaks & Beats', 'Footwork',  136);

-- Downtempo & Experimental
INSERT INTO preset_tags (category, tag_name, tag_name_en, genre_group, sub_group, sort_order) VALUES
('style', 'Ambient',          'Ambient',          'Downtempo & Experimental', 'Ambient & Chill', 140),
('style', 'Chillout',         'Chillout',         'Downtempo & Experimental', 'Ambient & Chill', 141),
('style', 'Downtempo',        'Downtempo',        'Downtempo & Experimental', 'Ambient & Chill', 142),
('style', 'IDM',              'IDM',              'Downtempo & Experimental', 'Experimental',    145),
('style', 'Glitch Hop',       'Glitch Hop',       'Downtempo & Experimental', 'Experimental',    146),
('style', 'Trip Hop',         'Trip Hop',         'Downtempo & Experimental', 'Experimental',    147),
('style', 'Vaporwave',        'Vaporwave',        'Downtempo & Experimental', 'Internet Era',    150),
('style', 'Hyperpop',         'Hyperpop',         'Downtempo & Experimental', 'Internet Era',    151),
('style', 'Wave',             'Wave',             'Downtempo & Experimental', 'Internet Era',    152);

-- Disco & Retro
INSERT INTO preset_tags (category, tag_name, tag_name_en, genre_group, sub_group, sort_order) VALUES
('style', 'Disco',            'Disco',            'Disco & Retro', 'Disco', 155),
('style', 'Nu-Disco',         'Nu-Disco',         'Disco & Retro', 'Disco', 156),
('style', 'Synthwave',        'Synthwave',        'Disco & Retro', 'Retro', 160),
('style', 'Chillwave',        'Chillwave',        'Disco & Retro', 'Retro', 161);

-- Urban & Trap
INSERT INTO preset_tags (category, tag_name, tag_name_en, genre_group, sub_group, sort_order) VALUES
('style', 'Trap',             'Trap',             'Urban & Trap', 'Trap',   170),
('style', 'Phonk',            'Phonk',            'Urban & Trap', 'Trap',   171),
('style', 'Hardwave',         'Hardwave',         'Urban & Trap', 'Hybrid', 175),
('style', 'UK Drill',         'UK Drill',         'Urban & Trap', 'Hybrid', 176);

-- China & Asia
INSERT INTO preset_tags (category, tag_name, tag_name_en, genre_group, sub_group, sort_order) VALUES
('style', '国风电音',          'Guofeng EDM',     'China & Asia', '中国',         180),
('style', 'J-Core',           'J-Core',           'China & Asia', 'Asia-Pacific', 185),
('style', 'K-House',          'K-House',          'China & Asia', 'Asia-Pacific', 186),
('style', 'Bounce',           'Bounce',           'China & Asia', 'Asia-Pacific', 187);

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

-- 6. 收藏表 (favorites)
CREATE TABLE favorites (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  dj_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (dj_id) REFERENCES djs(id) ON DELETE CASCADE,
  UNIQUE KEY unique_favorite (user_id, dj_id),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. 评论互动表 (review_interactions)
CREATE TABLE review_interactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  review_id INT NOT NULL,
  user_id INT NOT NULL,
  interaction_type ENUM('helpful', 'not_helpful', 'report') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_interaction (review_id, user_id, interaction_type),
  INDEX idx_review_id (review_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. 搜索历史表 (search_history)
CREATE TABLE search_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  keyword VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入一些示例数据用于测试
INSERT INTO djs (name, city, label, music_style, overall_rating, set_rating, performance_rating, personality_rating, review_count) VALUES
('DJ Yang', '上海', 'Shelter Shanghai', 'Techno,Melodic Techno', 4.5, 4.6, 4.7, 4.3, 15),
('DJ Chen', '北京', 'Dada Beijing', 'House,Deep House', 4.2, 4.1, 4.3, 4.2, 8),
('DJ Liu', '深圳', 'OIL Shenzhen', 'Bass House,Dubstep', 4.8, 4.9, 4.8, 4.7, 23);
