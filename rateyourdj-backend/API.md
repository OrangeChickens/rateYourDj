# RateYourDJ API 文档

## 基础信息

- **Base URL**: `http://localhost:3000/api`
- **数据格式**: JSON
- **字符编码**: UTF-8

## 认证

需要认证的接口在请求头中携带 JWT token：

```
Authorization: Bearer <your_jwt_token>
```

---

## 认证 API

### 1. 微信登录

**接口**: `POST /auth/login`

**请求参数**:

```json
{
  "code": "微信登录code",
  "userInfo": {
    "nickName": "用户昵称",
    "avatarUrl": "头像URL"
  }
}
```

**响应**:

```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": 1,
      "nickname": "用户昵称",
      "avatar_url": "头像URL"
    }
  }
}
```

---

## DJ API

### 1. 获取DJ列表

**接口**: `GET /dj/list`

**查询参数**:

- `city` (可选): 城市筛选
- `style` (可选): 音乐风格筛选
- `sort` (可选): 排序字段（overall_rating, review_count, created_at）
- `order` (可选): 排序方向（ASC, DESC）
- `page` (可选): 页码（默认：1）
- `limit` (可选): 每页数量（默认：20）

**示例**: `GET /dj/list?city=上海&sort=overall_rating&order=DESC&page=1&limit=20`

**响应**:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "DJ Yang",
      "city": "上海",
      "label": "Shelter Shanghai",
      "photo_url": "...",
      "music_style": "Techno,Melodic Techno",
      "overall_rating": 4.5,
      "set_rating": 4.6,
      "performance_rating": 4.7,
      "personality_rating": 4.3,
      "review_count": 15,
      "would_choose_again_percent": 85
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

### 2. 获取DJ详情

**接口**: `GET /dj/:id`

**响应**:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "DJ Yang",
    "city": "上海",
    "label": "Shelter Shanghai",
    "photo_url": "...",
    "music_style": "Techno,Melodic Techno",
    "overall_rating": 4.5,
    "set_rating": 4.6,
    "performance_rating": 4.7,
    "personality_rating": 4.3,
    "review_count": 15,
    "would_choose_again_percent": 85,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### 3. 搜索DJ

**接口**: `GET /dj/search/query`

**查询参数**:

- `keyword` (必需): 搜索关键词
- `page` (可选): 页码
- `limit` (可选): 每页数量

**示例**: `GET /dj/search/query?keyword=techno&page=1&limit=20`

### 4. 获取热门DJ

**接口**: `GET /dj/hot/list`

**查询参数**:

- `limit` (可选): 数量限制（默认：10）

### 5. 获取所有城市

**接口**: `GET /dj/cities/all`

**响应**:

```json
{
  "success": true,
  "data": [
    {
      "city": "上海",
      "dj_count": 25
    },
    {
      "city": "北京",
      "dj_count": 18
    }
  ]
}
```

---

## 评论 API

### 1. 创建评论

**接口**: `POST /review/create`

**需要认证**: ✅

**请求参数**:

```json
{
  "dj_id": 1,
  "overall_rating": 5,
  "set_rating": 5,
  "performance_rating": 4,
  "personality_rating": 5,
  "would_choose_again": true,
  "comment": "非常棒的DJ！",
  "tags": ["Techno", "有张力", "专业"],
  "is_anonymous": false
}
```

**字段说明**:

- `dj_id`: DJ ID（必需）
- `overall_rating`: 综合评分 1-5（必需）
- `set_rating`: Set评分 1-5（必需）
- `performance_rating`: 表演力评分 1-5（必需）
- `personality_rating`: 性格评分 1-5（必需）
- `would_choose_again`: 是否会再次选择（可选）
- `comment`: 评论内容（可选）
- `tags`: 标签数组（可选）
- `is_anonymous`: 是否匿名（可选，默认false）

**响应**:

```json
{
  "success": true,
  "message": "评论创建成功",
  "data": {
    "id": 123,
    "dj_id": 1,
    "overall_rating": 5,
    ...
  }
}
```

### 2. 获取DJ的评论列表

**接口**: `GET /review/list/:djId`

**查询参数**:

