// pages/dj-pending/dj-pending.js
import { djAPI } from '../../utils/api';
import { showLoading, hideLoading, showToast } from '../../utils/util';

Page({
  data: {
    pendingList: [],
    loading: false,
    currentPage: 1,
    hasMore: true
  },

  onLoad() {
    this.loadPendingDJs();
  },

  onShow() {
    // 每次显示时刷新列表
    this.setData({ currentPage: 1, hasMore: true, pendingList: [] });
    this.loadPendingDJs();
  },

  async loadPendingDJs(append = false) {
    if (this.data.loading) return;

    try {
      this.setData({ loading: true });
      if (!append) showLoading('加载中...');

      const page = append ? this.data.currentPage + 1 : 1;
      const res = await djAPI.getPending(page, 20);

      if (res.success) {
        const list = append
          ? [...this.data.pendingList, ...res.data]
          : res.data;

        this.setData({
          pendingList: list,
          currentPage: page,
          hasMore: page < res.pagination.totalPages
        });
      }
    } catch (error) {
      console.error('加载待审核列表失败:', error);
      showToast('加载失败');
    } finally {
      this.setData({ loading: false });
      hideLoading();
    }
  },

  async handleApprove(e) {
    const { id } = e.currentTarget.dataset;

    try {
      showLoading('审核中...');
      const res = await djAPI.approve(id);

      if (res.success) {
        showToast('已通过');
        // 从列表中移除
        this.setData({
          pendingList: this.data.pendingList.filter(dj => dj.id !== id)
        });
      } else {
        showToast(res.message || '操作失败');
      }
    } catch (error) {
      console.error('审核通过失败:', error);
      showToast('操作失败');
    } finally {
      hideLoading();
    }
  },

  async handleReject(e) {
    const { id } = e.currentTarget.dataset;

    try {
      showLoading('处理中...');
      const res = await djAPI.reject(id);

      if (res.success) {
        showToast('已拒绝');
        // 从列表中移除
        this.setData({
          pendingList: this.data.pendingList.filter(dj => dj.id !== id)
        });
      } else {
        showToast(res.message || '操作失败');
      }
    } catch (error) {
      console.error('拒绝失败:', error);
      showToast('操作失败');
    } finally {
      hideLoading();
    }
  },

  loadMore() {
    if (!this.data.hasMore || this.data.loading) return;
    this.loadPendingDJs(true);
  },

  onReachBottom() {
    this.loadMore();
  }
});
