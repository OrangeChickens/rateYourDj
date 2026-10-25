const { pool } = require('../config/database');
const { fail, id } = require('../utils/djContent');
const styles = value => new Set(String(value || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean));
function rank(rows, favorites, asOf) {
  const followed = new Set(favorites.map(dj => Number(dj.id)));
  const preferred = new Set(favorites.flatMap(dj => [...styles(dj.music_style)]));
  const scored = rows.map(row => {
    const follows = followed.has(Number(row.dj_id));
    const affinity = [...styles(row.music_style)].some(style => preferred.has(style));
    const age = Math.max(0, (asOf - Number(row.created_unix)) / 86400);
    const helpful = Math.min(2, Math.log1p(Math.max(0, Number(row.helpful_count) - Number(row.not_helpful_count))));
    return { row, score: (1 + (follows ? 2 : 0) + (affinity ? 0.75 : 0) + helpful) / Math.pow(2 + age, 0.75), reason: follows ? '你关注的 DJ' : affinity ? '与你关注的 DJ 风格相近' : helpful > 0 ? '有帮助的评价' : '最新评价' };
  }).sort((a,b) => b.score - a.score || Number(b.row.created_unix) - Number(a.row.created_unix) || b.row.id - a.row.id);
  const result = [];
  while (scored.length) {
    let index = 0;
    if (result.length > 1 && result[result.length-1].dj_id === result[result.length-2].dj_id) {
      const next = scored.findIndex(item => item.row.dj_id !== result[result.length-1].dj_id);
      if (next >= 0) index = next;
    }
    const [item] = scored.splice(index, 1);
    result.push({...item.row, recommendation_reason:item.reason});
  }
  return result;
}
function options(query) {
  const page = query.page === undefined ? 1 : id(query.page), limit = query.limit === undefined ? 20 : id(query.limit);
  if (page > 1000 || limit > 50) throw fail('分页参数无效');
  const now = Math.floor(Date.now()/1000), asOf = query.asOf === undefined ? now : id(query.asOf);
  if (asOf > now + 60 || asOf < now - 7*86400) throw fail('信息流已过期，请刷新',400);
  return {page,limit,asOf};
}
async function list(mode, userId, query) {
  if (!['for-you','following'].includes(mode)) throw fail('信息流类型无效');
  if (mode === 'following' && !userId) throw fail('请先登录',401);
  const {page,limit,asOf} = options(query);
  const [favorites] = userId ? await pool.query("SELECT d.id,d.music_style FROM favorites f JOIN djs d ON d.id=f.dj_id WHERE f.user_id=? AND d.status='approved' AND d.merged_into_id IS NULL",[userId]) : [[]];
  const where = "r.status='approved' AND d.status='approved' AND d.merged_into_id IS NULL AND r.created_at <= FROM_UNIXTIME(?)";
  const following = mode === 'following' ? ' AND EXISTS (SELECT 1 FROM favorites f WHERE f.user_id=? AND f.dj_id=r.dj_id)' : '';
  const params = [userId || 0,asOf,...(mode === 'following'?[userId]:[])];
  const [rows] = await pool.query(`SELECT r.id,r.dj_id,r.overall_rating,r.set_rating,r.performance_rating,r.personality_rating,r.would_choose_again,r.comment,r.is_anonymous,r.created_at,
    UNIX_TIMESTAMP(r.created_at) AS created_unix,r.helpful_count,r.not_helpful_count,
    CASE WHEN r.is_anonymous THEN '匿名用户' ELSE u.nickname END AS nickname,
    CASE WHEN r.is_anonymous THEN NULL ELSE u.avatar_url END AS avatar_url,
    d.name AS dj_name,d.photo_url AS dj_photo_url,d.city AS dj_city,d.music_style,
    (SELECT COUNT(*) FROM review_comments c WHERE c.review_id=r.id AND c.status='approved') AS comment_count,
    (SELECT ri.interaction_type FROM review_interactions ri WHERE ri.review_id=r.id AND ri.user_id=? AND ri.interaction_type IN ('helpful','not_helpful') ORDER BY ri.id DESC LIMIT 1) AS user_vote
    FROM reviews r JOIN djs d ON d.id=r.dj_id LEFT JOIN users u ON u.id=r.user_id
    WHERE ${where}${following} ORDER BY r.created_at DESC,r.id DESC LIMIT ? OFFSET ?`,
    [...params,mode === 'for-you'?500:limit,mode === 'for-you'?0:(page-1)*limit]);
  let total, data;
  if (mode === 'for-you') { const ordered=rank(rows,favorites,asOf);total=ordered.length;data=ordered.slice((page-1)*limit,page*limit); }
  else {
    const [[count]]=await pool.query(`SELECT COUNT(*) AS n FROM reviews r JOIN djs d ON d.id=r.dj_id WHERE ${where}${following}`,[asOf,userId]);
    total=count.n;data=rows.map(row=>({...row,recommendation_reason:'你关注的 DJ'}));
  }
  if (data.length) {
    const [tags]=await pool.query(`SELECT review_id,tag_name FROM review_tags WHERE review_id IN (${data.map(()=>'?').join(',')})`,data.map(row=>row.id));
    data=data.map(({created_unix,music_style,...row})=>({...row,
      nickname:row.is_anonymous?'匿名用户':row.nickname,
      avatar_url:row.is_anonymous?null:row.avatar_url?.replace(/^http:/,'https:'),
      dj_photo_url:row.dj_photo_url?.replace(/^http:/,'https:'),tags:tags.filter(tag=>tag.review_id===row.id).map(tag=>tag.tag_name)}));
  }
  return {data,pagination:{page,total,totalPages:Math.ceil(total/limit)},asOf,following_count:favorites.length};
}
module.exports={rank,options,list};
