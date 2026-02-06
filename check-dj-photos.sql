-- Check recent DJs with photo URLs
SELECT 
  id,
  name,
  label,
  photo_url,
  created_at
FROM djs 
ORDER BY id DESC 
LIMIT 10;
