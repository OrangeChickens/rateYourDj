// pages/all-reviews/all-reviews.js
import { reviewAPI } from '../../utils/api';
import { showToast, showConfirm } from '../../utils/util';
import i18n from '../../utils/i18n';

const app = getApp();

Page({
  data: {
    reviews: [],
    filteredReviews: [],
    loading: false,
    currentPage: 1,
    hasMore: true,
    isAdmin: false,
    filter: null, // null or 'moderation'
    activeTab: 'pending', // active tab for moderation mode
    texts: {}
  },

  onLoad(options) {
    const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo');
    const isAdmin = userInfo && userInfo.role === 'admin';
    this.setData({
      isAdmin,
      filter: options.filter || null
    });

    if (options.filter === 'moderation') {
      wx.setNavigationBarTitle({ title: '评价审核' });
      this.setData({ activeTab: 'pending' });
    }

    this.updateLanguage();
    this.loadReviews();
  },

  // 更新语言
  updateLanguage() {
    this.setData({
      texts: {
        djName: i18n.t('allReviews.djName'),
        loading: i18n.t('common.loading'),
        noReviews: i18n.t('allReviews.noReviews'),
        noMore: i18n.t('common.noMore')
      }
    });

    if (!this.data.filter) {
      wx.setNavigationBarTitle({
        title: i18n.t('allReviews.title')
      });
    }
  },

  // 切换Tab
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    if (tab === this.data.activeTab) return;
    this.setData({ activeTab: tab });
    this.loadReviews();
  },

  // 加载评价列表
  async loadReviews(append = false) {
    if (this.data.loading) return;

    try {
      this.setData({ loading: true });

      const page = append ? this.data.currentPage + 1 : 1;

      // 调用后端 API 获取所有评价
      const params = { page, limit: 20 };
      if (this.data.isAdmin) {
        params.status = 'all';
        if (this.data.filter === 'moderation') {
          params.filter = this.data.activeTab;
        }
      }
      const res = await reviewAPI.getAllReviews(params);

      if (res.success) {
        const formattedReviews = res.data.map(review => ({
          ...review,
          stars: Array(review.overall_rating).fill('★'),
          timeAgo: this.formatTimeAgo(review.created_at)
        }));

        const allReviews = append ? [...this.data.filteredReviews, ...formattedReviews] : formattedReviews;

        this.setData({
          filteredReviews: allReviews,
          currentPage: page,
          hasMore: page < res.pagination.totalPages
        });
      }
    } catch (error) {
      console.error('加载评价失败:', error);
      wx.showToast({
        title: i18n.t('error.loadFailed'),
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 格式化时间
  formatTimeAgo(timestamp) {
    const now = new Date();
    const past = new Date(timestamp);
    const diff = now - past;

    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return i18n.t('common.justNow');
    if (minutes < 60) return `${minutes}${i18n.t('common.minutesAgo')}`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}${i18n.t('common.hoursAgo')}`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}${i18n.t('common.daysAgo')}`;

    return past.toLocaleDateString();
  },

  // 跳转到 DJ 详情页
  goToDJDetail(e) {
    const { djId, reviewId } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/dj-detail/dj-detail?id=${djId}&scrollToReview=${reviewId}`
    });
  },

  // 下拉刷新
  async onPullDownRefresh() {
    await this.loadReviews();
    wx.stopPullDownRefresh();
  },

  // 触底加载更多
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadReviews(true);
    }
  },

  // 管理员：通过评价
  async handleApproveReview(e) {
    const id = Number(e.currentTarget.dataset.id);
    try {
      const res = await reviewAPI.updateStatus(id, 'approved');
      if (res.success) {
        showToast('已通过');
        const idx = this.data.reviews.findIndex(r => r.id === id);
        if (idx !== -1) {
          this.setData({ [`reviews[${idx}].status`]: 'approved' });
          this.applyTabFilter();
        }
      }
    } catch (error) {
      showToast('操作失败');
    }
  },

  // 管理员：拒绝评价
  async handleRejectReview(e) {
    const id = Number(e.currentTarget.dataset.id);
    const confirmed = await showConfirm('拒绝评价', '拒绝后该评价将不计入DJ评分，确定吗？');
    if (!confirmed) return;

    try {
      const res = await reviewAPI.updateStatus(id, 'rejected');
      if (res.success) {
        showToast('已拒绝');
        const idx = this.data.reviews.findIndex(r => r.id === id);
        if (idx !== -1) {
          this.setData({ [`reviews[${idx}].status`]: 'rejected' });
          this.applyTabFilter();
        }
      }
    } catch (error) {
      showToast('操作失败');
    }
  }
});
