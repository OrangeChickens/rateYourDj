-- suggestions table
CREATE TABLE suggestions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  content TEXT NOT NULL,
  upvote_count INT DEFAULT 0,
  downvote_count INT DEFAULT 0,
  status ENUM('open', 'planned', 'done', 'rejected') DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- suggestion_votes table
CREATE TABLE suggestion_votes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  suggestion_id INT NOT NULL,
  user_id INT NOT NULL,
  vote_type ENUM('up', 'down') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_vote (suggestion_id, user_id),
  FOREIGN KEY (suggestion_id) REFERENCES suggestions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
