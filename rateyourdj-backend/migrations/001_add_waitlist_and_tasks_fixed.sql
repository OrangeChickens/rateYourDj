-- 迁移脚本：添加 Waitlist 和任务系统
-- 执行方式：mysql -u root -p rateyourdj < migrations/001_add_waitlist_and_tasks_fixed.sql

-- ============================================
-- 0. 设置字符集为 utf8mb4 以支持 emoji
-- ============================================
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- ============================================
-- 1. 修改 users 表，添加访问控制和邀请码相关字段
-- ============================================
ALTER TABLE users
-- 访问权限
ADD COLUMN access_level ENUM('waitlist', 'full') DEFAULT 'waitlist' COMMENT '访问级别',

-- 邀请码相关
ADD COLUMN invite_quota INT DEFAULT 0 COMMENT '邀请码额度（可生成数量）',
ADD COLUMN invites_sent INT DEFAULT 0 COMMENT '已发出邀请数',
ADD COLUMN invites_accepted INT DEFAULT 0 COMMENT '成功邀请数（好友注册）',
ADD COLUMN invited_by INT NULL COMMENT '邀请人 ID',
ADD COLUMN invite_code_used VARCHAR(32) COMMENT '使用的邀请码',

-- Waitlist 信息
ADD COLUMN waitlist_position INT COMMENT '排队位置',
ADD COLUMN waitlist_joined_at TIMESTAMP NULL COMMENT '加入 waitlist 时间',
ADD COLUMN access_granted_at TIMESTAMP NULL COMMENT '获得访问权限时间',

-- 索引
ADD INDEX idx_access_level (access_level),
ADD INDEX idx_waitlist_position (waitlist_position),
ADD INDEX idx_invited_by (invited_by);

-- ============================================
-- 2. 创建任务配置表
-- ============================================
CREATE TABLE task_configs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  task_code VARCHAR(50) UNIQUE NOT NULL COMMENT '任务代码',

  -- 显示信息
  task_name VARCHAR(100) NOT NULL COMMENT '任务名称',
  task_desc VARCHAR(500) COMMENT '任务描述',
  task_category ENUM('beginner', 'advanced', 'vip') DEFAULT 'beginner' COMMENT '任务分类',
  icon VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '图标 emoji',

  -- 目标和奖励
  target INT NOT NULL COMMENT '目标值',
  reward_invites INT NOT NULL COMMENT '奖励邀请码数量',

  -- 可重复性
  repeatable BOOLEAN DEFAULT FALSE COMMENT '是否可重复',
  max_repeats INT DEFAULT 1 COMMENT '最大重复次数',

  -- 状态
  is_active BOOLEAN DEFAULT TRUE COMMENT '是否启用',
  sort_order INT DEFAULT 0 COMMENT '排序',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_category (task_category),
  INDEX idx_active (is_active)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT='任务配置表';

-- 插入任务配置（根据确认的奖励）
INSERT INTO task_configs (task_code, task_name, task_desc, task_category, icon, target, reward_invites, repeatable, max_repeats, sort_order) VALUES
-- 新手任务
('first_review', '首次评价', '评价你的第一个 DJ', 'beginner', '✍️', 1, 1, false, 1, 1),
('reviews_3', '活跃评价', '累计评价 3 个 DJ', 'beginner', '📝', 3, 1, false, 1, 2),
('favorite_5', '收藏专家', '收藏 5 个 DJ', 'beginner', '⭐', 5, 1, false, 1, 3),

-- 进阶任务
('quality_review', '优质评价', '写一条 30 字以上的评价', 'advanced', '🌟', 1, 2, false, 1, 4),
('helpful_received_5', '有用评价', '你的评价获得 5 个「有帮助」', 'advanced', '👍', 5, 3, false, 1, 5),
('reviews_10', '评价达人', '累计评价 10 个 DJ', 'advanced', '🏆', 10, 3, false, 1, 6),
('share_review', '分享评价', '分享你的评价到朋友圈', 'advanced', '📤', 1, 1, true, 5, 7),

-- VIP 任务
('invite_active_user', '邀请活跃用户', '邀请的好友完成首次评价', 'vip', '🎯', 1, 1, true, 10, 8),
('helpful_received_20', '超赞评价', '你的评价获得 20 个「有帮助」', 'vip', '💫', 20, 3, false, 1, 9);

-- ============================================
-- 3. 创建用户任务表
-- ============================================
CREATE TABLE user_tasks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  task_code VARCHAR(50) NOT NULL COMMENT '任务代码',

  -- 进度
  progress INT DEFAULT 0 COMMENT '当前进度',
  target INT NOT NULL COMMENT '目标值',
  completed BOOLEAN DEFAULT FALSE COMMENT '是否完成',
  completed_at TIMESTAMP NULL COMMENT '完成时间',

  -- 奖励
  reward_invites INT NOT NULL COMMENT '奖励邀请码数量',
  reward_claimed BOOLEAN DEFAULT FALSE COMMENT '是否已领取',
  claimed_at TIMESTAMP NULL COMMENT '领取时间',

  -- 重复任务
  repeat_count INT DEFAULT 0 COMMENT '已完成次数（可重复任务）',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY idx_user_task_repeat (user_id, task_code, repeat_count),
  INDEX idx_user (user_id),
  INDEX idx_completed (completed),
  INDEX idx_task_code (task_code),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT='用户任务表';

-- ============================================
-- 4. 创建邀请码表
-- ============================================
CREATE TABLE invite_codes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(32) UNIQUE NOT NULL COMMENT '邀请码',

  -- 创建者
  created_by INT NULL COMMENT '创建者 ID（NULL 为管理员）',
  creator_type ENUM('admin', 'user') DEFAULT 'admin',

  -- 使用限制
  usage_limit INT DEFAULT 1 COMMENT '使用次数限制',
  used_count INT DEFAULT 0 COMMENT '已使用次数',

  -- 有效期
  expires_at TIMESTAMP NULL COMMENT '过期时间（NULL 为永久）',
  is_active BOOLEAN DEFAULT TRUE COMMENT '是否激活',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_code (code),
  INDEX idx_creator (created_by),
  INDEX idx_active (is_active),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT='邀请码表';

-- ============================================
-- 5. 创建 Waitlist 追踪表（可选）
-- ============================================
CREATE TABLE waitlist (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNIQUE NOT NULL COMMENT '对应的 user ID',

  -- 排队信息
  position INT COMMENT '排队位置',
  status ENUM('waiting', 'approved') DEFAULT 'waiting' COMMENT '状态',

  -- 邀请信息
  invite_code_used VARCHAR(32) COMMENT '使用的邀请码',
  approved_at TIMESTAMP NULL COMMENT '批准时间',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_status (status),
  INDEX idx_position (position),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT='Waitlist 追踪表';

-- ============================================
-- 6. 更新现有用户为 full access（兼容性）
-- ============================================
-- 将所有现有用户设置为 full access
UPDATE users SET access_level = 'full', access_granted_at = created_at WHERE access_level = 'waitlist';
