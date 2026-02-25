# Database Migration Guide

**CRITICAL: Follow this exact process for ALL database schema changes.**

## File Structure

```
rateyourdj-backend/
├── migrations/                           # Migration files directory
│   ├── 001_add_comments.sql             # Example: first migration
│   ├── 002_create_reviewer_invite_code.sql  # Example: second migration
│   └── 003_your_new_migration.sql       # Your new migration
├── scripts/
│   └── sync-to-rds.sh                   # RDS deployment script
└── database.sql                          # Initial schema (DO NOT modify for changes)
```

## CORRECT Process for Database Changes

### Step 1: Create numbered migration file

```bash
cd rateyourdj-backend/migrations/

# Check existing migrations
ls -1 [0-9][0-9][0-9]_*.sql
# Output: 001_add_comments.sql, 002_create_reviewer_invite_code.sql

# Create next numbered migration (003 in this example)
touch 003_add_user_badges.sql
```

### Step 2: Write migration SQL

```sql
-- migrations/003_add_user_badges.sql
-- Description: Add badges system for users
-- Date: 2026-02-XX

CREATE TABLE user_badges (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  badge_type VARCHAR(50) NOT NULL,
  awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verify
SELECT COUNT(*) FROM user_badges;
```

### Step 3: Test locally

```bash
# Local testing
mysql -u root -p rateyourdj < migrations/003_add_user_badges.sql

# Verify
mysql -u root -p rateyourdj -e "SHOW TABLES LIKE 'user_badges';"
```

### Step 4: Deploy to production (RDS)

```bash
cd rateyourdj-backend

# Method 1: Use sync-to-rds.sh (RECOMMENDED)
# Requires .env.production with RDS credentials
./scripts/sync-to-rds.sh

# Script automatically:
# - Connects to RDS
# - Creates schema_migrations table (if missing)
# - Applies all unapplied migrations in order (001, 002, 003...)
# - Tracks applied migrations to prevent duplicates
# - Shows migration history
```

### Step 5: Commit to git

```bash
git add migrations/003_add_user_badges.sql
git commit -m "Migration: Add user badges system (003)"
# STOP - Ask user before pushing
```

## WRONG Practices (NEVER DO THIS)

```bash
# Creating custom migration folders
mkdir database_migrations/
mkdir db_changes/
mkdir schema_updates/

# Random file naming
touch add_badges.sql
touch new_table.sql
touch update_schema_v2.sql

# Modifying database.sql directly for changes
# (database.sql is ONLY for initial setup)

# Manual SQL execution on RDS without tracking
mysql -h rds-host -u user -p database < random_changes.sql
```

## Migration Tracking System

The `sync-to-rds.sh` script uses a `schema_migrations` table to track applied migrations:

```sql
-- Automatically created by sync-to-rds.sh
CREATE TABLE schema_migrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  migration_name VARCHAR(255) NOT NULL UNIQUE,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_migration_name (migration_name)
);

-- Check migration history
SELECT * FROM schema_migrations ORDER BY applied_at DESC;

-- Example output:
-- | id | migration_name                       | applied_at          |
-- |----|--------------------------------------|---------------------|
-- | 3  | 003_add_user_badges.sql             | 2026-02-09 12:00:00 |
-- | 2  | 002_create_reviewer_invite_code.sql | 2026-02-09 11:00:00 |
-- | 1  | 001_add_comments.sql                | 2026-02-08 18:00:00 |
```

## Migration Naming Convention

**Format**: `NNN_descriptive_name.sql`

- `NNN`: Zero-padded 3-digit number (001, 002, 003...)
- `descriptive_name`: Snake_case description
- Always increment from the highest existing number

**Good examples**:
- `001_add_comments.sql`
- `002_create_reviewer_invite_code.sql`
- `003_add_user_badges.sql`
- `010_update_dj_ratings_precision.sql`

**Bad examples**:
- `add_comments.sql` (no number)
- `1_comments.sql` (not zero-padded)
- `003-add-badges.sql` (hyphens instead of underscores)
- `003_AddBadges.sql` (camelCase)

## Emergency Rollback

If a migration causes issues:

```bash
# 1. Create rollback migration
touch migrations/004_rollback_user_badges.sql

# 2. Write DROP statements
echo "DROP TABLE IF EXISTS user_badges;" > migrations/004_rollback_user_badges.sql

# 3. Apply rollback
./scripts/sync-to-rds.sh

# OR manually:
mysql -u root -p rateyourdj < migrations/004_rollback_user_badges.sql
```

## Tips

1. **Always test locally first** before deploying to RDS
2. **One migration per logical change** (don't combine unrelated changes)
3. **Include comments** in SQL files (purpose, date, author)
4. **Add verification queries** at the end of migration files
5. **Never edit applied migrations** - create a new migration to fix issues
6. **Keep migrations idempotent** when possible (use `IF NOT EXISTS`, `ON DUPLICATE KEY UPDATE`)

## Further Reading

- Migration guide: `rateyourdj-backend/migrations/README.md`
- RDS sync documentation: `rateyourdj-backend/scripts/README-SYNC.md`
