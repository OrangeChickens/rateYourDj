const { pool } = require('../config/database');
const v = require('../utils/djContent');
const fields = "e.id, e.dj_id, e.title, DATE_FORMAT(e.starts_at, '%Y-%m-%d %H:%i') AS starts_at, e.city, e.venue, e.address, e.latitude, e.longitude, e.source_url";
const visible = "e.status='approved' AND d.status='approved' AND d.merged_into_id IS NULL";
async function attachLineups(db, rows) {
  if (!rows.length) return rows;
  const [djs] = await db.query(`SELECT ed.event_id, d.id, d.name FROM dj_event_djs ed JOIN djs d ON d.id=ed.dj_id WHERE ed.event_id IN (${rows.map(() => '?').join(',')}) AND d.status='approved' AND d.merged_into_id IS NULL ORDER BY d.id`, rows.map(row => row.id));
  for (const row of rows) row.djs = djs.filter(dj => dj.event_id === row.id).map(({id,name}) => ({id,name}));
  return rows;
}
function date(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw v.fail('日期格式无效');
  const d = new Date(value+'T00:00:00Z');
  if (!Number.isFinite(d.getTime()) || d.toISOString().slice(0,10) !== value) throw v.fail('日期无效');
  return value;
}
function filters(query) {
  const today = new Date(Date.now()+8*3600000).toISOString().slice(0,10);
  const from = date(query.from || today), to = date(query.to || from);
  const days = (Date.parse(to)-Date.parse(from))/86400000;
  if (days < 0 || days > 92) throw v.fail('日期范围最多93天');
  return {from,to,city:v.text(query.city,'城市',50,true)};
}
async function list(query) {
  const f = filters(query), p = v.paging(query);
  let condition = `${visible} AND e.starts_at >= ? AND e.starts_at < DATE_ADD(?, INTERVAL 1 DAY)`;
  const params = [f.from,f.to];
  if (f.city) { condition += ' AND e.city = ?'; params.push(f.city); }
  const [rows] = await pool.query(`SELECT ${fields} FROM dj_events e JOIN djs d ON d.id=e.dj_id WHERE ${condition} ORDER BY e.starts_at, e.id LIMIT ? OFFSET ?`, [...params,p.limit,p.offset]);
  const [[count]] = await pool.query(`SELECT COUNT(*) AS total FROM dj_events e JOIN djs d ON d.id=e.dj_id WHERE ${condition}`,params);
  await attachLineups(pool,rows);
  return {data:rows,pagination:{page:p.page,total:count.total,totalPages:Math.ceil(count.total/p.limit)}};
}
async function cities() {
  const [rows] = await pool.query(`SELECT DISTINCT e.city FROM dj_events e JOIN djs d ON d.id=e.dj_id WHERE ${visible} ORDER BY e.city`);
  return rows.map(row=>row.city);
}
async function detail(id) {
  const [[row]] = await pool.query(`SELECT ${fields} FROM dj_events e JOIN djs d ON d.id=e.dj_id WHERE e.id=? AND ${visible}`,[id]);
  if (!row) throw v.fail('活动不存在或尚未公开',404);
  await attachLineups(pool,[row]);return row;
}
async function update(id,data,status,djIds) {
  const c=await pool.getConnection();
  try {
    await c.beginTransaction();
    // Lock DJs in ID order before the event, matching create/merge lock order.
    const [[snapshot]]=await c.query('SELECT dj_id FROM dj_events WHERE id=?',[id]);
    if(!snapshot) throw v.fail('活动不存在',404);
    const ids=v.lineup(djIds, snapshot.dj_id);
    for(const dj of ids || [snapshot.dj_id]) await require('./DJContent').approvedDJ(c,dj,true);
    const [[entry]]=await c.query('SELECT dj_id,status FROM dj_events WHERE id=? FOR UPDATE',[id]);
    if(!entry || entry.status!==status || entry.dj_id!==snapshot.dj_id) throw v.fail('活动已变化，请刷新后重试',409);
    const keys=Object.keys(data);
    await c.query(`UPDATE dj_events SET ${keys.map(key=>key+'=?').join(',')} WHERE id=?`,[...keys.map(key=>data[key]),id]);
    if(ids) {
      await c.query('DELETE FROM dj_event_djs WHERE event_id=?',[id]);
      for(const dj of ids) await c.query('INSERT INTO dj_event_djs(event_id,dj_id) VALUES(?,?)',[id,dj]);
    }
    await c.commit();
  } catch(error) {await c.rollback();throw error;} finally {c.release();}
}
module.exports={attachLineups,filters,list,cities,detail,update};
