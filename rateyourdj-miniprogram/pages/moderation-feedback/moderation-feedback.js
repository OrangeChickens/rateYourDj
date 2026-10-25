import { userAPI } from '../../utils/api';
import { formatDate } from '../../utils/util';
Page({
  data: { items: [], loading: false, page: 0, hasMore: true, error: '' },
  onShow() { return this.loadFeedback(); },
  async loadFeedback(append = false) {
    if (append && (this.data.loading || !this.data.hasMore)) return;
    const requestId = (this._requestId || 0) + 1;
    this._requestId = requestId;
    this.setData({ loading: true, error: '' });
    try {
      const page = append ? this.data.page + 1 : 1;
      const res = await userAPI.getModerationFeedback(page, 20);
      if (requestId !== this._requestId) return;
      if (!res.success) throw new Error(res.message || '加载失败');
      const items = res.data.map(item => ({ ...item, key: `${item.content_type}-${item.id}`,
        date: formatDate(item.moderated_at || item.created_at),
        statusLabel: item.status === 'pending' ? '待审核' : item.status === 'rejected' ? '未通过' : '已通过',
        feedback: item.status === 'approved' ? '审核已通过，内容可以公开展示。' : item.moderation_reason ||
          (item.status === 'pending' ? '待人工审核，尚未判定违规。' : '这条历史记录未保存拒绝原因，无法还原当时结论。')
      }));
      this.setData({ items: append ? [...this.data.items, ...items] : items, page, hasMore: page < res.pagination.totalPages });
    } catch (error) {
      if (requestId === this._requestId) this.setData({ error: error.message || '加载失败，请重试' });
    } finally { if (requestId === this._requestId) this.setData({ loading: false }); }
  },
  retry() { return this.loadFeedback(); },
  onReachBottom() { return this.loadFeedback(true); },
  async onPullDownRefresh() { await this.loadFeedback(); wx.stopPullDownRefresh(); },
  onUnload() { this._requestId = (this._requestId || 0) + 1; }
});
