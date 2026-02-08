// controllers/inviteController.js
const InviteCode = require('../models/InviteCode');
const User = require('../models/User');

// 生成个人邀请码
exports.generateCode = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    // 检查用户邀请码额度
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    if (user.invite_quota <= 0) {
      return res.status(400).json({ success: false, message: '邀请码额度不足，请完成任务获得更多额度' });
    }

    // 生成邀请码（使用用户昵称前缀）
    let prefix = 'UDISK';
    if (user.nickname) {
      // 提取昵称中的英文字母或拼音首字母
      const letters = user.nickname.replace(/[^A-Za-z]/g, '').substring(0, 5).toUpperCase();
      if (letters.length >= 2) {
        prefix = letters;
      }
    }

    let code;
    let attempts = 0;
    const maxAttempts = 10;

    // 尝试生成唯一邀请码
    while (attempts < maxAttempts) {
      code = InviteCode.generateCode(prefix);
      const existing = await InviteCode.getByCode(code);
      if (!existing) break;
      attempts++;
    }

    if (attempts >= maxAttempts) {
      // 降级使用默认前缀
      code = InviteCode.generateCode('UDISK');
    }

    // 创建邀请码
    await InviteCode.createByUser(userId, code, 1);

    res.json({
      success: true,
      code,
      shareUrl: `pages/waitlist/waitlist?code=${code}`,
      usageLimit: 1
    });
  } catch (error) {
    console.error('生成邀请码失败:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// 获取我的邀请码列表
exports.getMyCodes = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const codes = await InviteCode.getUserCodes(userId);

    // 格式化数据
    const formattedCodes = codes.map(code => ({
      code: code.code,
      usedCount: code.used_count,
      usageLimit: code.usage_limit,
      status: !code.is_active || code.used_count >= code.usage_limit ? 'used' : 'available',
      createdAt: code.created_at,
      usedBy: code.usedBy || []
    }));

    res.json({
      success: true,
      codes: formattedCodes
    });
  } catch (error) {
    console.error('获取邀请码列表失败:', error);
    next(error);
  }
};

// 验证邀请码（不使用，只检查）
exports.validateCode = async (req, res, next) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: '请输入邀请码' });
    }

    const validation = await InviteCode.validate(code);

    res.json({
      success: validation.valid,
      message: validation.message || '邀请码有效'
    });
  } catch (error) {
    console.error('验证邀请码失败:', error);
    next(error);
  }
};
