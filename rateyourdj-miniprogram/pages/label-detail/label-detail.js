// pages/label-detail/label-detail.js
import { djAPI } from '../../utils/api';
import { showToast, generateStars } from '../../utils/util';
import i18n from '../../utils/i18n';

Page({
  data: {
    label: '',
    djList: [],
    loading: false,
    currentPage: 1,
    hasMore: true,
    total: 0
  },

  onLoad(options) {
    let label;
    try {
      label = decodeURIComponent(options.label || '');
    } catch (e) {
      label = options.label || '';
    }
    if (!label) {
      showToast('厂牌参数缺失');
      wx.navigateBack();
      return;
    }

    wx.setNavigationBarTitle({ title: label });
    this.setData({ label });
    this.loadDJs();
  },

  async loadDJs(append = false) {
    if (this.data.loading) return;
    this.setData({ loading: true });

    try {
      const page = append ? this.data.currentPage + 1 : 1;
      const res = await djAPI.getList({
        label: this.data.label,
        sort: 'weighted_score',
        order: 'DESC',
        page,
        limit: 10
      });

      if (res.success) {
        const djList = res.data.map(dj => {
          const stars = generateStars(dj.overall_rating);
          return {
            ...dj,
            fullStars: stars.full,
            emptyStars: stars.empty,
            styleList: dj.music_style ? dj.music_style.split(',').slice(0, 3) : []
          };
        });

        this.setData({
          djList: append ? [...this.data.djList, ...djList] : djList,
          currentPage: page,
          hasMore: page < res.pagination.totalPages,
          total: res.pagination.total
        });
      } else {
        showToast(res.message);
      }
    } catch (error) {
      console.error('加载厂牌DJ失败:', error);
      showToast(i18n.t('error.loadFailed'));
    } finally {
      this.setData({ loading: false });
    }
  },

  goToDJDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/dj-detail/dj-detail?id=${id}`
    });
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadDJs(true);
    }
  },

  async onPullDownRefresh() {
    await this.loadDJs();
    wx.stopPullDownRefresh();
  },

  onShareAppMessage() {
    return {
      title: `${this.data.label} - 烂u盘`,
      path: `/pages/label-detail/label-detail?label=${encodeURIComponent(this.data.label)}`
    };
  }
});
