#!/bin/bash

# RDS Database Sync Script
# Applies numbered migrations (001_xxx.sql, 002_xxx.sql) from migrations/ directory

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "                      RateYourDJ - RDS Database Sync"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Load RDS configuration
if [ ! -f .env.rds ]; then
    echo -e "${RED}❌ Error: .env.rds file not found${NC}"
    echo ""
    echo "Please create .env.rds with your RDS credentials:"
    echo "  RDS_HOST=your-rds-endpoint.rds.amazonaws.com"
    echo "  RDS_PORT=3306"
    echo "  RDS_USER=admin"
    echo "  RDS_PASSWORD=your-password"
    echo "  RDS_DB_NAME=rateyourdj"
    exit 1
fi

# Load environment variables
export $(grep -v '^#' .env.rds | xargs)

# Verify required variables
if [ -z "$RDS_HOST" ] || [ -z "$RDS_USER" ] || [ -z "$RDS_PASSWORD" ] || [ -z "$RDS_DB_NAME" ]; then
    echo -e "${RED}❌ Error: Missing required RDS configuration${NC}"
    echo "Please ensure .env.rds contains: RDS_HOST, RDS_USER, RDS_PASSWORD, RDS_DB_NAME"
    exit 1
fi

echo -e "${YELLOW}📋 Configuration:${NC}"
echo "  Host:     $RDS_HOST"
echo "  Port:     ${RDS_PORT:-3306}"
echo "  Database: $RDS_DB_NAME"
echo "  User:     $RDS_USER"
echo ""

# Test connection
echo -e "${YELLOW}🔌 Testing RDS connection...${NC}"
if ! mysql -h "$RDS_HOST" -P "${RDS_PORT:-3306}" -u "$RDS_USER" -p"$RDS_PASSWORD" -e "SELECT 1" >/dev/null 2>&1; then
    echo -e "${RED}❌ Failed to connect to RDS${NC}"
    echo "Please check your credentials and network connectivity"
    exit 1
fi
echo -e "${GREEN}✅ Connection successful${NC}"
echo ""

# Create database if it doesn't exist
echo -e "${YELLOW}🗄️  Checking database...${NC}"
mysql -h "$RDS_HOST" -P "${RDS_PORT:-3306}" -u "$RDS_USER" -p"$RDS_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS $RDS_DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
echo -e "${GREEN}✅ Database ready${NC}"
echo ""

# Create migrations tracking table if it doesn't exist
echo -e "${YELLOW}📝 Setting up migration tracking...${NC}"
mysql -h "$RDS_HOST" -P "${RDS_PORT:-3306}" -u "$RDS_USER" -p"$RDS_PASSWORD" "$RDS_DB_NAME" <<EOF
CREATE TABLE IF NOT EXISTS schema_migrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  migration_name VARCHAR(255) NOT NULL UNIQUE,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_migration_name (migration_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
EOF
echo -e "${GREEN}✅ Migration tracking ready${NC}"
echo ""

# Function to check if migration was already applied
is_migration_applied() {
    local migration_name=$1
    local result=$(mysql -h "$RDS_HOST" -P "${RDS_PORT:-3306}" -u "$RDS_USER" -p"$RDS_PASSWORD" "$RDS_DB_NAME" -sN -e "SELECT COUNT(*) FROM schema_migrations WHERE migration_name = '$migration_name'")
    [ "$result" -gt 0 ]
}

# Function to mark migration as applied
mark_migration_applied() {
    local migration_name=$1
    mysql -h "$RDS_HOST" -P "${RDS_PORT:-3306}" -u "$RDS_USER" -p"$RDS_PASSWORD" "$RDS_DB_NAME" -e "INSERT INTO schema_migrations (migration_name) VALUES ('$migration_name')"
}

# Function to apply migration file
apply_migration() {
    local file=$1
    local basename=$(basename "$file")

    if is_migration_applied "$basename"; then
        echo -e "${YELLOW}⏭️  Skipping $basename (already applied)${NC}"
        return
    fi

    echo -e "${YELLOW}🔄 Applying $basename...${NC}"

    if mysql -h "$RDS_HOST" -P "${RDS_PORT:-3306}" -u "$RDS_USER" -p"$RDS_PASSWORD" "$RDS_DB_NAME" < "$file"; then
        mark_migration_applied "$basename"
        echo -e "${GREEN}✅ Applied $basename${NC}"
    else
        echo -e "${RED}❌ Failed to apply $basename${NC}"
        exit 1
    fi
}

# Apply migrations in order
echo -e "${YELLOW}📦 Applying migrations...${NC}"
echo ""

# Apply numbered migrations from migrations/ directory in order
if [ -d "migrations" ]; then
    # Find all numbered migration files (001_xxx.sql, 002_xxx.sql, etc.) and sort them
    for migration in $(find migrations -name '[0-9][0-9][0-9]_*.sql' -type f | sort); do
        if [ -f "$migration" ]; then
            apply_migration "$migration"
            echo ""
        fi
    done
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🎉 RDS sync completed successfully!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Show applied migrations count
MIGRATION_COUNT=$(mysql -h "$RDS_HOST" -P "${RDS_PORT:-3306}" -u "$RDS_USER" -p"$RDS_PASSWORD" "$RDS_DB_NAME" -sN -e "SELECT COUNT(*) FROM schema_migrations")
echo -e "${GREEN}Total migrations applied: $MIGRATION_COUNT${NC}"
echo ""

# Show table count
TABLE_COUNT=$(mysql -h "$RDS_HOST" -P "${RDS_PORT:-3306}" -u "$RDS_USER" -p"$RDS_PASSWORD" "$RDS_DB_NAME" -sN -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$RDS_DB_NAME'")
echo -e "${GREEN}Total tables: $TABLE_COUNT${NC}"
echo ""

# Show recent migrations
echo -e "${YELLOW}📋 Recent migrations:${NC}"
mysql -h "$RDS_HOST" -P "${RDS_PORT:-3306}" -u "$RDS_USER" -p"$RDS_PASSWORD" "$RDS_DB_NAME" -e "SELECT id, migration_name, applied_at FROM schema_migrations ORDER BY applied_at DESC LIMIT 10"
echo ""

echo -e "${GREEN}✨ Done!${NC}"
