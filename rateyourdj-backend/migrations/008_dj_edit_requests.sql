-- 008: Create dj_edit_requests table
CREATE TABLE dj_edit_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  dj_id INT NOT NULL,
  user_id INT NOT NULL,
  proposed_data JSON NOT NULL,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (dj_id) REFERENCES djs(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_status (status),
  INDEX idx_dj_id (dj_id)
);
