-- Add status column to review_comments for content moderation
ALTER TABLE review_comments ADD COLUMN status ENUM('approved','pending','rejected') DEFAULT 'approved' AFTER content;
