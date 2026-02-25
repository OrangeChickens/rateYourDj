# Architecture Reference

Detailed reference documentation for RateYourDJ's system architecture, patterns, and conventions.

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

4. **review_tags** - Many-to-many (reviews <-> tags)
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
   - Login -> Browse DJs -> View detail
   - Write review -> See updated rating
   - Favorite DJ -> View in favorites
   - Switch language -> All text updates

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
