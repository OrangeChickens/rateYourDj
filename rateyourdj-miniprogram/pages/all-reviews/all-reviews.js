// pages/all-reviews/all-reviews.js
import { reviewAPI } from '../../utils/api';
import i18n from '../../utils/i18n';

Page({
  data: {
    reviews: [],
    loading: false,
    currentPage: 1,
    hasMore: true,
    texts: {}
  },

  onLoad() {
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

    // 更新导航栏标题
    wx.setNavigationBarTitle({
      title: i18n.t('allReviews.title')
    });
  },

  // 加载评价列表
  async loadReviews(append = false) {
    if (this.data.loading) return;

    try {
      this.setData({ loading: true });

      const page = append ? this.data.currentPage + 1 : 1;

      // 调用后端 API 获取所有评价
      const res = await reviewAPI.getAllReviews({ page, limit: 20 });

      if (res.success) {
        const formattedReviews = res.data.map(review => ({
          ...review,
          stars: Array(review.overall_rating).fill('★'),
          timeAgo: this.formatTimeAgo(review.created_at)
        }));

        this.setData({
          reviews: append ? [...this.data.reviews, ...formattedReviews] : formattedReviews,
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
  }
});
