# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## CRITICAL RULES - READ FIRST

**THESE RULES OVERRIDE ALL OTHER BEHAVIORS:**

1. **CONFIRMATION BEFORE DESTRUCTIVE OPERATIONS**
   - Always ask before: deleting files, force pushing, rebasing, resetting

2. **DATABASE MIGRATION POLICY - STRICT CONVENTIONS**
   - NEVER create folders like `database_migrations/` or `db_changes/`
   - ALWAYS use existing `rateyourdj-backend/migrations/` folder
   - ALWAYS follow numbering: 001_xxx.sql, 002_xxx.sql, 003_xxx.sql
   - ALWAYS use `scripts/sync-to-rds.sh` for production deployment
   - Full process: `docs/migration-guide.md`

---

## Project Overview

RateYourDJ is a full-stack DJ rating platform with a Node.js/Express backend and WeChat Mini-Program frontend. Users can browse DJs, write multi-dimensional reviews, and manage favorites.

**Tech Stack**:
- Backend: Node.js + Express 5 + MySQL 8 + JWT
- Frontend: WeChat Mini-Program (native JavaScript)
- Authentication: WeChat OAuth2 -> JWT (7-day expiry)

---

## Design Style Guide

Brutalism-inspired aesthetic modeled after [NTS Radio](https://www.nts.live). Key rules:
- **Colors**: Only #000, #FFF, #666, #CCC, #E0E0E0. No gold, green, red, gradients, or shadows.
- **Typography**: font-weight 600-700, uppercase labels, letter-spacing 0.5-1rpx
- **Spacing**: Multiples of 16rpx only (32, 48, 64)
- **Borders**: `border-radius: 0` always, `border: 2rpx solid #000`
- **Icons**: No emoji (except stars/thumbs-up). Use uppercase text labels.

Full design system with CSS examples: `docs/design-guide.md`

---

## Common Commands

### Backend
```bash
cd rateyourdj-backend
npm install          # Install dependencies
npm run dev          # Start dev server (nodemon)
docker compose up -d # Start MySQL
curl http://localhost:3000/health
```

### Frontend
```bash
# Open rateyourdj-miniprogram/ in WeChat Developer Tools
# No build step — save files to auto-refresh
```

### Database
```bash
mysql -u root -p rateyourdj  # Connect locally
```

---

## Git Workflow

### GitHub PR flow
```bash
git checkout -b feature/<name>
# ... develop ...
git add <files> && git commit
git push -u origin feature/<name>
gh pr create --title "..." --body "..."
# After review and approved: gh pr merge --squash --delete-branch  #do not run this without approval
```

Branch naming: `feature/<name>` or `fix/<description>`. Never commit directly to main/master.

---

## Development Verification Flow

Full process documented in `docs/dev-workflow.md`. Summary:
1. Create feature branch (both frontend and backend)
2. Develop -> commit -> PR
3. Code review -> Jort approves -> merge
4. Backend: asks if deployed to integ completed -> API test
5. Frontend: upload trial version -> Jort manual test on phone
6. Fix issues if any -> re-verify

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
- `/auth/login` (POST) - WeChat code exchange -> JWT
- `/dj/*` - List, detail, search, hot, cities
- `/review/*` - Create, list, delete, helpful, report
- `/user/*` - Profile, favorites, reviews, search history
- `/tags/*` - Presets, DJ tags

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

For detailed system interactions (auth flow, rating pipeline, pagination, i18n, transactions), dev patterns, API conventions, env config, testing, and code modification guides: `docs/architecture.md`

---

## Database Schema (Summary)

8 tables: `users`, `djs`, `reviews`, `review_tags`, `preset_tags`, `favorites`, `review_interactions`, `search_history`. Key indexes on `dj.city`, `dj.overall_rating`, `review.dj_id`, `user.wx_openid`. Full schema: `rateyourdj-backend/database.sql`. Detailed docs: `docs/architecture.md`

---

## Security (Summary)

- All SQL uses parameterized queries (`?` placeholders) — never string interpolation
- JWT stored in `wx.storage`, 7-day expiry, stateless verification
- WeChat `APP_SECRET` stays server-side only
- Rating 1-5 enforced by MySQL CHECK, max 5 tags/review, max 500 char comments

---

## Documentation References

- **Design System**: `docs/design-guide.md` (full CSS reference)
- **Architecture**: `docs/architecture.md` (auth flow, patterns, DB schema, API, testing)
- **Migration Guide**: `docs/migration-guide.md` (step-by-step DB changes)
- **Backend API**: `rateyourdj-backend/API.md` (full endpoint documentation)
- **Database Schema**: `rateyourdj-backend/database.sql` (complete with comments)
- **Backend Setup**: `rateyourdj-backend/SETUP.md` (installation guide)
- **Frontend README**: `rateyourdj-miniprogram/README.md` (complete setup guide)

---

## Project Status

- **Backend**: 100% complete (all core APIs implemented)
- **Frontend**: 95% complete (missing TabBar icons only)
- **Database**: Production-ready (8 tables, indexed)
- **Documentation**: Comprehensive

**Next Steps**:
1. Add TabBar icons (`images/README.md` has instructions)
2. Configure WeChat AppID in `project.config.json`
3. Test all flows end-to-end
4. Deploy backend to production server
5. Submit for WeChat review

---

## Critical Bugs / Known Traps

> These are repeatedly encountered issues. Read before making changes to these areas.

### Invite Code Flow (Waitlist)

**The #1 trap**: `verify` vs `use` are different endpoints with different side effects.

| Endpoint | Method | Side effect | When to use |
|----------|--------|-------------|-------------|
| `/api/invite/verify` | POST | None (read-only) | Checking if code is valid before UI confirmation |
| `/api/invite/use` | POST | Increments `used_count` | After user confirms, to actually consume the code |

**Common mistake**: Frontend calls `verify` at the confirmation step instead of `use`, so `used_count` never increases.

**Full lifecycle**:
1. User enters code -> call `verify` (validation only)
2. User confirms -> call `use` (consumes the code)
3. Already logged in? -> `use` needs auth token in header
4. Not logged in? -> Store code locally -> login -> then call `use`

### Search History NULL Bug

**Problem**: Backend can return search history items with `null` keyword values. Frontend renders `null` as the literal string "NULL".

**Prevention**: Always filter out null/empty keywords before rendering:
```javascript
const history = res.data.filter(item => item.keyword)
```

### WeChat Mini-Program Common Traps

1. **Domain whitelist**: Production requires HTTPS domain in WeChat backend settings. Dev can bypass with "不校验合法域名".
2. **Token expiry loop**: If 401 is not handled properly, user gets stuck in login redirect. Must call `app.logout()` and clear storage.
3. **wx.login() code**: Expires in 5 minutes, one-time use only. Never cache or reuse.

---

## Task Management

### Directory Structure

```
tasks/
├── STATUS.md    # Global status board — read at session start
├── todo.md      # Current task checklist
└── lessons.md   # Bug patterns and gotchas — read at session start
```

### Workflow Rules

1. **Session start**: Read `tasks/STATUS.md` and `tasks/lessons.md`
2. **Starting a task**: Mark it in `tasks/todo.md`, update STATUS.md "In Progress"
3. **Task complete**: Move to completed in `todo.md`, update STATUS.md "Recently Completed" with commit hash
4. **Bug discovered**: Record pattern in `tasks/lessons.md`
5. **Multi-session**: Note your session focus in STATUS.md "Session Coordination" table

### Version Tracking

Single source of truth: `rateyourdj-miniprogram/config/version.js`

Update version there when releasing. Status board in `tasks/STATUS.md` should match.
