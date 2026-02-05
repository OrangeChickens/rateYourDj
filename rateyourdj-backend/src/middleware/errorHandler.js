// 全局错误处理中间件
function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  // 默认错误状态码
  const statusCode = err.statusCode || 500;

  // 默认错误信息
  const message = err.message || '服务器内部错误';

  // 开发环境返回完整错误信息
  if (process.env.NODE_ENV === 'development') {
    return res.status(statusCode).json({
      success: false,
      message,
      error: err.stack
    });
  }

  // 生产环境返回简化错误信息
  res.status(statusCode).json({
    success: false,
    message
  });
}

// 404 处理
function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: '请求的资源不存在'
  });
}

module.exports = { errorHandler, notFoundHandler };
