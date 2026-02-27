-- Migration 006: Add DJ submission status and submitted_by fields
-- Enables user-submitted DJs with admin approval workflow

ALTER TABLE djs
  ADD COLUMN status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'approved' AFTER music_style,
  ADD COLUMN submitted_by INT DEFAULT NULL AFTER status,
  ADD INDEX idx_status (status);
