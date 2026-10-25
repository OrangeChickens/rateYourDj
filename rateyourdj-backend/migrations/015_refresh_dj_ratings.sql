-- 全量修复缓存评分与热门排序；只重算派生字段，重复执行结果一致。
UPDATE djs d LEFT JOIN (
  SELECT dj_id, COUNT(*) AS n, AVG(overall_rating) AS overall_avg,
    AVG(set_rating) AS set_avg, AVG(performance_rating) AS performance_avg,
    AVG(personality_rating) AS personality_avg,
    SUM(CASE WHEN would_choose_again THEN 1 ELSE 0 END) AS again_n
  FROM reviews WHERE status = 'approved' GROUP BY dj_id
) a ON a.dj_id = d.id
CROSS JOIN (SELECT COALESCE(AVG(overall_rating), 0) AS global_avg FROM reviews WHERE status = 'approved') g SET d.overall_rating = COALESCE(ROUND(a.overall_avg, 2), 0), d.set_rating = COALESCE(ROUND(a.set_avg, 2), 0), d.performance_rating = COALESCE(ROUND(a.performance_avg, 2), 0), d.personality_rating = COALESCE(ROUND(a.personality_avg, 2), 0), d.review_count = COALESCE(a.n, 0), d.would_choose_again_percent = COALESCE(ROUND(a.again_n / a.n * 100), 0), d.weighted_score = CASE WHEN a.n > 0 THEN ROUND((a.n * a.overall_avg + 5 * g.global_avg) / (a.n + 5), 2) ELSE 0 END;
