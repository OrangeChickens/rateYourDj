-- 012: 添加 name_initial 列，支持中文DJ名字首字母检索
-- 用于存储DJ名字的拼音首字母（大写），中文名通过pinyin库转换

ALTER TABLE djs ADD COLUMN name_initial CHAR(1) DEFAULT NULL AFTER name;

-- 添加索引加速字母筛选查询
CREATE INDEX idx_djs_name_initial ON djs(name_initial);
