-- Add 'banned' to access_level enum
ALTER TABLE users MODIFY COLUMN access_level ENUM('waitlist','full','banned') DEFAULT 'waitlist';
