-- 将分享评价任务改为不可重复（只能完成一次）
UPDATE task_configs
SET repeatable = FALSE,
    max_repeats = 1
WHERE task_code = 'share_review';

-- 验证更新
SELECT task_code, task_name, repeatable, max_repeats, reward_invites
FROM task_configs
WHERE task_code = 'share_review';
