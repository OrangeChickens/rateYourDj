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

---

## Infrastructure / Server

### Docker 网段与 RDS 内网冲突 (2026-03-07)

**Problem**: 后端突然无法连接 RDS，报 `EHOSTUNREACH 192.168.123.42:3306`。PM2 显示服务在线但所有数据库请求失败。

**Root cause**: 服务器上另一个项目的 Docker 容器（`daapiservice`）重启时，Docker 自动创建了 `root_daapi` 网络，分配了 `192.168.112.0/20` 网段（范围 192.168.112.0 - 192.168.127.255），覆盖了 RDS 内网 IP `192.168.123.42`，导致流量被路由到 Docker bridge 而不是 RDS。

**Fix**:
1. 停掉冲突容器，删除 `root_daapi` 网络
2. 创建 `/etc/docker/daemon.json` 限制 Docker 只用 `10.x.x.x` 网段：
   ```json
   { "default-address-pools": [{"base": "10.0.0.0/8", "size": 24}] }
   ```
3. 重启 Docker，重新启动容器

**Lesson**: 同一 VPC 内 ECS 上跑 Docker 时，必须限制 Docker 网段避免与 RDS 内网地址冲突。`daemon.json` 的 `default-address-pools` 是全局兜底方案。
