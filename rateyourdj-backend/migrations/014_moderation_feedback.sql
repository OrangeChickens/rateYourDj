-- 保存评价及评论的作者反馈；旧记录不编造原因。重复执行安全。
SET @feedback_sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE reviews ADD COLUMN moderation_reason VARCHAR(500) NULL', 'SELECT 1') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'reviews' AND COLUMN_NAME = 'moderation_reason');
PREPARE feedback_stmt FROM @feedback_sql;
EXECUTE feedback_stmt;
DEALLOCATE PREPARE feedback_stmt;
SET @feedback_sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE reviews ADD COLUMN moderated_at DATETIME NULL', 'SELECT 1') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'reviews' AND COLUMN_NAME = 'moderated_at');
PREPARE feedback_stmt FROM @feedback_sql;
EXECUTE feedback_stmt;
DEALLOCATE PREPARE feedback_stmt;
SET @feedback_sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE review_comments ADD COLUMN moderation_reason VARCHAR(500) NULL', 'SELECT 1') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'review_comments' AND COLUMN_NAME = 'moderation_reason');
PREPARE feedback_stmt FROM @feedback_sql;
EXECUTE feedback_stmt;
DEALLOCATE PREPARE feedback_stmt;
SET @feedback_sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE review_comments ADD COLUMN moderated_at DATETIME NULL', 'SELECT 1') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'review_comments' AND COLUMN_NAME = 'moderated_at');
PREPARE feedback_stmt FROM @feedback_sql;
EXECUTE feedback_stmt;
DEALLOCATE PREPARE feedback_stmt;
