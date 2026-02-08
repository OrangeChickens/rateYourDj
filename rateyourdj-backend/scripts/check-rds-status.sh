#!/bin/bash

# RDS Database Status Check Script
# Shows current database state without applying any changes

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "                      RateYourDJ - RDS Status Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Load RDS configuration
if [ ! -f .env.rds ]; then
    echo -e "${RED}❌ Error: .env.rds file not found${NC}"
    exit 1
fi

export $(grep -v '^#' .env.rds | xargs)

if [ -z "$RDS_HOST" ] || [ -z "$RDS_USER" ] || [ -z "$RDS_PASSWORD" ] || [ -z "$RDS_DB_NAME" ]; then
    echo -e "${RED}❌ Error: Missing RDS configuration${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Configuration:${NC}"
echo "  Host:     $RDS_HOST"
echo "  Port:     ${RDS_PORT:-3306}"
echo "  Database: $RDS_DB_NAME"
echo "  User:     $RDS_USER"
echo ""

# Test connection
echo -e "${YELLOW}🔌 Testing connection...${NC}"
if ! mysql -h "$RDS_HOST" -P "${RDS_PORT:-3306}" -u "$RDS_USER" -p"$RDS_PASSWORD" -e "SELECT 1" >/dev/null 2>&1; then
    echo -e "${RED}❌ Connection failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Connected successfully${NC}"
echo ""

# Check if database exists
DB_EXISTS=$(mysql -h "$RDS_HOST" -P "${RDS_PORT:-3306}" -u "$RDS_USER" -p"$RDS_PASSWORD" -sN -e "SELECT COUNT(*) FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = '$RDS_DB_NAME'")

if [ "$DB_EXISTS" -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Database '$RDS_DB_NAME' does not exist${NC}"
    echo ""
    echo "Run sync-to-rds.sh to create and initialize the database"
    exit 0
fi

echo -e "${GREEN}✅ Database exists${NC}"
echo ""

# Show tables
echo -e "${YELLOW}📊 Tables:${NC}"
TABLE_COUNT=$(mysql -h "$RDS_HOST" -P "${RDS_PORT:-3306}" -u "$RDS_USER" -p"$RDS_PASSWORD" "$RDS_DB_NAME" -sN -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$RDS_DB_NAME'")
echo -e "  Total: ${GREEN}$TABLE_COUNT${NC}"
echo ""

mysql -h "$RDS_HOST" -P "${RDS_PORT:-3306}" -u "$RDS_USER" -p"$RDS_PASSWORD" "$RDS_DB_NAME" -e "
SELECT
  TABLE_NAME as 'Table',
  TABLE_ROWS as 'Rows',
  ROUND(DATA_LENGTH/1024/1024, 2) as 'Size (MB)'
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = '$RDS_DB_NAME'
ORDER BY TABLE_NAME
"
echo ""

# Check if migrations table exists
MIGRATIONS_EXISTS=$(mysql -h "$RDS_HOST" -P "${RDS_PORT:-3306}" -u "$RDS_USER" -p"$RDS_PASSWORD" "$RDS_DB_NAME" -sN -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$RDS_DB_NAME' AND table_name = 'schema_migrations'")

if [ "$MIGRATIONS_EXISTS" -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Migration tracking not set up${NC}"
    echo "  Run sync-to-rds.sh to initialize migration tracking"
else
    echo -e "${YELLOW}📝 Applied Migrations:${NC}"
    MIGRATION_COUNT=$(mysql -h "$RDS_HOST" -P "${RDS_PORT:-3306}" -u "$RDS_USER" -p"$RDS_PASSWORD" "$RDS_DB_NAME" -sN -e "SELECT COUNT(*) FROM schema_migrations")
    echo -e "  Total: ${GREEN}$MIGRATION_COUNT${NC}"
    echo ""

    mysql -h "$RDS_HOST" -P "${RDS_PORT:-3306}" -u "$RDS_USER" -p"$RDS_PASSWORD" "$RDS_DB_NAME" -e "
    SELECT
      id as 'ID',
      migration_name as 'Migration',
      applied_at as 'Applied At'
    FROM schema_migrations
    ORDER BY applied_at DESC
    LIMIT 10
    "
fi

echo ""

# Show pending migrations
echo -e "${YELLOW}📦 Pending Migrations:${NC}"

is_applied() {
    local migration=$1
    if [ "$MIGRATIONS_EXISTS" -eq 0 ]; then
        echo "0"
        return
    fi
    mysql -h "$RDS_HOST" -P "${RDS_PORT:-3306}" -u "$RDS_USER" -p"$RDS_PASSWORD" "$RDS_DB_NAME" -sN -e "SELECT COUNT(*) FROM schema_migrations WHERE migration_name = '$migration'" 2>/dev/null || echo "0"
}

PENDING_COUNT=0

# Check numbered migrations in migrations/ directory
if [ -d "migrations" ]; then
    for migration_file in $(find migrations -name '[0-9][0-9][0-9]_*.sql' -type f | sort); do
        migration=$(basename "$migration_file")
        if [ "$(is_applied "$migration")" -eq 0 ]; then
            echo -e "  ${BLUE}→${NC} $migration"
            ((PENDING_COUNT++))
        fi
    done
fi

if [ $PENDING_COUNT -eq 0 ]; then
    echo -e "  ${GREEN}✅ All migrations applied${NC}"
else
    echo ""
    echo -e "  ${YELLOW}Run ./scripts/sync-to-rds.sh to apply $PENDING_COUNT pending migration(s)${NC}"
fi

echo ""
echo -e "${GREEN}✨ Status check complete${NC}"
