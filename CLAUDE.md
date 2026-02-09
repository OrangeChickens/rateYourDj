# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## ⚠️ CRITICAL RULES - READ FIRST

**THESE RULES OVERRIDE ALL OTHER BEHAVIORS:**

1. **GIT PUSH POLICY - ABSOLUTELY FORBIDDEN TO AUTO-PUSH**
   - ✅ Always run `git add` and `git commit` when work is complete
   - ❌ **NEVER EVER run `git push` without explicit user approval**
   - ✅ After committing, ALWAYS say: "已提交到本地。需要我 push 到远程仓库吗？"
   - ✅ Only push when user explicitly says "push" / "推送" / "yes"
   - ⚠️ User has complained about this violation multiple times - THIS IS CRITICAL

2. **CONFIRMATION BEFORE DESTRUCTIVE OPERATIONS**
   - Always ask before: deleting files, force pushing, rebasing, resetting

3. **DATABASE MIGRATION POLICY - STRICT CONVENTIONS**
   - ❌ **NEVER create folders like `database_migrations/` or `db_changes/`**
   - ✅ **ALWAYS use existing `rateyourdj-backend/migrations/` folder**
   - ✅ **ALWAYS follow numbering: 001_xxx.sql, 002_xxx.sql, 003_xxx.sql**
   - ✅ **ALWAYS use `scripts/sync-to-rds.sh` for production deployment**
   - ⚠️ See "Database Migration Workflow" section below for complete process

---

## Project Overview

RateYourDJ is a full-stack DJ rating platform with a Node.js/Express backend and WeChat Mini-Program frontend. Users can browse DJs, write multi-dimensional reviews, and manage favorites.

**Tech Stack**:
- Backend: Node.js + Express 5 + MySQL 8 + JWT
- Frontend: WeChat Mini-Program (native JavaScript)
- Authentication: WeChat OAuth2 → JWT (7-day expiry)

---

## Design Style Guide

