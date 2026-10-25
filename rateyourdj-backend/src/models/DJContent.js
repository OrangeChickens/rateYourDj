const { pool } = require('../config/database');
const { fail } = require('../utils/djContent');
const tables = { sets: 'dj_sets', events: 'dj_events', duplicates: 'dj_duplicate_reports' };
const table = type => { if (!tables[type]) throw fail('内容类型无效'); return tables[type]; };
async function approvedDJ(db, id, lock = false) {
  const [[dj]] = await db.query(`SELECT id, name, status, merged_into_id FROM djs WHERE id = ?${lock ? ' FOR UPDATE' : ''}`, [id]);
  if (!dj || dj.status !== 'approved' || dj.merged_into_id) throw fail('DJ不存在、不可查看或已合并，请刷新页面', 404);
  return dj;
}
async function create(type, djId, userId, data, admin, lineupIds = null) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const eventDJs = type === 'events' ? lineupIds || [djId] : [djId];
    for (const dj of eventDJs) await approvedDJ(connection, dj, true);
    if (type === 'duplicates') {
      if (data.target_dj_id === djId) throw fail('不能标记同一个DJ');
      await approvedDJ(connection, data.target_dj_id);
    }
    const field = type === 'sets' ? 'feed_token' : type === 'duplicates' ? 'target_dj_id' : null;
    if (field && data[field]) {
      const [[existing]] = await connection.query(`SELECT id FROM ${table(type)} WHERE dj_id = ? AND ${field} = ? AND status IN ('pending','approved') LIMIT 1`, [djId, data[field]]);
      if (existing) throw fail('该内容或重复资料申请已存在', 409);
    }
    const [[daily]] = await connection.query(`SELECT COUNT(*) AS n FROM ${table(type)} WHERE user_id = ? AND created_at >= UTC_TIMESTAMP() - INTERVAL 1 DAY`, [userId]);
    if (!admin && daily.n >= 10) throw fail('今天提交较多，请明天再试', 429);
    const status = admin && type !== 'duplicates' ? 'approved' : 'pending';
    const keys = Object.keys(data);
    const [result] = await connection.query(`INSERT INTO ${table(type)} (dj_id, user_id, ${keys.join(',')}, status, moderated_by) VALUES (?, ?, ${keys.map(() => '?').join(',')}, ?, ?)`, [djId, userId, ...keys.map(k => data[k]), status, status === 'approved' ? userId : null]);
    if (type === 'events') for (const dj of eventDJs) await connection.query('INSERT INTO dj_event_djs(event_id,dj_id) VALUES(?,?)', [result.insertId, dj]);
    await connection.commit();
    return { id: result.insertId, status };
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
}
async function listPublic(type, djId, period, paging) {
  await approvedDJ(pool, djId);
  const params = [djId];
  let condition = type === 'events' ? "EXISTS (SELECT 1 FROM dj_event_djs ed WHERE ed.event_id=c.id AND ed.dj_id=?) AND c.status = 'approved'" : "c.dj_id = ? AND c.status = 'approved'";
  if (type === 'sets') condition += " AND NOT EXISTS (SELECT 1 FROM dj_sets older WHERE older.dj_id = c.dj_id AND older.feed_token = c.feed_token AND older.status = 'approved' AND older.id < c.id)";
  if (type === 'events') condition += ` AND EXISTS (SELECT 1 FROM djs owner WHERE owner.id=c.dj_id AND owner.status='approved' AND owner.merged_into_id IS NULL) AND c.starts_at ${period === 'past' ? '<' : '>='} (UTC_TIMESTAMP() + INTERVAL 8 HOUR)`;
  const fields = type === 'sets' ? 'c.id, c.title, c.feed_token' : "c.id, c.title, DATE_FORMAT(c.starts_at, '%Y-%m-%d %H:%i') AS starts_at, c.city, c.venue, c.source_url, c.address, c.latitude, c.longitude";
  const order = type === 'events' ? `c.starts_at ${period === 'past' ? 'DESC' : 'ASC'}, c.id DESC` : 'c.id DESC';
  const [rows] = await pool.query(`SELECT ${fields} FROM ${table(type)} c WHERE ${condition} ORDER BY ${order} LIMIT ? OFFSET ?`, [...params, paging.limit, paging.offset]);
  const [[count]] = await pool.query(`SELECT COUNT(*) AS total FROM ${table(type)} c WHERE ${condition}`, params);
  if (type === 'events') await require('./Events').attachLineups(pool, rows);
  return paged(rows, count.total, paging);
}
function paged(data, total, paging) { return { data, pagination: { page: paging.page, total, totalPages: Math.ceil(total / paging.limit) } }; }
async function listAdmin(type, status, paging, userId = null, djId = null) {
  let condition = userId ? 'c.user_id = ?' : 'c.status = ?';
  const params = [userId || status];
  if (djId) { condition += ' AND c.dj_id = ?'; params.push(djId); }
  const extra = type === 'duplicates' ? ', t.name AS target_name, t.review_count AS target_review_count' : '';
  const join = type === 'duplicates' ? ' JOIN djs t ON t.id = c.target_dj_id' : '';
  const fields = type === 'events' ? ", DATE_FORMAT(c.starts_at, '%Y-%m-%d %H:%i') AS starts_at" : '';
  const [rows] = await pool.query(`SELECT c.*, d.name AS dj_name, d.review_count AS source_review_count${extra}${fields} FROM ${table(type)} c JOIN djs d ON d.id = c.dj_id${join} WHERE ${condition} ORDER BY c.id DESC LIMIT ? OFFSET ?`, [...params, paging.limit, paging.offset]);
  const [[count]] = await pool.query(`SELECT COUNT(*) AS total FROM ${table(type)} c WHERE ${condition}`, params);
  if (type === 'events') await require('./Events').attachLineups(pool, rows);
  return paged(rows, count.total, paging);
}
async function detail(type, id) {
  const [[row]] = await pool.query(`SELECT c.*${type === 'events' ? ", DATE_FORMAT(c.starts_at, '%Y-%m-%d %H:%i') AS starts_at" : ''} FROM ${table(type)} c WHERE c.id = ?`, [id]);
  if (!row) throw fail('内容不存在', 404);
  if (type === 'events') await require('./Events').attachLineups(pool, [row]);
  return row;
}
async function update(type, id, data, expectedStatus) {
  const keys = Object.keys(data);
  const [r] = await pool.query(`UPDATE ${table(type)} c JOIN djs d ON d.id = c.dj_id SET ${keys.map(k => `c.${k} = ?`).join(',')} WHERE c.id = ? AND c.status = ? AND d.status = 'approved' AND d.merged_into_id IS NULL`, [...keys.map(k => data[k]), id, expectedStatus]);
  if (!r.affectedRows) throw fail('内容已变化或DJ不可用，请刷新后重试', 409);
}
async function moderate(type, id, status, reason, adminId, expectedStatus) {
  if (type === 'duplicates' && status === 'approved') throw fail('重复资料必须通过合并流程处理');
  if (type === 'sets' && status === 'approved') {
    const entry = await detail(type, id);
    if (!entry.feed_token) throw fail('请先编辑并补齐视频号token，再通过审核');
  }
  const [r] = await pool.query(`UPDATE ${table(type)} c JOIN djs d ON d.id = c.dj_id SET c.status = ?, c.moderation_reason = ?, c.moderated_by = ? WHERE c.id = ? AND c.status = ? AND d.status = 'approved' AND d.merged_into_id IS NULL${type === 'sets' && status === 'approved' ? ' AND c.feed_token IS NOT NULL' : ''}`, [status, reason || null, adminId, id, expectedStatus]);
  if (!r.affectedRows) throw fail('内容已变化或DJ不可用，请刷新后重试', 409);
}
module.exports = { approvedDJ, create, listPublic, listAdmin, detail, update, moderate, paged };
