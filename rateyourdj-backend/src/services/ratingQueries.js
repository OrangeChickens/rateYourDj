const expressions = {
  overall_rating: 'COALESCE(ROUND(a.overall_avg, 2), 0)',
  set_rating: 'COALESCE(ROUND(a.set_avg, 2), 0)',
  performance_rating: 'COALESCE(ROUND(a.performance_avg, 2), 0)',
  personality_rating: 'COALESCE(ROUND(a.personality_avg, 2), 0)',
  review_count: 'COALESCE(a.n, 0)',
  would_choose_again_percent: 'COALESCE(ROUND(a.again_n / a.n * 100), 0)',
  weighted_score: 'CASE WHEN a.n > 0 THEN ROUND((a.n * a.overall_avg + 5 * g.global_avg) / (a.n + 5), 2) ELSE 0 END'
};
const from = `djs d LEFT JOIN (
  SELECT dj_id, COUNT(*) AS n, AVG(overall_rating) AS overall_avg,
    AVG(set_rating) AS set_avg, AVG(performance_rating) AS performance_avg,
    AVG(personality_rating) AS personality_avg,
    SUM(CASE WHEN would_choose_again THEN 1 ELSE 0 END) AS again_n
  FROM reviews WHERE status = 'approved' GROUP BY dj_id
) a ON a.dj_id = d.id
CROSS JOIN (SELECT COALESCE(AVG(overall_rating), 0) AS global_avg FROM reviews WHERE status = 'approved') g`;
const fields = Object.keys(expressions);
const RATING_REFRESH_SQL = `UPDATE ${from} SET ` + fields.map(f => `d.${f} = ${expressions[f]}`).join(', ') + ';';
const RATING_AUDIT_SQL = 'SELECT d.id, d.name, d.status, ' + fields.map(f => `d.${f}, ${expressions[f]} AS expected_${f}`).join(', ') + ` FROM ${from}`;
module.exports = { RATING_REFRESH_SQL, RATING_AUDIT_SQL, fields };
