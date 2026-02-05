// pages/index/index.js
import { djAPI } from '../../utils/api';
import { showLoading, hideLoading, showToast, generateStars } from '../../utils/util';
import i18n from '../../utils/i18n';

Page({
  data: {
    hotDJs: [],
    selectedCity: '全部城市',
    loading: true,
    searchPlaceholder: '',
    hotDJsTitle: '',
    loadingText: '',
    noDataText: ''
  },

  onLoad() {
    this.updateLanguage();
    this.loadHotDJs();
  },

  onShow() {
    // 从城市列表页返回时可能需要刷新
    const selectedCity = wx.getStorageSync('selectedCity');
    if (selectedCity && selectedCity !== this.data.selectedCity) {
      this.setData({ selectedCity });
      this.loadHotDJs();
    }
  },

  // 更新语言
  updateLanguage() {
    this.setData({
      searchPlaceholder: i18n.t('home.searchPlaceholder'),
      hotDJsTitle: i18n.t('home.hotDJs'),
      loadingText: i18n.t('common.loading'),
      noDataText: i18n.t('common.noData')
    });
  },

  // 加载热门DJ
  async loadHotDJs() {
    try {
      this.setData({ loading: true });

      const res = await djAPI.getHotList(10);

      if (res.success) {
        // 处理数据：生成星星和标签列表
        const hotDJs = res.data.map(dj => {
          const stars = generateStars(dj.overall_rating);
          return {
            ...dj,
            fullStars: stars.full,
            emptyStars: stars.empty,
            styleList: dj.music_style ? dj.music_style.split(',').slice(0, 3) : []
          };
        });

        this.setData({ hotDJs });
      } else {
        showToast(res.message);
      }
    } catch (error) {
      console.error('加载热门DJ失败:', error);
      showToast(i18n.t('error.loadFailed'));
    } finally {
      this.setData({ loading: false });
    }
  },

  // 跳转到搜索页
  goToSearch() {
    wx.navigateTo({
      url: '/pages/search/search'
    });
  },

  // 跳转到城市列表
  goToCityList() {
    wx.navigateTo({
      url: '/pages/city-list/city-list'
    });
  },

  // 跳转到DJ详情
  goToDJDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/dj-detail/dj-detail?id=${id}`
    });
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadHotDJs().then(() => {
      wx.stopPullDownRefresh();
    });
  }
});