RateYourDJ follows a **Brutalism-inspired design aesthetic** modeled after [NTS Radio](https://www.nts.live), emphasizing functionality, clarity, and bold typography.

### Core Principles

1. **Functionality Over Decoration** - Every design element serves a purpose
2. **Bold Typography** - Heavy font weights and uppercase text for hierarchy
3. **Strict Grid System** - Consistent spacing using multiples of 16rpx (32, 48, 64)
4. **Maximum Contrast** - Black on white, no gradients or subtle colors
5. **Zero Decoration** - No rounded corners, no shadows, no ornamental elements

### Design Rules

#### Colors

**MANDATORY COLOR PALETTE:**
```css
/* Primary colors - ONLY use these */
#000000  /* Pure black - borders, text, buttons */
#FFFFFF  /* Pure white - backgrounds, inverted text */
#666666  /* Dark gray - secondary text */
#CCCCCC  /* Light gray - disabled states, empty stars */
#E0E0E0  /* Very light gray - subtle borders only */

/* NEVER USE: */
/* ❌ #FFD700 (gold/yellow) - removed */
/* ❌ #52C41A (green) - removed */
/* ❌ #FF4D4F (red) - removed */
/* ❌ Any gradients, shadows, or semi-transparent colors */
```

#### Typography

```css
/* All text should be bold and uppercase for emphasis */
.text-primary {
  color: #000000;
  font-weight: 700;  /* Always 600-700, never below 500 */
  text-transform: uppercase;  /* All titles and labels */
  letter-spacing: 0.5rpx;  /* Increase readability */
}

/* Font sizes - larger than typical apps */
.title-large {
  font-size: 48rpx;  /* Major headings */
  font-weight: 700;
  letter-spacing: 0.5rpx;
}

.title-medium {
  font-size: 32rpx;  /* Section headers */
  font-weight: 700;
  letter-spacing: 0.5rpx;
}

.text-body {
  font-size: 26rpx;  /* Body text */
  font-weight: 500;
}

.text-small {
  font-size: 20-22rpx;  /* Captions, labels */
  font-weight: 600;
}
```

#### Spacing

```css
/* Use multiples of 16rpx for ALL spacing */
/* Small spacing: 16rpx, 24rpx */
/* Medium spacing: 32rpx, 48rpx */
/* Large spacing: 64rpx, 80rpx */

.container {
  padding: 48rpx 32rpx;  /* Standard page padding */
}

.card {
  padding: 48rpx;  /* Card internal padding */
  margin-bottom: 32rpx;  /* Card separation */
  gap: 32rpx;  /* Elements inside card */
}

.section-header {
  margin-bottom: 48rpx;  /* After headers */
  padding-bottom: 24rpx;  /* Before border */
}
```

#### Borders & Corners

```css
/* ALWAYS use sharp corners and bold borders */
.card,
.button,
.input,
.tag {
  border-radius: 0;  /* NEVER use rounded corners */
  border: 2rpx solid #000;  /* Standard border */
}

.section-divider {
  border-bottom: 3rpx solid #000;  /* Emphasis borders */
}

.subtle-border {
  border-bottom: 2rpx solid #E0E0E0;  /* Only for internal divisions */
}
```

#### Buttons

```css
/* Primary button - black background */
.btn-primary {
  padding: 32rpx;
  background-color: #000;
  color: #FFF;
  font-size: 28rpx;
  font-weight: 700;
  border: 2rpx solid #000;
  border-radius: 0;
  text-transform: uppercase;
  letter-spacing: 1rpx;
}

/* Secondary button - white background */
.btn-secondary {
  padding: 32rpx;
  background-color: #FFF;
  color: #000;
  font-size: 28rpx;
  font-weight: 700;
  border: 2rpx solid #000;
  border-radius: 0;
  text-transform: uppercase;
  letter-spacing: 1rpx;
}

/* Disabled button */
.btn-disabled {
  background-color: #E0E0E0;
  color: #666;
  border-color: #E0E0E0;
}
```

#### Tags

```css
.tag {
  padding: 12rpx 24rpx;
  background-color: #FFF;
  color: #000;
  font-size: 20rpx;
  font-weight: 700;
  border: 2rpx solid #000;
  border-radius: 0;
  text-transform: uppercase;
  letter-spacing: 0.5rpx;
}

.tag.selected {
  background-color: #000;
  color: #FFF;
}
```

#### Cards

```css
.dj-card,
.review-card {
  background-color: #FFF;
  border: 2rpx solid #000;
  border-radius: 0;
  padding: 48rpx;
  gap: 32rpx;
}

/* NO shadows, NO gradients, NO rounded corners */
```

#### Images

```css
.avatar,
.dj-photo {
  border-radius: 0;  /* Square, not circular */
  border: 2rpx solid #000;
  background-color: #F0F0F0;
}
```

#### Icons & Emoji

**CRITICAL RULE: NO EMOJI (except 👍 for "like" actions and ★ for ratings)**

```css
/* Replace emoji with uppercase text labels */
/* ❌ 🔍 → ✅ "SEARCH" */
/* ❌ 📍 → ✅ Remove or use "CITY" */
/* ❌ 🎵 → ✅ "HOME" */
/* ❌ ♥️ → ✅ "FAV" */
/* ❌ ⚠️ → ✅ "!" */

/* Allowed symbols only: */
/* ✅ ★ ☆ (rating stars) */
/* ✅ 👍 (like action) */
/* ✅ › ▼ (UI indicators) */
/* ✅ × (close/clear) */
```

#### Rating Display

```css
/* Ratings should be large, bold, and black */
.rating-number {
  font-size: 64rpx;
  font-weight: 700;
  color: #000;  /* NO colored backgrounds */
  letter-spacing: -1rpx;
}

.rating-stars .star {
  color: #000;  /* Black, not gold */
}

.rating-stars .star.empty {
  color: #CCCCCC;
}
```

### WXSS Implementation Template

```css
/* Complete page example following all rules */
.container {
  min-height: 100vh;
  background-color: #FFFFFF;
  padding: 48rpx 32rpx;
}

.page-header {
  padding: 64rpx 48rpx;
  border-bottom: 3rpx solid #000;
}

.page-title {
  font-size: 48rpx;
  font-weight: 700;
  color: #000;
  text-transform: uppercase;
  letter-spacing: 0.5rpx;
  margin-bottom: 24rpx;
}

.section {
  margin-bottom: 64rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 48rpx;
  padding-bottom: 24rpx;
  border-bottom: 3rpx solid #000;
}

.section-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #000;
  text-transform: uppercase;
  letter-spacing: 0.5rpx;
}

.card-list {
  display: flex;
  flex-direction: column;
  gap: 32rpx;
}

.card {
  background: #FFF;
  border: 2rpx solid #000;
  border-radius: 0;
  padding: 48rpx;
}

.card-title {
  font-size: 36rpx;
  font-weight: 700;
  color: #000;
  text-transform: uppercase;
  letter-spacing: 0.5rpx;
  margin-bottom: 24rpx;
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.label {
  font-size: 22rpx;
  font-weight: 700;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5rpx;
}

.value {
  font-size: 26rpx;
  font-weight: 500;
  color: #000;
}

.button {
  padding: 32rpx;
  background-color: #000;
  color: #FFF;
  font-size: 28rpx;
  font-weight: 700;
  border: 2rpx solid #000;
  border-radius: 0;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 1rpx;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.tag {
  padding: 12rpx 24rpx;
  background-color: #FFF;
  color: #000;
  font-size: 20rpx;
  font-weight: 700;
  border: 2rpx solid #000;
  border-radius: 0;
  text-transform: uppercase;
  letter-spacing: 0.5rpx;
}

.tag.active {
  background-color: #000;
  color: #FFF;
}

/* Loading and empty states */
.loading,
.empty-state {
  text-align: center;
  padding: 160rpx 0;
}

.loading-text,
.empty-text {
  font-size: 26rpx;
  font-weight: 700;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 1rpx;
}
```

### Before & After Examples

#### ❌ OLD STYLE (Do NOT use)
```css
.button {
  background-color: #FFD700;  /* Gold color */
  color: #000;
  border-radius: 12rpx;  /* Rounded corners */
  font-size: 28rpx;
  font-weight: 600;
  padding: 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.1);  /* Shadow */
}

.card {
  border-radius: 16rpx;  /* Rounded */
  padding: 30rpx;  /* Non-standard spacing */
}

.icon {
  content: '🔍';  /* Emoji */
}
```

#### ✅ NEW STYLE (Correct)
```css
.button {
  background-color: #000;  /* Pure black */
  color: #FFF;
  border: 2rpx solid #000;
  border-radius: 0;  /* Sharp corners */
  font-size: 28rpx;
  font-weight: 700;  /* Bolder */
  padding: 32rpx;  /* Multiple of 16 */
  text-transform: uppercase;
  letter-spacing: 1rpx;
}

.card {
  border: 2rpx solid #000;
  border-radius: 0;
  padding: 48rpx;  /* Multiple of 16 */
}

.icon {
  content: 'SEARCH';  /* Text label */
  font-size: 20rpx;
  font-weight: 700;
  text-transform: uppercase;
}
```

### Common Mistakes to Avoid

1. ❌ Using `border-radius: 12rpx` → ✅ Always use `border-radius: 0`
2. ❌ Using colored ratings (green/yellow/red) → ✅ Use black only
3. ❌ Using emoji icons 🔍 📍 → ✅ Use text labels "SEARCH" "CITY"
4. ❌ Using font-weight: 400-500 → ✅ Use 600-700 minimum
5. ❌ Using padding: 20rpx → ✅ Use multiples of 16 (32rpx, 48rpx)
6. ❌ Using box-shadow → ✅ Use solid borders only
7. ❌ Lowercase labels → ✅ Use uppercase with letter-spacing
8. ❌ #FFD700 gold color → ✅ Use #000 black

### Design Philosophy

> "Design should be like a DJ set - stripped down to essentials, with maximum impact through rhythm and contrast, not decoration."

This aesthetic prioritizes:
- **Legibility** over prettiness
- **Boldness** over subtlety
- **Function** over form
- **Contrast** over harmony
- **Directness** over decoration

---

## Common Commands

### Backend Development

```bash
# Navigate to backend
cd rateyourdj-backend

# Install dependencies
npm install

# Start development server (nodemon watches src/)
npm run dev

# Database setup (Docker)
docker compose up -d

# Import database schema
mysql -u root -p < database.sql

# Test health endpoint
curl http://localhost:3000/health
```

### Frontend Development

```bash
# Open in WeChat Developer Tools
# Select directory: rateyourdj-miniprogram/

# No build step required - WeChat DevTools handles compilation
# Save files → Auto-refresh in simulator
```

### Database Management

```bash
# Connect to MySQL
mysql -u root -p rateyourdj

# Common queries
SELECT * FROM djs LIMIT 10;
SELECT * FROM reviews WHERE dj_id = 1 ORDER BY created_at DESC;
```

### Database Migration Workflow

**CRITICAL: Follow this exact process for ALL database schema changes.**

#### 📁 File Structure

```
rateyourdj-backend/
├── migrations/                           # ✅ Migration files directory
│   ├── 001_add_comments.sql             # Example: first migration
│   ├── 002_create_reviewer_invite_code.sql  # Example: second migration
│   └── 003_your_new_migration.sql       # Your new migration
├── scripts/
│   └── sync-to-rds.sh                   # ✅ RDS deployment script
└── database.sql                          # Initial schema (DO NOT modify for changes)
```

#### ✅ CORRECT Process for Database Changes

**Step 1: Create numbered migration file**

```bash
cd rateyourdj-backend/migrations/

# Check existing migrations
ls -1 [0-9][0-9][0-9]_*.sql
# Output: 001_add_comments.sql, 002_create_reviewer_invite_code.sql

# Create next numbered migration (003 in this example)
touch 003_add_user_badges.sql
```

**Step 2: Write migration SQL**

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

**Step 3: Test locally**

```bash
# Local testing
mysql -u root -p rateyourdj < migrations/003_add_user_badges.sql

# Verify
mysql -u root -p rateyourdj -e "SHOW TABLES LIKE 'user_badges';"
```

**Step 4: Deploy to production (RDS)**

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

**Step 5: Commit to git**

```bash
git add migrations/003_add_user_badges.sql
git commit -m "Migration: Add user badges system (003)"
# ⚠️ STOP - Ask user before pushing
```

#### ❌ WRONG Practices (NEVER DO THIS)

```bash
# ❌ Creating custom migration folders
mkdir database_migrations/
mkdir db_changes/
mkdir schema_updates/

# ❌ Random file naming
touch add_badges.sql
touch new_table.sql
touch update_schema_v2.sql

# ❌ Modifying database.sql directly for changes
# (database.sql is ONLY for initial setup)

# ❌ Manual SQL execution on RDS without tracking
mysql -h rds-host -u user -p database < random_changes.sql
```

#### 🔍 Migration Tracking System

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

#### 📋 Migration Naming Convention

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

#### 🚨 Emergency Rollback

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

#### 💡 Tips

1. **Always test locally first** before deploying to RDS
2. **One migration per logical change** (don't combine unrelated changes)
3. **Include comments** in SQL files (purpose, date, author)
4. **Add verification queries** at the end of migration files
5. **Never edit applied migrations** - create a new migration to fix issues
6. **Keep migrations idempotent** when possible (use `IF NOT EXISTS`, `ON DUPLICATE KEY UPDATE`)

#### 📚 Further Reading

- Migration guide: `rateyourdj-backend/migrations/README.md`
- RDS sync documentation: `rateyourdj-backend/scripts/README-SYNC.md`
- Full RDS setup: `rateyourdj-backend/scripts/RDS-SYNC.md`

### Git Workflow

**IMPORTANT: Always ask before pushing to remote repository.**

```bash
# Make changes and stage files
git add -A

# Commit with descriptive message
git commit -m "Your commit message"

# ⚠️ STOP HERE - Ask user before pushing
# DO NOT run 'git push' automatically

# After user approval:
git push
```

**Rules:**
- ✅ Commit changes automatically when user confirms the work
- ❌ NEVER push to remote without asking user first
- ✅ Show commit summary and ask: "Ready to push?"
- ✅ Wait for explicit user confirmation before running `git push`

---

## Architecture Overview

### Backend Structure

```
rateyourdj-backend/
├── src/
│   ├── app.js              # Express app entry (middleware, routes, error handling)
│   ├── config/
│   │   ├── database.js     # MySQL pool configuration (mysql2/promise)
│   │   └── wechat.js       # WeChat API credentials
│   ├── controllers/        # Request handlers (auth, dj, review, user, tags)
│   ├── models/             # Database query methods (static class pattern)
│   ├── routes/             # Express routers (mounted at /api prefix)
│   ├── middleware/
│   │   ├── auth.js         # JWT verification (authenticate, optionalAuth)
│   │   └── errorHandler.js # Global error catch + 404 handler
│   ├── services/
│   │   ├── wechatService.js # code2Session (OAuth exchange)
│   │   └── ratingService.js # updateDJRatings (aggregation)
│   └── utils/
│       └── jwt.js          # Token generation/verification
├── database.sql            # Schema with 8 tables, indexes, 20 preset tags
├── docker-compose.yml      # MySQL 8.0 container
└── .env                    # Environment variables (DB, JWT, WeChat)
```

**Key Routes** (all mounted at `/api`):
- `/auth/login` (POST) - WeChat code exchange → JWT
- `/dj/*` - List, detail, search, hot, cities
- `/review/*` - Create, list, delete, helpful, report
- `/user/*` - Profile, favorites, reviews, search history
- `/tags/*` - Presets, DJ tags

**Middleware Chain**:
```
Request → CORS → JSON parser → Routes → authenticate (if required) → Controller → Model → Response
         ↓ (errors)
    errorHandler → JSON error response
```

### Frontend Structure

```
rateyourdj-miniprogram/
├── app.js                  # Global state (userInfo, token), login/logout, unified request
├── app.json                # Page routing, TabBar, window config
├── app.wxss                # Global styles (buttons, cards, tags, rating stars)
├── pages/
│   ├── index/              # Home with hot DJs
│   ├── dj-detail/          # DJ profile + reviews (sortable, paginated)
│   ├── review-create/      # Multi-dimensional rating form
│   ├── search/             # DJ search with history + hot searches
│   ├── my-favorites/       # Bookmarked DJs
│   ├── settings/           # Language, clear cache, logout
│   └── city-list/          # City selection with DJ counts
├── components/
│   └── rating-stars/       # Reusable star rating component (display + interactive)
├── utils/
│   ├── api.js              # API wrappers (djAPI, reviewAPI, userAPI, tagAPI)
│   ├── util.js             # Helpers (toast, date, debounce, login check, star generation)
│   └── i18n.js             # Internationalization singleton
├── i18n/
│   ├── zh-CN.js            # Chinese translations
│   └── en-US.js            # English translations
└── images/                 # TabBar icons, default avatars
```

**Page Lifecycle Pattern**:
```javascript
Page({
  data: { /* UI state */ },
  onLoad(options) { /* Fetch data, update language */ },
  onShow() { /* Resume, check login */ },
  onPullDownRefresh() { /* Refresh data */ },
  onReachBottom() { /* Load more (pagination) */ }
})
```

---

## Critical System Interactions

### Authentication Flow

```
1. WeChat Client
   ├─ wx.login() → gets temporary code (5min expiry)
   └─ wx.getUserProfile() → gets nickname, avatar

2. Backend Exchange
   ├─ POST /api/auth/login { code, userInfo }
   ├─ wechatService.code2Session(code) → openid from WeChat API
   ├─ User.findByOpenid() OR User.create()
   └─ generateToken({ userId, openid }, '7d') → JWT

3. Client Storage
   ├─ app.globalData.token = jwt
   ├─ app.globalData.userInfo = { id, nickname, avatar_url }
   └─ wx.setStorageSync('token', jwt)

4. Subsequent Requests
   ├─ app.request({ url, needAuth: true })
   ├─ Header: Authorization: Bearer <token>
   └─ Backend: authenticate middleware → verifyToken → req.user
```

**Token Expiry Handling**:
- Backend returns 401 → Frontend calls `app.logout()` → Redirects to home
- User must re-login via WeChat OAuth

### Rating Aggregation Pipeline

**Trigger Points**:
1. Review creation (`reviewController.createReview`)
2. Review deletion (`reviewController.deleteReview`)
3. Review status change (admin approval/rejection)

**Calculation Flow** (`ratingService.updateDJRatings`):
```javascript
// 1. Fetch all approved reviews for DJ
const reviews = await Review.findByDJId(djId, { status: 'approved' })

// 2. Calculate averages (4 dimensions)
const avgOverall = average(reviews.map(r => r.overall_rating))
const avgSet = average(reviews.map(r => r.set_rating))
const avgPerformance = average(reviews.map(r => r.performance_rating))
const avgPersonality = average(reviews.map(r => r.personality_rating))

// 3. Calculate "would choose again" percentage
const wouldChooseCount = reviews.filter(r => r.would_choose_again).length
const wouldChoosePercent = (wouldChooseCount / reviews.length) * 100

// 4. Update DJ record
await DJ.updateRatings(djId, {
  overall_rating: avgOverall,
  set_rating: avgSet,
  performance_rating: avgPerformance,
  personality_rating: avgPersonality,
  review_count: reviews.length,
  would_choose_again_percent: wouldChoosePercent
})
```

**Why Aggregated?**
- Avoids N+1 queries when listing DJs
- Consistent ratings across all displays
- Triggers after every review mutation

### Transaction Safety Pattern

Used in `Review.create()` and `Review.interact()`:

```javascript
const connection = await pool.getConnection()
await connection.beginTransaction()

try {
  // Multiple related operations
  await connection.query('INSERT INTO reviews ...')
  const reviewId = connection.lastInsertId

  await connection.query('INSERT INTO review_tags ...')
  await connection.query('UPDATE preset_tags SET usage_count = usage_count + 1 ...')

  await connection.commit()
} catch (error) {
  await connection.rollback()
  throw error
} finally {
  connection.release()
}
```

**Ensures**:
- Atomicity: All or nothing
- Prevents orphaned review_tags
- Maintains tag usage_count integrity

### Pagination Pattern (Frontend + Backend)

**Backend** (`DJ.getList`, `Review.findByDJId`):
```javascript
const offset = (page - 1) * limit
const [rows] = await pool.query(
  'SELECT * FROM table WHERE ... LIMIT ? OFFSET ?',
  [limit, offset]
)

const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM ...')

return {
  data: rows,
  pagination: {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit)
  }
}
```

**Frontend** (example in `dj-detail.js`):
```javascript
data: {
  currentPage: 1,
  hasMore: true,
  reviews: []
},

async loadReviews(append = false) {
  const page = append ? this.data.currentPage + 1 : 1
  const res = await reviewAPI.getList(djId, { page, limit: 10 })

  this.setData({
    reviews: append ? [...this.data.reviews, ...res.data] : res.data,
    currentPage: page,
    hasMore: page < res.pagination.totalPages
  })
},

onReachBottom() {
  if (this.data.hasMore) {
    this.loadReviews(true)
  }
}
```

### Internationalization System

**Structure**:
```javascript
// i18n/zh-CN.js
export default {
  common: { loading: '加载中...', submit: '提交' },
  home: { searchPlaceholder: '搜索DJ名称、城市或厂牌' },
  djDetail: { reviews: '条评论', writeReview: '写评价' }
  // 150+ keys across 10 modules
}

// Usage in pages
import i18n from '../../utils/i18n'
const placeholder = i18n.t('home.searchPlaceholder')
```

**Language Switching** (`settings` page):
```javascript
i18n.setLanguage('en-US')  // Updates storage + reloads text
this.updateLanguage()      // Refreshes page text
```

**Nested Path Access**:
```javascript
// Supports dot notation
i18n.t('djDetail.sortNewest')  // → "最新评论"
```

---

## Database Schema Key Points

### 8 Tables Overview

1. **users** - WeChat authentication
   - `wx_openid` (unique) - Primary identifier for login
   - `wx_unionid` (nullable) - Cross-app identifier

2. **djs** - DJ profiles + aggregated ratings
   - **Indexed**: `city`, `name`, `overall_rating`
   - **Full-text**: `name` (for search optimization)
   - **Stored aggregations**: `overall_rating`, `review_count`, `would_choose_again_percent`

3. **reviews** - User submissions
   - **Constraints**: ratings CHECK (1-5)
   - **Status**: 'pending' (default), 'approved', 'rejected'
   - **Interactions**: `helpful_count`, `not_helpful_count`, `report_count`
   - **Indexed**: `dj_id`, `user_id`, `created_at`

4. **review_tags** - Many-to-many (reviews ↔ tags)
   - Composite PK: `(review_id, tag_name)`

5. **preset_tags** - Global tag library
   - **Categories**: 'style', 'performance', 'personality'
   - **20 predefined tags** inserted at schema creation
   - `usage_count` incremented on tag selection

6. **favorites** - User bookmarks
   - Unique constraint: `(user_id, dj_id)`

7. **review_interactions** - Vote system
   - **Types**: 'helpful', 'not_helpful', 'report'
   - Unique constraint: `(review_id, user_id, interaction_type)`
   - Toggle logic: INSERT or DELETE

8. **search_history** - User search tracking
   - Auto-updates `last_searched_at` on duplicate keyword

### Critical Indexes

```sql
-- DJ browsing
INDEX idx_dj_city (city)
INDEX idx_dj_rating (overall_rating DESC)

-- Review listing
INDEX idx_review_dj (dj_id, created_at DESC)
INDEX idx_review_user (user_id)

-- Authentication
UNIQUE INDEX idx_user_openid (wx_openid)
```

---

## API Request/Response Patterns

### Standard Response Format

```javascript
// Success
{
  success: true,
  data: {...} or [...],
  pagination?: { page, limit, total, totalPages }
}

// Error
{
  success: false,
  message: "Error description",
  error?: "Stack trace" (dev only)
}
```

### Authentication Header

```javascript
// Protected endpoints require:
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// Frontend automatically adds via app.request({ needAuth: true })
```

### Sorting & Filtering

```javascript
// DJ List
GET /api/dj/list?city=上海&sort=overall_rating&order=DESC&page=1&limit=20

// Review List (sortable)
GET /api/review/list/:djId?sort=helpful_count&order=DESC&page=1&limit=10
// Allowed sort fields: created_at, helpful_count, overall_rating
```

---

## Environment Configuration

### Backend (.env)

```bash
# Required variables
PORT=3000
NODE_ENV=development

# Database (must match docker-compose.yml or local MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=rateyourdj123
DB_NAME=rateyourdj

# JWT (change in production!)
JWT_SECRET=dev-secret-key-please-change-in-production
JWT_EXPIRES_IN=7d

# WeChat (obtain from WeChat Mini-Program console)
WECHAT_APP_ID=your-wechat-app-id
WECHAT_APP_SECRET=your-wechat-app-secret
```

### Frontend (app.js)

```javascript
globalData: {
  apiBaseUrl: 'http://localhost:3000/api'  // Development
  // apiBaseUrl: 'https://api.rateyourdj.com/api'  // Production
}
```

**Important**: WeChat requires HTTPS in production. Use `https://` for `apiBaseUrl` and configure WeChat whitelist.

---

## Key Development Patterns

### Model Query Pattern

All models use **static methods** with direct SQL queries:

```javascript
// Example: DJ.getList()
class DJ {
  static async getList({ city, style, sort = 'overall_rating', order = 'DESC', page = 1, limit = 20 }) {
    // Build WHERE clause dynamically
    const conditions = []
    const params = []

    if (city && city !== '全部城市') {
      conditions.push('city = ?')
      params.push(city)
    }

    // Construct query
    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const query = `SELECT * FROM djs ${whereClause} ORDER BY ${sort} ${order} LIMIT ? OFFSET ?`

    const [rows] = await pool.query(query, [...params, limit, offset])
    return { data: rows, pagination: {...} }
  }
}
```

**Pattern Benefits**:
- Simple, testable
- No ORM overhead
- Direct SQL control

### Frontend API Wrapper Pattern

```javascript
// utils/api.js
export const djAPI = {
  getList: (params) => app.request({ url: '/dj/list', method: 'GET', data: params }),
  getDetail: (id) => app.request({ url: `/dj/${id}`, method: 'GET' }),
  search: (keyword, page, limit) => app.request({
    url: '/dj/search/query',
    method: 'GET',
    data: { keyword, page, limit }
  })
}

// Usage in pages
import { djAPI } from '../../utils/api'
const res = await djAPI.getList({ city: '上海', page: 1 })
```

**Centralized Benefits**:
- Single source of truth for endpoints
- Easy to update API versions
- Type-safe interface (via JSDoc if added)

### Error Handling Pattern

```javascript
// Backend: Controllers wrap with try-catch
try {
  const result = await DJ.getList(filters)
  res.json({ success: true, data: result.data, pagination: result.pagination })
} catch (error) {
  next(error)  // Passes to errorHandler middleware
}

// Frontend: Pages handle promises
djAPI.getList().then(res => {
  if (res.success) {
    this.setData({ djList: res.data })
  } else {
    showToast(res.message)
  }
}).catch(error => {
  console.error(error)
  showToast(i18n.t('error.loadFailed'))
})
```

---

## Testing the System

### Backend Health Check

```bash
# 1. Server running?
curl http://localhost:3000/health
# Expected: { status: 'ok', timestamp: '...' }

# 2. Database connected?
# Check console: "Database connected successfully"

# 3. Test public endpoint
curl http://localhost:3000/api/dj/list?limit=5

# 4. Test authenticated endpoint (requires token)
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/user/profile
```

### Frontend Testing

1. **WeChat DevTools Simulator**:
   - Open Console for errors
   - Network tab for API calls
   - Storage tab for token/userInfo

2. **Real Device Testing**:
   - Requires WeChat official account
   - Scan QR code in DevTools
   - Test on iOS + Android

3. **Key Flows to Test**:
   - Login → Browse DJs → View detail
   - Write review → See updated rating
   - Favorite DJ → View in favorites
   - Switch language → All text updates

---

## Common Development Issues

### Backend: Database Connection Errors

```javascript
// Error: "connect ECONNREFUSED 127.0.0.1:3306"
// Fix: Ensure MySQL is running
docker compose up -d

// Error: "Access denied for user 'root'@'localhost'"
// Fix: Check .env credentials match docker-compose.yml
```

### Backend: JWT Token Issues

```javascript
// Error: "jwt malformed"
// Cause: Token not in "Bearer <token>" format
// Fix: Ensure Authorization header is correctly formatted

// Error: "jwt expired"
// Cause: Token older than 7 days
// Fix: Frontend handles via 401 → logout → re-login
```

### Frontend: API Request Failures

```javascript
// Error: "request:fail url not in domain list"
// Cause: WeChat domain whitelist not configured
// Fix: DevTools → Settings → "不校验合法域名" (disable for dev)

// Error: "request:fail timeout"
// Cause: Backend not running or wrong apiBaseUrl
// Fix: Check app.js apiBaseUrl + backend server status
```

### Frontend: Login Loop

```javascript
// Symptom: Redirects to login after every action
// Cause: Token not persisted in storage
// Fix: Check wx.setStorageSync('token', jwt) is called after login
```

---

## Code Modification Guidelines

### Adding a New API Endpoint

1. **Backend**:
   ```javascript
   // routes/dj.js
   router.get('/trending', djController.getTrendingDJs)

   // controllers/djController.js
   exports.getTrendingDJs = async (req, res, next) => {
     try {
       const result = await DJ.getTrending()
       res.json({ success: true, data: result })
     } catch (error) {
       next(error)
     }
   }

   // models/DJ.js
   static async getTrending() {
     const query = 'SELECT * FROM djs WHERE review_count > 10 ORDER BY overall_rating DESC LIMIT 20'
     const [rows] = await pool.query(query)
     return rows
   }
   ```

2. **Frontend**:
   ```javascript
   // utils/api.js
   export const djAPI = {
     // ...existing methods
     getTrending: () => app.request({ url: '/dj/trending', method: 'GET' })
   }

   // pages/index/index.js
   async loadTrendingDJs() {
     const res = await djAPI.getTrending()
     this.setData({ trendingDJs: res.data })
   }
   ```

### Adding a New Database Table

1. **Create migration SQL**:
   ```sql
   CREATE TABLE new_table (
     id INT PRIMARY KEY AUTO_INCREMENT,
     user_id INT NOT NULL,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     FOREIGN KEY (user_id) REFERENCES users(id)
   );
   ```

2. **Create model**:
   ```javascript
   // models/NewTable.js
   const pool = require('../config/database')

   class NewTable {
     static async create(data) {
       const [result] = await pool.query('INSERT INTO new_table SET ?', data)
       return result.insertId
     }
   }

   module.exports = NewTable
   ```

3. **Use in controller**:
   ```javascript
   const NewTable = require('../models/NewTable')

   exports.createItem = async (req, res, next) => {
     try {
       const id = await NewTable.create(req.body)
       res.json({ success: true, data: { id } })
     } catch (error) {
       next(error)
     }
   }
   ```

### Adding Internationalization Text

1. **Add to language files**:
   ```javascript
   // i18n/zh-CN.js
   export default {
     // ...existing
     newFeature: {
       title: '新功能',
       description: '这是新功能描述'
     }
   }

   // i18n/en-US.js
   export default {
     // ...existing
     newFeature: {
       title: 'New Feature',
       description: 'This is the new feature description'
     }
   }
   ```

2. **Use in pages**:
   ```javascript
   import i18n from '../../utils/i18n'

   Page({
     data: { texts: {} },
     onLoad() {
       this.setData({
         texts: {
           title: i18n.t('newFeature.title'),
           description: i18n.t('newFeature.description')
         }
       })
     }
   })
   ```

---

## Performance Considerations

### Backend Query Optimization

- **Use LIMIT**: Always paginate large result sets
- **Index columns**: Add indexes for WHERE/ORDER BY columns
- **Avoid N+1**: Pre-aggregate ratings instead of calculating on-the-fly
- **Connection pooling**: Already configured (10 connections max)

### Frontend Optimization

- **Debounce search**: 500ms delay prevents excessive API calls
- **Cache static data**: Store cities list in `globalData` after first load
- **Lazy load images**: Use `lazy-load` attribute on `<image>` tags
- **Throttle scroll events**: Limit `onReachBottom` triggers

### Database Indexes Already Created

```sql
-- Critical indexes for performance
idx_dj_city         -- City filtering on DJ list
idx_dj_rating       -- Sorting by rating
idx_review_dj       -- Loading reviews for DJ detail
idx_user_openid     -- Fast login lookup
```

---

## Security Notes

### JWT Token Storage

- **Frontend**: Stored in `wx.storage` (encrypted by WeChat)
- **Backend**: Not stored (stateless verification)
- **Expiry**: 7 days (balance UX vs security)

### WeChat OAuth Security

- **Code expiry**: 5 minutes (WeChat enforced)
- **One-time use**: Code cannot be reused
- **Secret protection**: `WECHAT_APP_SECRET` must stay server-side

### SQL Injection Prevention

- **Parameterized queries**: All queries use `?` placeholders
  ```javascript
  pool.query('SELECT * FROM djs WHERE city = ?', [city])  // Safe
  pool.query(`SELECT * FROM djs WHERE city = '${city}'`)  // Unsafe!
  ```

### Input Validation

- **Rating constraints**: MySQL CHECK ensures 1-5 range
- **Tag limits**: Frontend enforces max 5 tags per review
- **Comment length**: Max 500 characters (frontend + database)

---

## Documentation References

- **Backend API**: `rateyourdj-backend/API.md` (full endpoint documentation)
- **Database Schema**: `rateyourdj-backend/database.sql` (complete with comments)
- **Backend Setup**: `rateyourdj-backend/SETUP.md` (installation guide)
- **Frontend README**: `rateyourdj-miniprogram/README.md` (complete setup guide)
- **Completion Report**: `MINIPROGRAM_COMPLETION_REPORT.md` (development status)

---

## Project Status

- **Backend**: 100% complete (all core APIs implemented)
- **Frontend**: 95% complete (missing TabBar icons only)
- **Database**: Production-ready (8 tables, indexed)
- **Documentation**: Comprehensive (5 markdown files)

**Next Steps**:
1. Add TabBar icons (`images/README.md` has instructions)
2. Configure WeChat AppID in `project.config.json`
3. Test all flows end-to-end
4. Deploy backend to production server
5. Submit for WeChat review
