const api = require('../../utils/dj-content');
Page({
  data: { type: 'sets', status: 'pending', statusIndex: 0, statuses: ['待审核','已通过','已拒绝 / 下架'], rows: [], loading: false, error: '', page: 1, hasMore: false, busy: false, previewId: null, videoError: '' },
  onLoad() { if (getApp().globalData.userInfo?.role !== 'admin') { wx.navigateBack(); return; } this.load(); },
  onShow() { if (this._loaded) this.load(); },
  async load(append = false) {
    if (append && (this.data.loading || !this.data.hasMore || this.data.error)) return;
    const request = this._request = (this._request || 0) + 1;
    const page = append ? this.data.page + 1 : 1;
    this.setData({ loading: true, error: '', previewId: null, ...(append ? {} : { rows: [], hasMore: false }) });
    try { const res = await api.adminList(this.data.type, this.data.status, page); if (request !== this._request) return; this.setData({ rows: append ? [...this.data.rows, ...res.data] : res.data, page, hasMore: page < res.pagination.totalPages }); this._loaded = true; }
    catch (error) { if (request === this._request) this.setData({ error: error.message || '加载失败' }); }
    finally { if (request === this._request) this.setData({ loading: false }); }
  },
  changeType(e) { if (this.data.busy) return; this.setData({ type: e.currentTarget.dataset.type }); this.load(); },
  changeStatus(e) { if (this.data.busy) return; const index = Number(e.detail.value); this.setData({ statusIndex: index, status: ['pending','approved','rejected'][index] }); this.load(); },
  more() { this.load(true); },
  retry() { this.load(); },
  preview(e) { this.setData({ previewId: this.data.previewId === e.currentTarget.dataset.id ? null : e.currentTarget.dataset.id, videoError: '' }); },
  onVideoError() { this.setData({ videoError: '视频暂时无法播放，请勿直接通过，先核实引用内容。' }); },
  viewDJ(e) { wx.navigateTo({ url: `/pages/dj-detail/dj-detail?id=${e.currentTarget.dataset.id}` }); },
  edit(e) { const item = this.data.rows.find(r => Number(r.id) === Number(e.currentTarget.dataset.id)); if (item) wx.navigateTo({ url: `/pages/dj-content/dj-content?type=${this.data.type}&djId=${item.dj_id}&id=${item.id}` }); },
  async action(e) {
    if (this.data.busy) return;
    const type = this.data.type;
    const item = this.data.rows.find(r => Number(r.id) === Number(e.currentTarget.dataset.id)); if (!item) return;
    const approve = e.currentTarget.dataset.status === 'approved';
    this.setData({ busy: true });
    try {
      const merge = approve && type === 'duplicates';
      const confirm = await new Promise(resolve => wx.showModal({
        title: merge ? '确认合并DJ资料' : approve ? '确认通过' : '拒绝 / 下架',
        content: merge ? `将「${item.dj_name}」合并到「${item.target_name}」。评价、收藏、SET和演出迁移到目标，原主页跳转到目标。相同用户的多条评价保留。此操作没有一键撤销，请先核对两份资料。` : approve ? '通过后将在DJ主页公开展示。' : '',
        editable: !approve, placeholderText: '请输入原因，提交者可查看',
        success: resolve, fail: () => resolve({ confirm: false })
      }));
      if (!confirm.confirm) return;
      if (!approve && !confirm.content?.trim()) { wx.showToast({ title: '必须填写原因', icon: 'none' }); return; }
      if (merge) await api.merge(item.id);
      else await api.moderate(type, item.id, { status: approve ? 'approved' : 'rejected', reason: confirm.content || '', expected_status: item.status });
      getApp().globalData.needRefreshDJDetail = true;
      wx.showToast({ title: merge ? '合并完成' : '已处理' }); await this.load();
    } catch (error) { wx.showModal({ title: '未完成', content: error.message || '请刷新后重试', showCancel: false }); }
    finally { this.setData({ busy: false }); }
  },
  onUnload() { this._request = (this._request || 0) + 1; }
});
