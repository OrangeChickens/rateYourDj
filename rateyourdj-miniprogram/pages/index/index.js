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
    noDataText: '',

    // 分页
    currentPage: 1,
    hasMore: true
  },

  onLoad() {
    this.updateLanguage();
    this.loadHotDJs();
  },

  onShow() {
    // 设置 TabBar 选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 0
      });
    }

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
  async loadHotDJs(append = false) {
    try {
      if (!append) {
        this.setData({ loading: true });
      }

      // 调试信息
      const app = getApp();
      console.log('=== 开始加载热门DJ ===');
      console.log('API Base URL:', app.globalData.apiBaseUrl);
      console.log('选中城市:', this.data.selectedCity);

      // 根据选中城市加载DJ列表
      const page = append ? this.data.currentPage + 1 : 1;
      const params = {
        page,
        limit: 10,
        sort: 'overall_rating',
        order: 'DESC'
      };

      // 如果选中了具体城市，添加城市过滤
      if (this.data.selectedCity && this.data.selectedCity !== '全部城市') {
        params.city = this.data.selectedCity;
      }

      const res = await djAPI.getList(params);
      console.log('API 响应:', res);

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

        this.setData({
          hotDJs: append ? [...this.data.hotDJs, ...hotDJs] : hotDJs,
          currentPage: page,
          hasMore: page < res.pagination.totalPages
        });
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
  },

  // 触底加载更多
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadHotDJs(true);
    }
  },

  // 分享给好友
  onShareAppMessage() {
    const shareConfig = {
      title: '查看DJ评分 - 烂u盘',
      path: '/pages/index/index'
    };

    console.log('分享配置:', shareConfig);
    return shareConfig;
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '查看DJ评分 - 烂u盘',
      query: ''
    };
  }
});
