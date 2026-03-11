/**
 * 防刷中间件 - 内存 Map 实现，无需 Redis
 *
 * 4 个防护机制：
 * 1. 新用户冷却期（账龄 < 30秒）
 * 2. 用户发帖限频（>10条/小时 或 >20条/天）
 * 3. 重复内容检测（同DJ 1h内 3+ 条相同评论）
 * 4. DJ 涌入保护（同DJ 1h内 >=20 条新评论）
 */

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const CLEANUP_INTERVAL = 10 * 60 * 1000; // 10 分钟

// 内存存储
const reviewsPerUserHour = new Map();
const reviewsPerUserDay = new Map();
const reviewsPerDJHour = new Map();
const recentContentHashes = new Map(); // key: `dj:${djId}:hash:${hash}`, value: {count, firstTs}

// 定时清理过期 entry
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of reviewsPerUserHour) {
    if (now - val.firstTs > HOUR) reviewsPerUserHour.delete(key);
  }
  for (const [key, val] of reviewsPerUserDay) {
    if (now - val.firstTs > DAY) reviewsPerUserDay.delete(key);
  }
  for (const [key, val] of reviewsPerDJHour) {
    if (now - val.firstTs > HOUR) reviewsPerDJHour.delete(key);
  }
  for (const [key, val] of recentContentHashes) {
    if (now - val.firstTs > HOUR) recentContentHashes.delete(key);
  }
}, CLEANUP_INTERVAL);

/**
 * 简单字符串哈希
 */
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return hash.toString(36);
}

/**
 * 1. 新用户冷却期 - 账龄 < 30秒 禁止发帖
 */
async function reviewNewUserCooldown(req, res, next) {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user.userId);
    if (user && user.created_at) {
      const accountAge = Date.now() - new Date(user.created_at).getTime();
      if (accountAge < 30 * 1000) {
        console.log(`🛡️ [AntiSpam] 新用户冷却拦截: userId=${req.user.userId}, accountAge=${Math.round(accountAge / 1000)}s`);
        return res.status(403).json({
          success: false,
          message: '账号刚注册，请稍后再试'
        });
      }
    }
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * 2. 用户发帖限频 - >10条/小时 或 >20条/天
 */
function reviewUserRateLimit(req, res, next) {
  const userId = req.user.userId;
  const now = Date.now();

  // 小时限制
  const hourKey = `user:${userId}`;
  const hourData = reviewsPerUserHour.get(hourKey);
  if (hourData) {
    if (now - hourData.firstTs < HOUR && hourData.count >= 10) {
      console.log(`🛡️ [AntiSpam] 小时限频拦截: userId=${userId}, count=${hourData.count}`);
      return res.status(429).json({
        success: false,
        message: '发帖太频繁，请稍后再试'
      });
    }
  }

  // 天限制
  const dayKey = `user:${userId}`;
  const dayData = reviewsPerUserDay.get(dayKey);
  if (dayData) {
    if (now - dayData.firstTs < DAY && dayData.count >= 20) {
      console.log(`🛡️ [AntiSpam] 日限频拦截: userId=${userId}, count=${dayData.count}`);
      return res.status(429).json({
        success: false,
        message: '今天发帖已达上限，请明天再试'
      });
    }
  }

  next();
}

/**
 * 3. 重复内容检测 - 同DJ 1h内 3+ 条相同评论 → flag pending
 */
function reviewDuplicateContentCheck(req, res, next) {
  const { dj_id, comment } = req.body;
  if (!comment || !dj_id) return next();

  const now = Date.now();
  const hash = simpleHash(comment.trim().toLowerCase());
  const key = `dj:${dj_id}:hash:${hash}`;
  const data = recentContentHashes.get(key);

  if (data && now - data.firstTs < HOUR && data.count >= 3) {
    console.log(`🛡️ [AntiSpam] 重复内容检测: djId=${dj_id}, hash=${hash}, count=${data.count}`);
    req.spamFlags = req.spamFlags || [];
    req.spamFlags.push('duplicate_content');
  }

  next();
}

/**
 * 4. DJ 涌入保护 - 同DJ 1h内 >20 条新评论 → flag pending
 */
function reviewDJSurgeCheck(req, res, next) {
  const { dj_id } = req.body;
  if (!dj_id) return next();

  const now = Date.now();
  const key = `dj:${dj_id}`;
  const data = reviewsPerDJHour.get(key);

  if (data && now - data.firstTs < HOUR && data.count >= 20) {
    console.log(`🛡️ [AntiSpam] DJ涌入保护: djId=${dj_id}, count=${data.count}`);
    req.spamFlags = req.spamFlags || [];
    req.spamFlags.push('dj_surge');
  }

  next();
}

/**
 * 记录评论事件 - 创建成功后调用
 */
function recordReviewEvent(userId, djId, comment) {
  const now = Date.now();

  // 用户小时计数
  const hourKey = `user:${userId}`;
  const hourData = reviewsPerUserHour.get(hourKey);
  if (hourData && now - hourData.firstTs < HOUR) {
    hourData.count++;
  } else {
    reviewsPerUserHour.set(hourKey, { count: 1, firstTs: now });
  }

  // 用户日计数
  const dayKey = `user:${userId}`;
  const dayData = reviewsPerUserDay.get(dayKey);
  if (dayData && now - dayData.firstTs < DAY) {
    dayData.count++;
  } else {
    reviewsPerUserDay.set(hourKey, { count: 1, firstTs: now });
  }

  // DJ 小时计数
  const djKey = `dj:${djId}`;
  const djData = reviewsPerDJHour.get(djKey);
  if (djData && now - djData.firstTs < HOUR) {
    djData.count++;
  } else {
    reviewsPerDJHour.set(djKey, { count: 1, firstTs: now });
  }

  // 内容哈希计数
  if (comment) {
    const hash = simpleHash(comment.trim().toLowerCase());
    const contentKey = `dj:${djId}:hash:${hash}`;
    const contentData = recentContentHashes.get(contentKey);
    if (contentData && now - contentData.firstTs < HOUR) {
      contentData.count++;
    } else {
      recentContentHashes.set(contentKey, { count: 1, firstTs: now });
    }
  }
}

module.exports = {
  reviewNewUserCooldown,
  reviewUserRateLimit,
  reviewDuplicateContentCheck,
  reviewDJSurgeCheck,
  recordReviewEvent,
};
