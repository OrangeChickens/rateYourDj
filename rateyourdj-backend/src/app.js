const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { testConnection } = require('./config/database');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// 导入路由
const authRoutes = require('./routes/auth');
const djRoutes = require('./routes/dj');
const reviewRoutes = require('./routes/review');
const commentRoutes = require('./routes/comment');
const statsRoutes = require('./routes/stats');
const userRoutes = require('./routes/user');
const tagRoutes = require('./routes/tags');
const uploadRoutes = require('./routes/upload');
const taskRoutes = require('./routes/task');
const inviteRoutes = require('./routes/invite');
const suggestionRoutes = require('./routes/suggestion');
const djEditRequestRoutes = require('./routes/djEditRequest');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务（用于访问上传的图片）
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 日志中间件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'RateYourDJ API is running',
    timestamp: new Date().toISOString()
  });
});

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/dj', djRoutes);
app.use('/api/review', reviewRoutes);
app.use('/api/comment', commentRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/user', userRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/invite', inviteRoutes);
app.use('/api/suggestion', suggestionRoutes);
app.use('/api/dj-edit-request', djEditRequestRoutes);

// 404 处理
app.use(notFoundHandler);

// 错误处理
app.use(errorHandler);

// 启动服务器
async function startServer() {
  try {
    // 测试数据库连接
    await testConnection();

    // 启动服务器（监听所有网络接口，支持局域网访问）
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server is running on:`);
      console.log(`   - Local:   http://localhost:${PORT}`);
      console.log(`   - Network: http://192.168.101.4:${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
