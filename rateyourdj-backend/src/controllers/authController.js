const User = require('../models/User');
const { code2Session } = require('../services/wechatService');
const { generateToken } = require('../utils/jwt');

// 微信登录
async function wechatLogin(req, res, next) {
  try {
    const { code, userInfo } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: '缺少登录凭证'
      });
    }

    // 使用 code 换取 openid
    const { openid, unionid } = await code2Session(code);

    // 查询或创建用户
    let user = await User.findByOpenid(openid);

    if (!user) {
      // 创建新用户
      user = await User.create({
        wx_openid: openid,
        wx_unionid: unionid,
        nickname: userInfo?.nickName || '微信用户',
        avatar_url: userInfo?.avatarUrl || null
      });
    } else if (userInfo) {
      // 更新用户信息
      user = await User.update(user.id, {
        nickname: userInfo.nickName,
        avatar_url: userInfo.avatarUrl
      });
    }

    // 生成 JWT token
    const token = generateToken({
      userId: user.id,
      openid: user.wx_openid
    });

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          nickname: user.nickname,
          avatar_url: user.avatar_url
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { wechatLogin };
