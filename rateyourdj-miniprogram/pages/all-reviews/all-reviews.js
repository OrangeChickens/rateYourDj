// pages/all-reviews/all-reviews.js
import { reviewAPI, commentAPI } from '../../utils/api';
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
    contentType: 'review',
    filter: null, // null or 'moderation'
    activeTab: 'pending', // active tab for moderation mode
    ratingOptions: [],
    selectedRatingIndex: 0,
    rating: null,
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

  // 切换星级后重新从第一页查询全部匹配评价。
  onRatingChange(e) {
    const index = Number(e.detail.value);
    if (!Number.isInteger(index) || index < 0 || index > 5 || index === this.data.selectedRatingIndex) return;
    this.setData({
      selectedRatingIndex: index,
      rating: index === 0 ? null : 6 - index,
      currentPage: 1,
      hasMore: false,
      filteredReviews: [],
    });
    this.loadReviews();
  },

  // 更新语言
  updateLanguage() {
    this.setData({
      ratingOptions: [i18n.t('djDetail.allRatings'), '5 ★', '4 ★', '3 ★', '2 ★', '1 ★'],
      texts: {
        ratingFilter: i18n.t('djDetail.ratingFilter'),
        noMatchingReviews: i18n.t('djDetail.noMatchingReviews'),
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

  switchContentType(e) {
    const contentType = e.currentTarget.dataset.type;
    if (contentType === this.data.contentType) return;
    this.setData({ contentType, activeTab: 'pending', filteredReviews: [], hasMore: false });
    this.loadReviews();
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
    if (append && this.data.loading) return;
    const requestId = (this._reviewsRequestId || 0) + 1;
    this._reviewsRequestId = requestId;

    try {
      this.setData({ loading: true });

      const page = append ? this.data.currentPage + 1 : 1;

      // 调用后端 API 获取所有评价
      const params = { page, limit: 20, rating: this.data.rating };
      if (this.data.isAdmin) {
        params.status = 'all';
        if (this.data.filter === 'moderation') {
          params.filter = this.data.activeTab;
        }
      }
      const res = this.data.filter === 'moderation' && this.data.contentType === 'comment'
        ? await commentAPI.getAll({ page, limit: 20, filter: this.data.activeTab })
        : await reviewAPI.getAllReviews(params);

      if (requestId !== this._reviewsRequestId) return;
      if (res.success) {
        const formattedReviews = res.data.map(review => ({
          ...review,
          comment: this.data.contentType === 'comment' && this.data.filter === 'moderation' ? review.content : review.comment,
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
      if (requestId !== this._reviewsRequestId) return;
      console.error('加载评价失败:', error);
      wx.showToast({
        title: i18n.t('error.loadFailed'),
        icon: 'none'
      });
    } finally {
      if (requestId === this._reviewsRequestId) this.setData({ loading: false });
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

  // 管理员操作刷新当前筛选，不依赖旧的本地列表副本。
  async handleApproveReview(e) {
    try {
      const api = this.data.contentType === 'comment' ? commentAPI : reviewAPI;
      const res = await api.updateStatus(Number(e.currentTarget.dataset.id), 'approved');
      if (res.success) { showToast('已通过'); await this.loadReviews(); }
    } catch (error) { showToast(error.message || '操作失败'); }
  },
  handleRejectReview(e) {
    const reasons = ['人身攻击、辱骂或歧视', '含色情、威胁等不适宜内容', '包含他人隐私信息', '广告、灌水或重复内容', '与DJ或音乐体验无关', '内容不足以构成具体评价'];
    const id = Number(e.currentTarget.dataset.id);
    const contentType = this.data.contentType;
    wx.showActionSheet({ itemList: reasons, success: async result => {
      const reason = reasons[result.tapIndex];
      if (!reason) return;
      const confirmed = await showConfirm('拒绝内容', `将向作者反馈：${reason}。确定拒绝吗？`);
      if (!confirmed) return;
      try {
        const api = contentType === 'comment' ? commentAPI : reviewAPI;
        const res = await api.updateStatus(id, 'rejected', reason);
        if (res.success) { showToast('已拒绝并反馈原因'); await this.loadReviews(); }
      } catch (error) { showToast(error.message || '操作失败'); }
    } });
  }
});
