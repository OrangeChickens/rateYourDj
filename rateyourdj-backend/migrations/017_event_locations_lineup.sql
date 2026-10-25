-- Add venue coordinates and shared event lineups; preserve legacy event IDs.
SET @event_column = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE dj_events ADD COLUMN address VARCHAR(300) DEFAULT NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'dj_events' AND column_name = 'address');
PREPARE event_column_stmt FROM @event_column;
EXECUTE event_column_stmt;
DEALLOCATE PREPARE event_column_stmt;
SET @event_column = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE dj_events ADD COLUMN latitude DECIMAL(10,7) DEFAULT NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'dj_events' AND column_name = 'latitude');
PREPARE event_column_stmt FROM @event_column;
EXECUTE event_column_stmt;
DEALLOCATE PREPARE event_column_stmt;
SET @event_column = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE dj_events ADD COLUMN longitude DECIMAL(10,7) DEFAULT NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'dj_events' AND column_name = 'longitude');
PREPARE event_column_stmt FROM @event_column;
EXECUTE event_column_stmt;
DEALLOCATE PREPARE event_column_stmt;
CREATE TABLE IF NOT EXISTS dj_event_djs (
  event_id INT NOT NULL,
  dj_id INT NOT NULL,
  PRIMARY KEY (event_id, dj_id),
  INDEX idx_dj_event (dj_id, event_id),
  FOREIGN KEY (event_id) REFERENCES dj_events(id) ON DELETE CASCADE,
  FOREIGN KEY (dj_id) REFERENCES djs(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT IGNORE INTO dj_event_djs (event_id, dj_id) SELECT id, dj_id FROM dj_events;
SET @event_index = (SELECT IF(COUNT(*) = 0,
  'ALTER TABLE dj_events ADD INDEX idx_calendar_status_time (status, starts_at)', 'SELECT 1')
  FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'dj_events' AND index_name = 'idx_calendar_status_time');
PREPARE event_index_stmt FROM @event_index;
EXECUTE event_index_stmt;
DEALLOCATE PREPARE event_index_stmt;
