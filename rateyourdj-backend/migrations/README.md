# 迁移脚本说明

## SQL文件选择

根据你的执行方式选择对应的SQL文件：

### 1. `update_tags_20260206_dms.sql` ✅ 推荐用于DMS
- **适用场景**：阿里云DMS SQL Console
- **特点**：不包含事务语句（START TRANSACTION、COMMIT）
- **优点**：兼容DMS，直接粘贴执行
- **使用方法**：
  1. 登录 https://dms.console.aliyun.com/
  2. 复制此文件全部内容
  3. 粘贴到SQL窗口执行

### 2. `update_tags_20260206.sql` ✅ 推荐用于命令行
- **适用场景**：MySQL命令行、脚本自动化
- **特点**：包含事务保护（失败自动回滚）
- **优点**：更安全，失败不会留下脏数据
- **使用方法**：
  ```bash
  mysql -h host -u user -p database < update_tags_20260206.sql
  ```

---

## 快速开始

### 使用DMS（最简单）
👉 查看 [QUICK_START.md](./QUICK_START.md)

### 使用命令行或自动化脚本
👉 查看 [RDS_MIGRATION_GUIDE.md](./RDS_MIGRATION_GUIDE.md)

---

## 文件清单

```
migrations/
├── README.md                      # 本文件 - 迁移脚本总览
├── QUICK_START.md                 # 快速开始指南（DMS方式）
├── RDS_MIGRATION_GUIDE.md         # 详细迁移指南（所有方式）
├── update_tags_20260206_dms.sql   # DMS版本（无事务）⭐ DMS用这个
├── update_tags_20260206.sql       # 命令行版本（有事务保护）⭐ 命令行用这个
└── migrate-to-rds.sh              # 自动化执行脚本
```

---

## 常见问题

### Q: DMS执行时报错 "不支持事务"？
A: 使用 `update_tags_20260206_dms.sql` 文件，这是专门为DMS准备的无事务版本。

### Q: 两个版本有什么区别？
A:
- **DMS版本**：去掉了 `START TRANSACTION` 和 `COMMIT` 语句，兼容DMS
- **命令行版本**：包含事务保护，失败会自动回滚，更安全

### Q: 哪个版本更安全？
A: 命令行版本（有事务保护）更安全，但DMS版本在实际使用中也很安全：
- SQL语句都是独立的，失败会停止执行
- 可以随时手动回滚（删除新标签，重新插入旧标签）
- 建议执行前先备份数据

### Q: 如何回滚？
A: 执行前请先备份：
```sql
-- 备份查询（执行前在DMS中运行并截图）
SELECT * FROM preset_tags WHERE category IN ('performance', 'personality');
```

回滚时，手动删除新标签并重新插入旧标签，或使用备份的SQL。

---

## 迁移内容

将 performance 和 personality 标签从各10个精简到各5个：

**Performance (表现力) - 5个**
- ✅ 技术精湛 (Technically Skilled)
- ✅ 控场能力强 (Great Crowd Control)
- 🔵 稳定发挥 (Consistent Performance)
- ❌ 失误较多 (Frequent Mistakes)
- ❌ 气氛平淡 (Lackluster Atmosphere)

**Personality (性格) - 5个**
- ✅ 友好 (Friendly)
- ✅ 专业 (Professional)
- 🔵 低调 (Humble)
- ❌ 难沟通 (Hard to Communicate)
- ❌ 不守时 (Often Late)

---

## 执行建议

1. ✅ 选择低峰时段执行（如凌晨）
2. ✅ 执行前先查询并保存当前标签数据
3. ✅ 执行后立即验证结果
4. ✅ 测试小程序"写评价"功能
5. ✅ 保留备份数据至少一周

---

## 技术支持

遇到问题？检查以下几点：
1. 是否使用了正确的SQL文件（DMS用`_dms.sql`）
2. 是否有足够的权限（需要DELETE、INSERT权限）
3. 字符集是否正确（应该是utf8mb4）
4. 查看详细文档：[RDS_MIGRATION_GUIDE.md](./RDS_MIGRATION_GUIDE.md)
