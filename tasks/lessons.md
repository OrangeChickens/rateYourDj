# RateYourDJ - Lessons Learned

Patterns, bugs, and gotchas discovered during development. Read this at session start.

---

## Backend

### Invite Code Flow: verify vs use

**Problem**: `POST /api/invite/verify` and `POST /api/invite/use` look similar but have critical differences.
- `verify` = read-only validation (check if code exists and has uses remaining)
- `use` = actually consumes the code (increments `used_count`)
- **Trap**: If frontend calls `verify` instead of `use` after login, the code never gets consumed and `used_count` stays at 0.

**Fix** (commit `69f7c2e`): Ensure the frontend calls `/api/invite/use` after successful login, not just `/api/invite/verify`.

### Search History: NULL Display

**Problem**: Search history showed "NULL" as text in the frontend.
- Backend returned `{ data: [...] }` where items could have `null` keyword values
- Frontend rendered the raw `null` as the string "NULL"

**Fix** (commit `6e3d753`): Filter out null/empty keywords before rendering search history.

### Database Connection

- `connect ECONNREFUSED` → MySQL not running. Run `docker compose up -d`.
- `Access denied` → Check `.env` credentials match `docker-compose.yml`.

### JWT Token

- `jwt malformed` → `Authorization` header not in `Bearer <token>` format.
- `jwt expired` → Token older than 7 days. Frontend handles via 401 → logout → re-login.

### SQL Safety

- Always use parameterized queries: `pool.query('SELECT * FROM djs WHERE city = ?', [city])`
- Never use template literals for SQL values.

---

## Mini-Program (Frontend)

### WeChat Domain Whitelist

- Dev mode: DevTools → Settings → "不校验合法域名" to bypass
- Production: Must add API domain to WeChat backend whitelist

### Token Persistence

- **Symptom**: Redirect to login after every action
- **Cause**: Token not persisted with `wx.setStorageSync('token', jwt)`
- Always store token in both `globalData` AND `wx.storage`

### Waitlist Page: Invite Code Lifecycle

Full flow that must happen in order:
1. User enters code → frontend calls `verify` (read-only check)
2. User clicks confirm → frontend calls `use` (consumes the code)
3. If user is already logged in, `use` must be called with the auth token
4. If user is not logged in, store code → login → then call `use`

**Common mistake**: Calling `verify` at step 2 instead of `use`.

---

## Workflow

### Git Push Rules

- Never push directly to `main`. Always use feature branches.
- Branch naming: `feature/<name>` or `fix/<description>`
- Always ask user before pushing.

### Migration Naming

- Format: `NNN_descriptive_name.sql` (e.g., `003_add_user_badges.sql`)
- Always use `rateyourdj-backend/migrations/` folder
- Never create custom migration directories
- Deploy with `scripts/sync-to-rds.sh`

### Debugging Scripts

- One-time debugging scripts should be deleted after use (commit `5baa295` cleaned up 3)
- Don't let diagnostic tools accumulate in the repo
