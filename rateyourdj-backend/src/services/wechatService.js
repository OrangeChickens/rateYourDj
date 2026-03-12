const axios = require('axios');
require('dotenv').config();

const WECHAT_APP_ID = process.env.WECHAT_APP_ID;
const WECHAT_APP_SECRET = process.env.WECHAT_APP_SECRET;
const NODE_ENV = process.env.NODE_ENV || 'development';

// --- Access Token 缓存 ---
let cachedAccessToken = null;
let tokenExpiresAt = 0;
let tokenRefreshPromise = null;

/**
 * 获取微信 access_token（内存缓存，提前10分钟刷新）
 */
async function getAccessToken() {
  if (NODE_ENV === 'development') {
    return 'mock_access_token';
  }

  const now = Date.now();
  if (cachedAccessToken && now < tokenExpiresAt) {
    return cachedAccessToken;
  }

  // 防止并发刷新：复用进行中的请求
  if (tokenRefreshPromise) {
    return tokenRefreshPromise;
  }

  tokenRefreshPromise = (async () => {
    try {
      const response = await axios.get('https://api.weixin.qq.com/cgi-bin/token', {
        params: {
          grant_type: 'client_credential',
          appid: WECHAT_APP_ID,
          secret: WECHAT_APP_SECRET
        }
      });

      const data = response.data;
      if (data.errcode) {
        throw new Error(`获取access_token失败: ${data.errmsg}`);
      }

      cachedAccessToken = data.access_token;
      // 提前10分钟刷新（token有效期7200秒）
      tokenExpiresAt = Date.now() + (data.expires_in - 600) * 1000;

      return cachedAccessToken;
    } catch (error) {
      console.error('获取access_token失败:', error.message);
      throw error;
    } finally {
      tokenRefreshPromise = null;
    }
  })();

  return tokenRefreshPromise;
}

/**
 * 微信内容安全检测 (security.msgSecCheck)
 * @param {string} content - 待检测文本
 * @param {string} openid - 用户openid
 * @returns {{ safe: boolean, label: string|null }}
 */
async function msgSecCheck(content, openid) {
  if (NODE_ENV === 'development') {
    return { safe: true, label: null };
  }

  try {
    const accessToken = await getAccessToken();
    const response = await axios.post(
      `https://api.weixin.qq.com/wxa/msg_sec_check?access_token=${accessToken}`,
      {
        version: 2,
        openid,
        scene: 2, // 评论/论坛场景
        content
      }
    );

    const data = response.data;
    if (data.errcode !== 0) {
      console.error('msgSecCheck API error:', data);
      // API故障时不阻断用户
      return { safe: true, label: null };
    }

    // v2: 无result字段表示同步判定为安全
    const result = data.result;
    if (!result) {
      return { safe: true, label: null };
    }

    // result.suggest: 'pass'=通过, 'review'=需审核, 'risky'=违规
    // result.label: 100=正常, 其他=违规类别
    const safe = result.suggest === 'pass' || result.label === 100;

    return { safe, label: result.label ?? null };
  } catch (error) {
    console.error('msgSecCheck请求失败:', error.message);
    // API故障时不阻断用户
    return { safe: true, label: null };
  }
}

// 微信登录 - code 换取 session_key 和 openid
async function code2Session(code) {
  // 开发环境：使用模拟数据
  if (NODE_ENV === 'development') {
    console.log('⚠️  Development mode: Using mock WeChat login');
    return {
      openid: `mock_openid_${Date.now()}`,
      session_key: 'mock_session_key',
      unionid: null
    };
  }

  // 生产环境：调用微信 API
  try {
    const response = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
      params: {
        appid: WECHAT_APP_ID,
        secret: WECHAT_APP_SECRET,
        js_code: code,
        grant_type: 'authorization_code'
      }
    });

    const data = response.data;

    if (data.errcode) {
      throw new Error(`微信登录失败: ${data.errmsg}`);
    }

    return {
      openid: data.openid,
      session_key: data.session_key,
      unionid: data.unionid
    };
  } catch (error) {
    console.error('WeChat code2Session error:', error);
    throw new Error('微信登录失败，请重试');
  }
}

module.exports = { code2Session, getAccessToken, msgSecCheck };
