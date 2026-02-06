const axios = require('axios');
require('dotenv').config();

const WECHAT_APP_ID = process.env.WECHAT_APP_ID;
const WECHAT_APP_SECRET = process.env.WECHAT_APP_SECRET;
const NODE_ENV = process.env.NODE_ENV || 'development';

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

module.exports = { code2Session };
