const api = require('../../utils/dj-content');
import { djAPI } from '../../utils/api';
Page({
  data: { djId: null, djName: '', period: 'upcoming', rows: [], page: 1, hasMore: false, loading: false, error: '' },
  onLoad(options) {
    const djId = Number(options.djId);
    if (!/^[1-9]\d*$/.test(options.djId || '') || !Number.isSafeInteger(djId)) { this.setData({ error: 'DJ ID 无效' }); return; }
    this.setData({ djId });
    this.loadProfile();
  },
  onShow() { if (this._loaded) this.load(); },
  async loadProfile() {
    const request = this._profileRequest = (this._profileRequest || 0) + 1;
    this.setData({ loading: true, error: '' });
    try {
      const res = await djAPI.getDetail(this.data.djId);
      if (request !== this._profileRequest) return;
      this.setData({ djId: Number(res.data.id), djName: res.data.name });
      this._profileLoaded = true;
      await this.load();
    } catch (error) { if (request === this._profileRequest) this.setData({ loading: false, error: error.message || 'DJ资料加载失败' }); }
  },
  async load(append = false) {
    if (!this.data.djId || (append && (this.data.loading || !this.data.hasMore || this.data.error))) return;
    const request = this._request = (this._request || 0) + 1;
    const page = append ? this.data.page + 1 : 1;
    this.setData({ loading: true, error: '', ...(append ? {} : { rows: [], hasMore: false }) });
    try {
      const res = await api.list(this.data.djId, 'events', { period: this.data.period, page, limit: 20 });
      if (request !== this._request) return;
      this.setData({ rows: append ? [...this.data.rows, ...res.data] : res.data, page, hasMore: page < res.pagination.totalPages });
      this._loaded = true;
    } catch (error) { if (request === this._request) this.setData({ error: error.message || '演出加载失败' }); }
    finally { if (request === this._request) this.setData({ loading: false }); }
  },
  changePeriod(e) {
    const period = e.currentTarget.dataset.period;
    if (!['upcoming', 'past'].includes(period) || period === this.data.period) return;
    this.setData({ period });
    if (this._profileLoaded) this.load();
  },
  more() { this.load(true); },
  retry() { if (this._profileLoaded) this.load(); else if (this.data.djId) this.loadProfile(); },
  viewEvent(e) { wx.navigateTo({ url: `/pages/event-detail/event-detail?id=${e.currentTarget.dataset.id}` }); },
  onUnload() { this._profileRequest = (this._profileRequest || 0) + 1; this._request = (this._request || 0) + 1; }
});
