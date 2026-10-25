const fail = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });
function id(value) {
  if (!/^[1-9]\d*$/.test(String(value)) || !Number.isSafeInteger(Number(value))) throw fail('ID无效');
  return Number(value);
}
function text(value, label, max, optional = false) {
  if (optional && (value === undefined || value === null || value === '')) return '';
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) throw fail(`${label}不能为空且最多${max}字`);
  return value.trim();
}
function setData(body, requireToken = true) {
  const raw = text(body.feed_token, '视频号引用内容', 1000);
  const tokens = raw.match(/token\/[^\s\"'<>，。；）)]+/g) || [];
  if (!requireToken && tokens.length === 0) return { title: text(body.title, '标题', 100), feed_token: null, reference_text: raw };
  if (tokens.length !== 1 || tokens[0].length > 200 || !/^token\/[A-Za-z0-9_-]+$/.test(tokens[0])) throw fail('请粘贴一条视频号的token引用内容');
  return { title: text(body.title, '标题', 100), feed_token: tokens[0], reference_text: raw };
}
function eventData(body) {
  const starts = text(body.starts_at, '北京时间', 19).replace('T', ' ');
  const m = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})(?::00)?$/.exec(starts);
  if (!m || Number(m[1]) < 2020 || Number(m[1]) > 2100) throw fail('请输入有效的演出日期和时间');
  const date = new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0,16) !== `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}`) throw fail('演出时间无效');
  const source = text(body.source_url, '来源链接', 500, true);
  if (source) {
    let url; try { url = new URL(source); } catch (_) { throw fail('来源链接必须是完整的HTTPS链接'); }
    if (url.protocol !== 'https:' || url.username || url.password) throw fail('来源链接必须是完整的HTTPS链接');
  }
  return { title: text(body.title, '演出名称', 100), starts_at: `${m[1]}-${m[2]}-${m[3]} ${m[4]}:${m[5]}:00`, city: text(body.city, '城市', 50), venue: text(body.venue, '场地', 150), source_url: source || null };
}
function kind(value) {
  if (!['sets', 'events', 'duplicates'].includes(value)) throw fail('内容类型无效');
  return value;
}
function paging(query) {
  const page = query.page === undefined ? 1 : id(query.page);
  const limit = query.limit === undefined ? 20 : id(query.limit);
  if (page > 10000 || limit > 50) throw fail('分页参数无效');
  return { page, limit, offset: (page - 1) * limit };
}
module.exports = { fail, id, text, setData, eventData, kind, paging };
