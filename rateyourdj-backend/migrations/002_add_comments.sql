-- 评论表（支持嵌套回复）
CREATE TABLE review_comments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  review_id INT NOT NULL,
  parent_comment_id INT NULL,  -- NULL = 顶级评论，非空 = 嵌套回复
  user_id INT NOT NULL,
  content TEXT NOT NULL,
  vote_score INT DEFAULT 0,  -- upvotes - downvotes（聚合分数）
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_comment_id) REFERENCES review_comments(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

  INDEX idx_review_id (review_id, created_at DESC),
  INDEX idx_parent_id (parent_comment_id),
  INDEX idx_vote_score (vote_score DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='评价评论表';

-- 评论投票表
CREATE TABLE comment_votes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  comment_id INT NOT NULL,
  user_id INT NOT NULL,
  vote_type ENUM('upvote', 'downvote') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (comment_id) REFERENCES review_comments(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

  UNIQUE KEY unique_vote (comment_id, user_id),  -- 每个用户对每条评论只能投一票
  INDEX idx_comment_id (comment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='评论投票表';
