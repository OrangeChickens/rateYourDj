const { verifyToken } = require('../utils/jwt');

// 认证中间件
async function authenticate(req, res, next) {
  try {
    // 从 header 中获取 token
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '未提供认证令牌'
      });
    }

    const token = authHeader.substring(7); // 移除 "Bearer " 前缀

    // 验证 token
    const decoded = verifyToken(token);

    // 将用户信息附加到请求对象
    req.user = {
      userId: decoded.userId,
      openid: decoded.openid
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: '认证失败：' + error.message
    });
  }
}

// 可选认证中间件（用于获取用户信息但不强制登录）
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      req.user = {
        userId: decoded.userId,
        openid: decoded.openid
      };
    }

    next();
  } catch (error) {
    // 即使认证失败也继续，只是不设置 req.user
    next();
  }
}

module.exports = { authenticate, optionalAuth };
