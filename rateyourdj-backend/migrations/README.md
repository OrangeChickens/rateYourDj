# 数据库迁移脚本

## 迁移文件

| 文件 | 说明 |
|------|------|
| `001_add_comments.sql` | 添加评论功能相关表 |
| `002_create_reviewer_invite_code.sql` | 创建评测者邀请码系统 |
| `003_update_tags.sql` | 精简表现力和性格标签（各10→5个） |

## 工具脚本

| 文件 | 说明 |
|------|------|
| `pre-migration-check.sql` | 迁移前检查脚本 |
| `post-migration-check.sql` | 迁移后验证脚本 |

## 命名规范

**格式**: `NNN_descriptive_name.sql`

- `NNN`: 零填充3位数字（001, 002, 003...）
- `descriptive_name`: snake_case 描述
- 始终从最高编号递增

## 使用方式

### 本地执行
```bash
mysql -u root -p rateyourdj < migrations/003_update_tags.sql
```

### 生产环境部署
```bash
cd rateyourdj-backend
./scripts/sync-to-rds.sh
```

`sync-to-rds.sh` 会自动跟踪已应用的迁移（通过 `schema_migrations` 表），不会重复执行。

## 新建迁移

1. 检查当前最大编号：`ls -1 [0-9][0-9][0-9]_*.sql`
2. 创建下一个编号的文件：`touch 004_your_change.sql`
3. 编写 SQL（包含注释和验证查询）
4. 本地测试通过后，使用 `sync-to-rds.sh` 部署到生产
