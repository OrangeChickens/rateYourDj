const Content = require('../models/DJContent');
const User = require('../models/User');
const v = require('../utils/djContent');
const mergeService = require('../services/djMerge');
const shareCode = require('../services/djShareCode');
const handler = f => async (req, res, next) => { try { await f(req, res); } catch (error) { next(error); } };
const state = value => { if (!['pending','approved','rejected'].includes(value)) throw v.fail('状态无效'); return value; };
exports.list = handler(async (req, res) => {
  const type = v.kind(req.params.type); if (type === 'duplicates') throw v.fail('请在审核页查看重复资料');
  const period = req.query.period || 'upcoming'; if (!['upcoming','past'].includes(period)) throw v.fail('演出时间筛选无效');
  res.json({ success: true, ...await Content.listPublic(type, v.id(req.params.djId), period, v.paging(req.query)) });
});
exports.create = handler(async (req, res) => {
  const type = v.kind(req.params.type), djId = v.id(req.params.djId);
  const user = await User.findById(req.user.userId); if (!user) throw v.fail('用户不存在', 401);
  const data = type === 'sets' ? v.setData(req.body, user.role === 'admin') : type === 'events' ? v.eventData(req.body) : { target_dj_id: v.id(req.body.target_dj_id), reason: v.text(req.body.reason, '重复依据', 500) };
  const result = await Content.create(type, djId, req.user.userId, data, user.role === 'admin');
  res.status(201).json({ success: true, data: result });
});
exports.adminList = handler(async (req, res) => res.json({ success: true, ...await Content.listAdmin(v.kind(req.params.type), state(req.query.status || 'pending'), v.paging(req.query)) }));
exports.mine = handler(async (req, res) => res.json({ success: true, ...await Content.listAdmin(v.kind(req.params.type), null, v.paging(req.query), req.user.userId, v.id(req.query.djId)) }));
exports.detail = handler(async (req, res) => res.json({ success: true, data: await Content.detail(v.kind(req.params.type), v.id(req.params.id)) }));
exports.update = handler(async (req, res) => {
  const type = v.kind(req.params.type); if (type === 'duplicates') throw v.fail('重复申请不可修改');
  const data = type === 'sets' ? v.setData(req.body) : v.eventData(req.body);
  await Content.update(type, v.id(req.params.id), data, state(req.body.expected_status));
  res.json({ success: true });
});
exports.moderate = handler(async (req, res) => {
  const status = state(req.body.status); if (status === 'pending') throw v.fail('请选择通过或拒绝');
  const reason = status === 'rejected' ? v.text(req.body.reason, '拒绝或下架原因', 500) : '';
  await Content.moderate(v.kind(req.params.type), v.id(req.params.id), status, reason, req.user.userId, state(req.body.expected_status));
  res.json({ success: true });
});
exports.merge = handler(async (req, res) => res.json({ success: true, data: await mergeService.merge(v.id(req.params.id), req.user.userId) }));
exports.code = handler(async (req, res) => {
  const id = v.id(req.params.djId); await Content.approvedDJ(require('../config/database').pool, id);
  const data = await shareCode.getCode(id, req.query.env || 'release');
  res.set('Content-Type', data.subarray(0, 3).toString('hex') === 'ffd8ff' ? 'image/jpeg' : 'image/png'); res.set('Cache-Control', 'public, max-age=3600'); res.send(data);
});
