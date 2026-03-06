-- 007: Add bio column to djs table
ALTER TABLE djs ADD COLUMN bio TEXT DEFAULT NULL AFTER music_style;
