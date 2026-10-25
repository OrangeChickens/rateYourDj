const { pool } = require('../config/database');
const { RATING_REFRESH_SQL } = require('./ratingQueries');
const { fail } = require('../utils/djContent');
async function merge(reportId, adminId) {
  const c = await pool.getConnection(); let locked = false;
  try {
    const [[lock]] = await c.query("SELECT GET_LOCK('rateyourdj:rating-refresh', 15) AS acquired");
    if (Number(lock.acquired) !== 1) throw fail('评分更新繁忙，请稍后再试', 409);
    locked = true;
    await c.beginTransaction();
    const [[report]] = await c.query("SELECT * FROM dj_duplicate_reports WHERE id = ? AND status = 'pending' FOR UPDATE", [reportId]);
    if (!report) throw fail('申请不存在或已处理', 409);
    const source = report.dj_id, target = report.target_dj_id;
    const [djs] = await c.query('SELECT id, status, merged_into_id FROM djs WHERE id IN (?, ?) ORDER BY id FOR UPDATE', [source, target]);
    if (source === target || djs.length !== 2 || djs.some(dj => dj.status !== 'approved' || dj.merged_into_id)) throw fail('DJ状态已变化，请重新核对资料', 409);
    const [moved] = await c.query('UPDATE reviews SET dj_id = ? WHERE dj_id = ?', [target, source]);
    // Review IDs stay unchanged, preserving replies, votes, tags, moderation history and share links.
    await c.query('INSERT IGNORE INTO favorites (user_id, dj_id) SELECT user_id, ? FROM favorites WHERE dj_id = ?', [target, source]);
    await c.query('DELETE FROM favorites WHERE dj_id = ?', [source]);
    await c.query('UPDATE dj_sets SET dj_id = ? WHERE dj_id = ?', [target, source]);
    await c.query('UPDATE dj_events SET dj_id = ? WHERE dj_id = ?', [target, source]);
    // Keep the source row and its original edit requests for audit; pending edits must not revive it.
    await c.query("UPDATE dj_edit_requests SET status = 'rejected' WHERE dj_id = ? AND status = 'pending'", [source]);
    await c.query('UPDATE djs SET merged_into_id = ? WHERE merged_into_id = ?', [target, source]);
    await c.query("UPDATE djs SET merged_into_id = ?, status = 'rejected' WHERE id = ?", [target, source]);
    await c.query("UPDATE dj_duplicate_reports SET status = 'approved', moderated_by = ?, moderation_reason = NULL WHERE id = ?", [adminId, reportId]);
    await c.query("UPDATE dj_duplicate_reports SET status = 'rejected', moderated_by = ?, moderation_reason = '涉及的资料已合并，请重新核对' WHERE id <> ? AND status = 'pending' AND (dj_id = ? OR target_dj_id = ?)", [adminId, reportId, source, source]);
    await c.query(RATING_REFRESH_SQL);
    await c.commit();
    return { source_dj_id: source, target_dj_id: target, moved_reviews: moved.affectedRows };
  } catch (error) { await c.rollback(); throw error; }
  finally { try { if (locked) await c.query("SELECT RELEASE_LOCK('rateyourdj:rating-refresh')"); } finally { c.release(); } }
}
async function resolveDJ(id) {
  const seen = new Set(); let current = Number(id);
  for (let hop = 0; hop < 100; hop++) {
    if (seen.has(current)) throw fail('DJ合并关系异常，请联系管理员', 500);
    seen.add(current);
    const [[row]] = await pool.query('SELECT id, merged_into_id FROM djs WHERE id = ?', [current]);
    if (!row) return current;
    if (!row.merged_into_id) return current;
    current = Number(row.merged_into_id);
  }
  throw fail('DJ合并关系过长，请联系管理员', 500);
}
module.exports = { merge, resolveDJ };
