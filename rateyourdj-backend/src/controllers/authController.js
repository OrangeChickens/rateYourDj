const User = require('../models/User');
const InviteCode = require('../models/InviteCode');
const UserTask = require('../models/UserTask');
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
      // 创建新用户 - 默认为 waitlist 状态
      const pool = require('../config/database');

      // 计算排队位置
      const [[{ waitlistCount }]] = await pool.query(
        'SELECT COUNT(*) as waitlistCount FROM users WHERE access_level = "waitlist"'
      );
      const position = waitlistCount + 1;

      user = await User.create({
        wx_openid: openid,
        wx_unionid: unionid,
        nickname: userInfo?.nickName || '微信用户',
        avatar_url: userInfo?.avatarUrl || null,
        access_level: 'waitlist',
        waitlist_position: position,
        waitlist_joined_at: new Date()
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

// 使用邀请码
async function useInviteCode(req, res, next) {
  try {
    const { code } = req.body;
    const userId = req.user.userId;

    if (!code) {
      return res.status(400).json({ success: false, message: '请输入邀请码' });
    }

    // 检查用户当前状态
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    if (user.access_level === 'full') {
      return res.status(400).json({ success: false, message: '你已经拥有访问权限' });
    }

    // 使用邀请码
    const { invitedBy } = await InviteCode.use(code, userId);

    // 初始化用户任务
    await UserTask.initializeForUser(userId);

    // 获取邀请人信息
    let inviterInfo = null;
    if (invitedBy) {
      const inviter = await User.findById(invitedBy);
      if (inviter) {
        inviterInfo = {
          id: inviter.id,
          nickname: inviter.nickname
        };
      }
    }

    res.json({
      success: true,
      message: '欢迎加入 烂U盘！',
      user: {
        id: user.id,
        access_level: 'full',
        invite_quota: 0
      },
      invitedBy: inviterInfo
    });
  } catch (error) {
    console.error('使用邀请码失败:', error);
    res.status(400).json({ success: false, message: error.message });
  }
}

// 检查访问权限
async function checkAccess(req, res, next) {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    res.json({
      success: true,
      access_level: user.access_level || 'waitlist'
    });
  } catch (error) {
    console.error('检查访问权限失败:', error);
    next(error);
  }
}

module.exports = { wechatLogin, checkUser, useInviteCode, checkAccess };