- `sort` (可选): 排序字段（created_at, helpful_count, overall_rating）
- `order` (可选): 排序方向（ASC, DESC）
- `page` (可选): 页码
- `limit` (可选): 每页数量

**示例**: `GET /review/list/1?sort=created_at&order=DESC&page=1&limit=20`

**响应**:

```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "dj_id": 1,
      "user_id": 5,
      "nickname": "用户昵称",
      "avatar_url": "...",
      "is_anonymous": false,
      "overall_rating": 5,
      "set_rating": 5,
      "performance_rating": 4,
      "personality_rating": 5,
      "would_choose_again": true,
      "comment": "非常棒的DJ！",
      "helpful_count": 10,
      "not_helpful_count": 1,
      "tags": ["Techno", "有张力", "专业"],
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "totalPages": 1
  }
}
```

### 3. 删除评论

**接口**: `DELETE /review/:id`

**需要认证**: ✅

**响应**:

```json
{
  "success": true,
  "message": "评论删除成功"
}
```

### 4. 标记评论有帮助

**接口**: `POST /review/:id/helpful`

**需要认证**: ✅

**响应**:

```json
{
  "success": true,
  "message": "操作成功"
}
```

### 5. 举报评论

**接口**: `POST /review/:id/report`

**需要认证**: ✅

**响应**:

```json
{
  "success": true,
  "message": "举报成功，我们会尽快处理"
}
```

---

## 用户 API

### 1. 获取用户资料

**接口**: `GET /user/profile`

**需要认证**: ✅

**响应**:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "nickname": "用户昵称",
    "avatar_url": "...",
    "review_count": 5,
    "favorite_count": 10,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### 2. 获取收藏列表

**接口**: `GET /user/favorites`

**需要认证**: ✅

**查询参数**:

- `page` (可选): 页码
- `limit` (可选): 每页数量

### 3. 收藏/取消收藏DJ

**接口**: `POST /user/favorite/:djId`

**需要认证**: ✅

**响应**:

```json
{
  "success": true,
  "message": "收藏成功",
  "data": {
    "is_favorite": true
  }
}
```

### 4. 获取用户评论历史

**接口**: `GET /user/reviews`

**需要认证**: ✅

### 5. 获取搜索历史

**接口**: `GET /user/search-history`

**需要认证**: ✅

**响应**:

```json
{
  "success": true,
  "data": ["techno", "上海", "house"]
}
```

---

## 标签 API

### 1. 获取预设标签

**接口**: `GET /tags/presets`

**请求头**:

- `Accept-Language` (可选): zh-CN 或 en-US

**响应**:

```json
{
  "success": true,
  "data": {
    "style": [
      { "id": 1, "name": "Techno", "usage_count": 150 },
      { "id": 2, "name": "House", "usage_count": 120 }
    ],
    "performance": [
      { "id": 11, "name": "有张力", "usage_count": 200 }
    ],
    "personality": [
      { "id": 21, "name": "热情", "usage_count": 180 }
    ]
  }
}
```

### 2. 获取DJ的热门标签

**接口**: `GET /tags/dj/:djId`

**响应**:

```json
{
  "success": true,
  "data": [
    { "tag_name": "Techno", "count": 12 },
    { "tag_name": "有张力", "count": 10 }
  ]
}
```

---

## 错误响应格式

```json
{
  "success": false,
  "message": "错误描述"
}
```

常见 HTTP 状态码：

- `200` - 成功
- `201` - 创建成功
- `400` - 请求参数错误
- `401` - 未授权（未登录或token无效）
- `404` - 资源不存在
- `500` - 服务器内部错误

---

## 测试接口

可以使用以下工具测试 API：

- **Postman**
- **curl**
- **Thunder Client** (VS Code扩展)

### curl 示例

```bash
# 健康检查
curl http://localhost:3000/health

# 获取热门DJ
curl http://localhost:3000/api/dj/hot/list

# 创建评论（需要token）
curl -X POST http://localhost:3000/api/review/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "dj_id": 1,
    "overall_rating": 5,
    "set_rating": 5,
    "performance_rating": 4,
    "personality_rating": 5,
    "would_choose_again": true,
    "comment": "非常棒！"
  }'
```
