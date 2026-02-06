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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_city (city),
  INDEX idx_name (name),
  INDEX idx_overall_rating (overall_rating),
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
  UNIQUE KEY unique_tag (category, tag_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 初始标签数据
INSERT INTO preset_tags (category, tag_name, tag_name_en) VALUES
-- 音乐风格标签
('style', 'Big Room', 'Big Room'),
('style', 'Techno', 'Techno'),
('style', 'House', 'House'),
('style', 'Progressive House', 'Progressive House'),
('style', 'Trance', 'Trance'),
('style', 'Dubstep', 'Dubstep'),
('style', 'Trap', 'Trap'),
('style', 'Bass House', 'Bass House'),
('style', 'Melodic Techno', 'Melodic Techno'),
('style', 'Deep House', 'Deep House'),
-- 表现力标签
('performance', '有张力', 'Energetic'),
('performance', '舞台表现力强', 'Great Stage Presence'),
('performance', '互动性好', 'Interactive'),
('performance', '控场能力强', 'Crowd Control'),
('performance', '技术精湛', 'Technically Skilled'),
('performance', '创意十足', 'Creative'),
('performance', '气氛营造好', 'Great Atmosphere'),
('performance', '专业', 'Professional'),
('performance', '激情四溢', 'Passionate'),
('performance', '稳定发挥', 'Consistent'),
-- 性格标签
('personality', '热情', 'Enthusiastic'),
('personality', '友好', 'Friendly'),
('personality', '专业', 'Professional'),
('personality', '低调', 'Humble'),
('personality', '幽默', 'Humorous'),
('personality', '认真', 'Serious'),
('personality', '亲和力强', 'Approachable'),
('personality', '好沟通', 'Communicative'),
('personality', '守时', 'Punctual'),
('personality', '靠谱', 'Reliable');

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
