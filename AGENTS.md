# RateYourDJ 开发与发布

先读 CLAUDE.md。共享开发流程见 docs/dev-workflow.md（原始工作目录维护）。
用户批准范围后实施；commit/push/merge 和生产部署沿用聊天中的明确授权，不重复索要同一许可。
不得混入原始工作目录中的其他未提交修改。

DJ SET、演出、重复资料与分享码操作见 [docs/dj-content-tools.md](docs/dj-content-tools.md)。

## Deploy Configuration

- Platform: 阿里云 ECS，SSH + PM2；后端 API 与微信小程序。
- Production URL: https://rateyourdj.pbrick.cn
- Deploy workflow: 手动触发，用户授权后由 Codex 执行。
- SSH: `ssh -i ~/.ssh/id_ed25519 root@139.196.93.148`，保留主机密钥校验。
- Backend directory: `/var/www/rateYourDj/rateyourdj-backend/`
- PM2 application: `rateyourdj-api`
- Merge method: squash（GitHub PR，仓库允许）。
- Pre-merge: `node --test tests/*.test.cjs`；小程序微信CLI编译/上传检查。
- Deploy trigger: 核对获准的 main 提交，服务器 fast-forward 到该提交，核对迁移目标后执行 `bash scripts/sync-to-rds.sh`，再 `pm2 restart rateyourdj-api`。
- Deploy status: 服务器 HEAD 等于获准 merge SHA，PM2 online。
- Health check: https://rateyourdj.pbrick.cn/health 和该批接口只读冒烟。
- Ratings audit: `cd /var/www/rateYourDj/rateyourdj-backend && node scripts/audit-ratings.js`，mismatched 必须为0。
- Staging: 用户明确暂不搭建。后端先行生产部署须有对应批次授权。
- Database: 所有变更使用 migrations/NNN_*.sql；015仅重算DJ派生评分，014新增审核反馈字段；016新增DJ内容/演出/重复申报与合并映射（不自动合并现存资料）。
- Rollback: 保留前一提交；自动回滚未配置，不自动回退业务数据或撤销数据库迁移。
- WeChat: AppID wx83a9ba4ad10f5bc0；版本来源 rateyourdj-miniprogram/config/version.js。
- WeChat upload: 用户授权直接上传已核对范围的版本；上传成功、设置体验版、真机验收、正式审核/发布分别记录。正式审核及发布须另获确认。
