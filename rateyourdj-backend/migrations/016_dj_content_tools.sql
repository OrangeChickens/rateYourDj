-- DJ content: additive schema; merging is only performed after an administrator action.
SET @add_merge = (SELECT IF(COUNT(*) = 0,
  'ALTER TABLE djs ADD COLUMN merged_into_id INT DEFAULT NULL, ADD INDEX idx_merged_into (merged_into_id)',
  'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'djs' AND column_name = 'merged_into_id');
PREPARE add_merge_stmt FROM @add_merge;
EXECUTE add_merge_stmt;
DEALLOCATE PREPARE add_merge_stmt;

CREATE TABLE IF NOT EXISTS dj_sets (
  id INT PRIMARY KEY AUTO_INCREMENT,
  dj_id INT NOT NULL,
  user_id INT DEFAULT NULL,
  title VARCHAR(100) NOT NULL,
  feed_token VARCHAR(200) CHARACTER SET ascii COLLATE ascii_bin DEFAULT NULL,
  reference_text VARCHAR(1000) DEFAULT NULL,
  status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  moderation_reason VARCHAR(500) DEFAULT NULL,
  moderated_by INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (dj_id) REFERENCES djs(id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_dj_status (dj_id, status), INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS dj_events (
  id INT PRIMARY KEY AUTO_INCREMENT,
  dj_id INT NOT NULL,
  user_id INT DEFAULT NULL,
  title VARCHAR(100) NOT NULL,
  starts_at DATETIME NOT NULL COMMENT 'Asia/Shanghai wall time',
  city VARCHAR(50) NOT NULL,
  venue VARCHAR(150) NOT NULL,
  source_url VARCHAR(500) DEFAULT NULL,
  status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  moderation_reason VARCHAR(500) DEFAULT NULL,
  moderated_by INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (dj_id) REFERENCES djs(id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_dj_status_time (dj_id, status, starts_at), INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS dj_duplicate_reports (
  id INT PRIMARY KEY AUTO_INCREMENT,
  dj_id INT NOT NULL COMMENT 'source profile',
  target_dj_id INT NOT NULL COMMENT 'profile to keep',
  user_id INT DEFAULT NULL,
  reason VARCHAR(500) NOT NULL,
  status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  moderation_reason VARCHAR(500) DEFAULT NULL,
  moderated_by INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (dj_id) REFERENCES djs(id),
  FOREIGN KEY (target_dj_id) REFERENCES djs(id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_status (status), INDEX idx_djs (dj_id, target_dj_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Preserve the one video explicitly supplied and verified by Jort.
INSERT INTO dj_sets (dj_id, title, feed_token, status)
SELECT 9, 'LIUYANG刘炀 视频', 'token/ADRhgWPJw', 'approved'
FROM djs WHERE id = 9 AND status = 'approved'
  AND NOT EXISTS (SELECT 1 FROM dj_sets WHERE dj_id = 9 AND feed_token = 'token/ADRhgWPJw');
