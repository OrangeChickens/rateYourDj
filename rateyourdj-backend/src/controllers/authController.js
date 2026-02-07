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
      // 老用户：只在有新头像时才更新头像
      const updateData = {
        nickname: userInfo.nickName
      };

      // 只有提供了新头像URL时才更新（避免每次登录都重新上传）
      if (userInfo.avatarUrl) {
        updateData.avatar_url = userInfo.avatarUrl;
      }

      user = await User.update(user.id, updateData);
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
          avatar_url: user.avatar_url,
          role: user.role || 'user'
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

// 预检查用户状态（登录前）
async function checkUser(req, res, next) {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: '缺少登录凭证'
      });
    }

    // 使用 code 换取 openid
    const { openid } = await code2Session(code);

    // 查询用户是否存在
    const user = await User.findByOpenid(openid);

    if (user) {
      // 老用户
      res.json({
        success: true,
        data: {
          isExistingUser: true,
          nickname: user.nickname,
          avatar_url: user.avatar_url
        }
      });
    } else {
      // 新用户
      res.json({
        success: true,
        data: {
          isExistingUser: false,
          nickname: null,
          avatar_url: null
        }
      });
    }
  } catch (error) {
    next(error);
  }
}

module.exports = { wechatLogin, checkUser };
