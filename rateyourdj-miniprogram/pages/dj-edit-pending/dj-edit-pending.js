// pages/dj-edit-pending/dj-edit-pending.js
import { djEditRequestAPI } from '../../utils/api';
import { showLoading, hideLoading, showToast, showConfirm } from '../../utils/util';

Page({
  data: {
    requests: [],
    loading: true,
    currentPage: 1,
    totalPages: 1,
    hasMore: false,

    // 详情弹窗
    showDetail: false,
    detail: null,
    proposedData: null
  },

  onLoad() {
    this.loadList();
  },

  onPullDownRefresh() {
    this.loadList();
    wx.stopPullDownRefresh();
  },

  async loadList(append = false) {
    try {
      if (!append) this.setData({ loading: true });

      const page = append ? this.data.currentPage + 1 : 1;
      const res = await djEditRequestAPI.getPending(page, 20);

      if (res.success) {
        const requests = res.data.map(item => ({
          ...item,
          proposed_data: typeof item.proposed_data === 'string'
            ? JSON.parse(item.proposed_data)
            : item.proposed_data,
          created_at_formatted: new Date(item.created_at).toLocaleDateString()
        }));

        this.setData({
          requests: append ? [...this.data.requests, ...requests] : requests,
          currentPage: page,
          totalPages: res.pagination.totalPages,
          hasMore: page < res.pagination.totalPages,
          loading: false
        });
      }
    } catch (error) {
      console.error('加载列表失败:', error);
      showToast('加载失败');
      this.setData({ loading: false });
    }
  },

  loadMore() {
    if (this.data.hasMore) this.loadList(true);
  },

  // 查看详情
  async viewDetail(e) {
    const { id } = e.currentTarget.dataset;
    try {
      showLoading();
      const res = await djEditRequestAPI.getDetail(id);
      if (res.success) {
        const detail = res.data;
        const proposedData = typeof detail.proposed_data === 'string'
          ? JSON.parse(detail.proposed_data)
          : detail.proposed_data;

        this.setData({
          showDetail: true,
          detail,
          proposedData
        });
      }
    } catch (error) {
      showToast('加载详情失败');
    } finally {
      hideLoading();
    }
  },

  closeDetail() {
    this.setData({ showDetail: false, detail: null, proposedData: null });
  },

  // 审核通过
  async handleApprove() {
    const id = this.data.detail?.id;
    if (!id) return;

    const confirmed = await showConfirm('确认通过', '通过后DJ资料将被更新，确定吗？');
    if (!confirmed) return;

    try {
      showLoading();
      const res = await djEditRequestAPI.approve(id);
      if (res.success) {
        showToast('已通过');
        this.setData({ showDetail: false, detail: null, proposedData: null });
        this.loadList();
      } else {
        showToast(res.message || '操作失败');
      }
    } catch (error) {
      console.error('approve失败:', error);
      showToast(error.message || '操作失败');
    } finally {
      hideLoading();
    }
  },

  // 拒绝
  async handleReject() {
    const id = this.data.detail?.id;
    if (!id) return;

    const confirmed = await showConfirm('确认拒绝', '拒绝后该申请将被关闭，确定吗？');
    if (!confirmed) return;

    try {
      showLoading();
      const res = await djEditRequestAPI.reject(id);
      if (res.success) {
        showToast('已拒绝');
        this.setData({ showDetail: false, detail: null, proposedData: null });
        this.loadList();
      } else {
        showToast(res.message || '操作失败');
      }
    } catch (error) {
      console.error('reject失败:', error);
      showToast(error.message || '操作失败');
    } finally {
      hideLoading();
    }
  }
});
