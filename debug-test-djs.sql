-- 查询所有名为 test 的 DJ 信息
SELECT 
  id,
  name,
  city,
  label,
  photo_url,
  created_at
FROM djs 
WHERE name = 'test' OR name LIKE 'test%'
ORDER BY id DESC;
