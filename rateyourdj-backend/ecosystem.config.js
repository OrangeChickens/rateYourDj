module.exports = {
  apps: [{
    name: 'rateyourdj-api',
    script: './src/app.js',

    // 实例数量（集群模式）
    instances: 1,  // 根据服务器CPU核心数调整，或设为 'max' 使用所有核心
    exec_mode: 'fork',  // 'cluster' 或 'fork'

    // 环境变量
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },

    // 日志
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

    // 自动重启配置
    autorestart: true,
    watch: false,  // 生产环境不建议开启watch
    max_memory_restart: '500M',  // 内存超过500M自动重启

    // 进程管理
    min_uptime: '10s',  // 应用运行少于时间被认为是异常启动
    max_restarts: 10,   // 最大异常重启次数
    restart_delay: 4000,  // 异常重启间隔

    // 其他配置
    kill_timeout: 5000,  // 发送SIGKILL前等待的毫秒数
    listen_timeout: 3000,  // 应用启动后等待监听端口的时间
    shutdown_with_message: true
  }]
};
