# RDS Database Sync Guide

## Quick Start

### 1. Configure RDS Credentials

Edit `.env.rds` file with your RDS information:

```bash
# .env.rds
RDS_HOST=your-rds-endpoint.rds.amazonaws.com
RDS_PORT=3306
RDS_USER=admin
RDS_PASSWORD=your-secure-password
RDS_DB_NAME=rateyourdj
```

**Example:**
```bash
RDS_HOST=rateyourdj.c1234567890.ap-southeast-1.rds.amazonaws.com
RDS_PORT=3306
RDS_USER=admin
RDS_PASSWORD=MySecurePass123!
RDS_DB_NAME=rateyourdj
```

### 2. Run Sync Script

```bash
cd rateyourdj-backend
./scripts/sync-to-rds.sh
```

## What It Does

The sync script will:

1. ✅ Test RDS connection
2. ✅ Create database if it doesn't exist
3. ✅ Create migration tracking table (`schema_migrations`)
4. ✅ Apply all pending migrations in order:
   - Base schema (`database.sql`)
   - Music styles (`add_music_styles.sql`)
   - Waitlist & tasks system (`migrations/001_add_waitlist_and_tasks_fixed.sql`)
   - Tags update (`migrations/update_tags_20260206.sql`)
   - Comments system (`database_migrations/add_comments.sql`)
5. ✅ Track applied migrations to prevent duplicates
6. ✅ Show sync summary

## Migration Tracking

The script creates a `schema_migrations` table to track which migrations have been applied:

```sql
CREATE TABLE schema_migrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  migration_name VARCHAR(255) NOT NULL UNIQUE,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Safe to run multiple times** - already applied migrations will be skipped.

## Migrations Applied (in order)

1. **database.sql** - Base schema (8 tables)
   - users, djs, reviews, review_tags, preset_tags, favorites, review_interactions, search_history

2. **add_music_styles.sql** - Music style tags
   - Adds 20+ music genre tags (Techno, House, Trance, etc.)

3. **001_add_waitlist_and_tasks_fixed.sql** - Waitlist & task system
   - Adds `access_level` to users
   - Creates `user_tasks` table
   - Creates `invite_codes` table

4. **update_tags_20260206.sql** - Tag updates
   - Updates preset tags with latest data

5. **add_comments.sql** - Comment system (latest)
   - Creates `review_comments` table (nested comments, max 3 levels)
   - Creates `comment_votes` table (upvote/downvote)

## Troubleshooting

### Connection Failed

**Error:** `Failed to connect to RDS`

**Solutions:**
- Check RDS security group allows inbound MySQL (port 3306) from your IP
- Verify RDS endpoint is correct (copy from AWS Console)
- Ensure RDS is publicly accessible (if connecting from outside VPC)
- Check username/password are correct

### Migration Failed

**Error:** `Failed to apply migration XXX.sql`

**Solutions:**
- Check MySQL error message in output
- Verify migration SQL syntax is valid
- If table already exists, manually mark migration as applied:
  ```bash
  mysql -h <RDS_HOST> -u <USER> -p <DB_NAME> -e \
    "INSERT INTO schema_migrations (migration_name) VALUES ('XXX.sql')"
  ```

### Skip a Migration

If you need to manually skip a migration (because it was applied outside this script):

```bash
mysql -h <RDS_HOST> -u <USER> -p <DB_NAME> -e \
  "INSERT INTO schema_migrations (migration_name) VALUES ('migration_to_skip.sql')"
```

### View Applied Migrations

```bash
mysql -h <RDS_HOST> -u <USER> -p <DB_NAME> -e \
  "SELECT * FROM schema_migrations ORDER BY applied_at DESC"
```

## Security Notes

- ⚠️ **Never commit `.env.rds` to git** (already in .gitignore)
- ✅ Use strong passwords for RDS
- ✅ Restrict RDS security group to known IPs
- ✅ Enable SSL/TLS for production RDS connections
- ✅ Use AWS Secrets Manager or Parameter Store for production credentials

## Production Deployment

For production, consider using AWS DMS (Database Migration Service) or:

```bash
# 1. Backup production RDS first
mysqldump -h <RDS_HOST> -u <USER> -p <DB_NAME> > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Test sync on staging RDS first
# Edit .env.rds with staging credentials
./scripts/sync-to-rds.sh

# 3. Verify staging data looks correct

# 4. Sync to production RDS
# Edit .env.rds with production credentials
./scripts/sync-to-rds.sh
```

## Manual Migration

If you prefer to apply migrations manually:

```bash
# Apply specific migration
mysql -h <RDS_HOST> -P 3306 -u <USER> -p<PASSWORD> <DB_NAME> < database_migrations/add_comments.sql

# Mark as applied
mysql -h <RDS_HOST> -u <USER> -p<PASSWORD> <DB_NAME> -e \
  "INSERT INTO schema_migrations (migration_name) VALUES ('add_comments.sql')"
```

## Rollback

The script does not automatically rollback. If you need to rollback:

1. Restore from RDS snapshot or backup
2. Or manually run rollback SQL if available:
   ```bash
   mysql -h <RDS_HOST> -u <USER> -p <DB_NAME> < migrations/rollback_partial.sql
   ```

## Support

For issues or questions, check:
- AWS RDS Console for database status
- CloudWatch Logs for RDS errors
- VPC Security Groups for connectivity issues
