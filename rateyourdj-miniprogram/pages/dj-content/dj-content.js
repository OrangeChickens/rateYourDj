const api = require('../../utils/dj-content');
import { djAPI } from '../../utils/api';
const labels = { sets: 'SET 视频', events: '演出', duplicates: '重复资料' };
Page({
  data: { type: 'sets', djId: null, entryId: null, djName: '', title: '', feed_token: '', previewToken: '', date: '', time: '20:00', city: '', venue: '', source_url: '', reason: '', target_dj_id: null, targetName: '', search: '', candidates: [], searching: false, saving: false, loading: true, error: '', myItems: [], myPage: 1, myMore: false, myLoading: false, myError: '', expected_status: 'pending', isAdmin: false },
  onLoad(options) {
    if (!getApp().globalData.token) { wx.showToast({ title: '请先登录', icon: 'none' }); wx.navigateBack(); return; }
    const type = options.type, djId = Number(options.djId), entryId = options.id ? Number(options.id) : null;
    if (!labels[type] || !Number.isSafeInteger(djId) || djId <= 0 || (options.id && (!Number.isSafeInteger(entryId) || entryId <= 0))) { wx.navigateBack(); return; }
    this.setData({ type, djId, entryId, isAdmin: getApp().globalData.userInfo?.role === 'admin', date: new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10) });
    wx.setNavigationBarTitle({ title: `${entryId ? '编辑' : '提交'}${labels[type]}` });
    this.load();
  },
  async load() {
    this.setData({ loading: true, error: '' });
    try {
      const res = await djAPI.getDetail(this.data.djId);
      if (Number(res.data.id) !== this.data.djId) throw new Error('DJ资料已合并，请返回新的DJ主页操作');
      this.setData({ djName: res.data.name });
      if (this.data.entryId) {
        const entry = (await api.detail(this.data.type, this.data.entryId)).data;
        if (Number(entry.dj_id) !== this.data.djId) throw new Error('内容不属于当前DJ');
        this.setData({ title: entry.title || '', feed_token: entry.feed_token || entry.reference_text || '', date: (entry.starts_at || '').slice(0,10), time: (entry.starts_at || '').slice(11,16), city: entry.city || '', venue: entry.venue || '', source_url: entry.source_url || '', expected_status: entry.status, previewToken: entry.feed_token || '' });
      } else { await this.loadMine(); }
    } catch (error) { this.setData({ error: error.message || '加载失败' }); }
    finally { this.setData({ loading: false }); }
  },
  onInput(e) {
    const field = e.currentTarget.dataset.field;
    if (['title','feed_token','date','time','city','venue','source_url','reason','search'].includes(field)) this.setData({ [field]: e.detail.value });
  },
  async searchTarget() {
    const query = this.data.search.trim(); if (!query || this.data.searching) return;
    this.setData({ searching: true, candidates: [] });
    try { const res = await djAPI.search(query); this.setData({ candidates: res.data.filter(dj => Number(dj.id) !== this.data.djId) }); if (!this.data.candidates.length) wx.showToast({ title: '没有找到其他DJ', icon: 'none' }); }
    catch (error) { wx.showToast({ title: error.message || '搜索失败', icon: 'none' }); }
    finally { this.setData({ searching: false }); }
  },
  selectTarget(e) { const item = this.data.candidates.find(dj => Number(dj.id) === Number(e.currentTarget.dataset.id)); if (item) this.setData({ target_dj_id: Number(item.id), targetName: item.name }); },
  async submit() {
    if (this.data.saving || this.data.loading || this.data.error) return;
    const d = this.data;
    const payload = d.type === 'sets' ? { title: d.title, feed_token: d.feed_token } : d.type === 'events' ? { title: d.title, starts_at: `${d.date} ${d.time}`, city: d.city, venue: d.venue, source_url: d.source_url } : { target_dj_id: d.target_dj_id, reason: d.reason };
    this.setData({ saving: true });
    try {
      const res = d.entryId ? await api.update(d.type, d.entryId, { ...payload, expected_status: d.expected_status }) : await api.create(d.djId, d.type, payload);
      getApp().globalData.needRefreshDJDetail = true;
      if (res.data?.status === 'pending') {
        wx.showModal({ title: '已提交审核', content: '通过后才会公开展示。可在本页下方“我的提交”查看状态和原因。', showCancel: false });
        this.setData({ title: '', feed_token: '', reason: '' }); await this.loadMine();
      } else { wx.showToast({ title: '已保存' }); wx.navigateBack(); }
    } catch (error) { wx.showModal({ title: '未保存', content: error.message || '请重试', showCancel: false }); }
    finally { this.setData({ saving: false }); }
  },
  async withdraw() {
    if (this.data.saving || !this.data.entryId) return;
    const confirm = await new Promise(resolve => wx.showModal({ title: '下架内容', editable: true, placeholderText: '请输入下架原因', success: resolve, fail: () => resolve({ confirm: false }) }));
    if (!confirm.confirm || !confirm.content?.trim()) return;
    this.setData({ saving: true });
    try { await api.moderate(this.data.type, this.data.entryId, { status: 'rejected', reason: confirm.content, expected_status: this.data.expected_status }); getApp().globalData.needRefreshDJDetail = true; wx.navigateBack(); }
    catch (error) { wx.showModal({ title: '未下架', content: error.message || '请重试', showCancel: false }); }
    finally { this.setData({ saving: false }); }
  },
  async loadMine(append = false) {
    if (this.data.myLoading) return;
    this.setData({ myLoading: true, myError: '' });
    const page = append ? this.data.myPage + 1 : 1;
    try { const res = await api.mine(this.data.djId, this.data.type, page); this.setData({ myItems: append ? [...this.data.myItems, ...res.data] : res.data, myPage: page, myMore: page < res.pagination.totalPages }); }
    catch (error) { this.setData({ myError: error.message || '提交记录加载失败' }); }
    finally { this.setData({ myLoading: false }); }
  },
  retryMine() { this.loadMine(); },
  moreMine() { if (this.data.myMore) this.loadMine(true); }
});
