// pages/index/index.js
import { djAPI, statsAPI } from '../../utils/api';
import { showLoading, hideLoading, showToast, generateStars } from '../../utils/util';
import i18n from '../../utils/i18n';

Page({
  data: {
    hotDJs: [],
    selectedCity: '全部城市',
    selectedLetter: '', // 选中的字母，空字符串表示全部
    letters: ['#', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
    loading: true,
    searchPlaceholder: '',
    hotDJsTitle: '',
    loadingText: '',
    noDataText: '',

    // 分页
    currentPage: 1,
    hasMore: true,

    // 仪表盘数据
    dashboardStats: null,
    recentReviews: [],
    statsTexts: {},
    recentReviewsTexts: {}
  },

  onLoad() {
    // 检查登录状态 - 未登录用户跳转到登录页
    const app = getApp();
    if (!app.globalData.token) {
      console.log('⚠️ 用户未登录，跳转到登录页');
      wx.reLaunch({
        url: '/pages/login/login'
      });
      return;
    }

    // 检查访问级别 - waitlist 用户跳转到 waitlist 页面
    const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo');
    if (userInfo && userInfo.access_level === 'waitlist') {
      console.log('🚫 Waitlist 用户，跳转到 waitlist 页面');
      wx.reLaunch({
        url: '/pages/waitlist/waitlist'
      });
      return;
    }

    // 从 storage 读取上次选择的城市（如果有）
    const selectedCity = wx.getStorageSync('selectedCity') || '全部城市';
    this.setData({ selectedCity });

    this.updateLanguage();
    this.loadDashboard();
    this.loadHotDJs();
  },

  onShow() {
    // 设置 TabBar 选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 0
      });
    }

    // 从城市列表页返回时刷新
    const selectedCity = wx.getStorageSync('selectedCity');
    if (selectedCity) {
      // 如果 storage 中有城市且与当前不同，更新并刷新
      if (selectedCity !== this.data.selectedCity) {
        console.log('城市变更，从', this.data.selectedCity, '到', selectedCity);
        console.log('重置字母筛选:', this.data.selectedLetter, '-> 空');
        this.setData({
          selectedCity,
          selectedLetter: '', // 重置字母筛选
          currentPage: 1,
          hasMore: true
        }, () => {
          console.log('setData 完成，当前 selectedLetter:', this.data.selectedLetter);
        });
        this.loadHotDJs();
      }
    } else {
      // 如果 storage 中没有城市，确保显示"全部城市"
      if (this.data.selectedCity !== '全部城市') {
        console.log('重置为全部城市');
        this.setData({
          selectedCity: '全部城市',
          selectedLetter: '', // 重置字母筛选
          currentPage: 1,
          hasMore: true
        }, () => {
          console.log('setData 完成，当前 selectedLetter:', this.data.selectedLetter);
        });
        this.loadHotDJs();
      }
    }
  },

  // 更新语言
  updateLanguage() {
    this.setData({
      searchPlaceholder: i18n.t('home.searchPlaceholder'),
      hotDJsTitle: i18n.t('home.hotDJs'),
      loadingText: i18n.t('common.loading'),
      noDataText: i18n.t('common.noData'),
      statsTexts: {
        title: i18n.t('home.stats.title'),
        djTotal: i18n.t('home.stats.djTotal'),
        reviewTotal: i18n.t('home.stats.reviewTotal'),
        interactionTotal: i18n.t('home.stats.interactionTotal'),
        userTotal: i18n.t('home.stats.userTotal')
      },
      recentReviewsTexts: {
        title: i18n.t('home.recentReviews.title'),
        ratedDJ: i18n.t('home.recentReviews.ratedDJ'),
        noReviews: i18n.t('home.recentReviews.noReviews'),
        viewAll: i18n.t('home.recentReviews.viewAll')
      }
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
      console.log('选中字母:', this.data.selectedLetter, '(类型:', typeof this.data.selectedLetter, ')');

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

      // 如果选中了字母，添加字母过滤
      if (this.data.selectedLetter) {
        params.letter = this.data.selectedLetter;
      }

      console.log('请求参数:', params);
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

  // 加载仪表盘数据
  async loadDashboard() {
    try {
      // 检查缓存（5分钟有效期）
      const cached = wx.getStorageSync('dashboardData');
      const cacheTime = wx.getStorageSync('dashboardCacheTime');
      const now = Date.now();

      if (cached && cacheTime && (now - cacheTime < 5 * 60 * 1000)) {
        // 使用缓存
        console.log('📊 使用缓存的仪表盘数据');
        this.setData({
          dashboardStats: cached.stats,
          recentReviews: this.formatRecentReviews(cached.recentReviews)
        });
        return;
      }

      // 从 API 获取
      console.log('📊 从API加载仪表盘数据');
      const res = await statsAPI.getDashboard();

      if (res.success) {
        // 保存到缓存
        wx.setStorageSync('dashboardData', res.data);
        wx.setStorageSync('dashboardCacheTime', now);

        this.setData({
          dashboardStats: res.data.stats,
          recentReviews: this.formatRecentReviews(res.data.recentReviews)
        });
        console.log('✅ 仪表盘数据加载成功', res.data);
      }
    } catch (error) {
      console.error('❌ 加载仪表盘数据失败:', error);
      // 静默失败，不影响页面其他功能
    }
  },

  // 格式化最近评价数据
  formatRecentReviews(reviews) {
    if (!reviews || !Array.isArray(reviews)) return [];

    return reviews.map(review => ({
      ...review,
      stars: Array(review.overall_rating).fill('★'),
      timeAgo: this.formatTimeAgo(review.created_at),
      comment: review.comment ?
        (review.comment.length > 60 ? review.comment.substring(0, 60) + '...' : review.comment) :
        ''
    }));
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

  // 选择字母筛选
  selectLetter(e) {
    const { letter } = e.currentTarget.dataset;
    // 处理空字符串和 undefined 的情况
    const clickedLetter = letter || '';

    // 如果点击的是当前已选中的字母，取消筛选
    const newLetter = this.data.selectedLetter === clickedLetter ? '' : clickedLetter;

    console.log('字母筛选: 点击', clickedLetter, '当前', this.data.selectedLetter, '-> 新值', newLetter);

    this.setData({
      selectedLetter: newLetter,
      currentPage: 1,
      hasMore: true
    });
    this.loadHotDJs();
  },

  // 跳转到DJ详情
  goToDJDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/dj-detail/dj-detail?id=${id}`
    });
  },

  // 下拉刷新
  async onPullDownRefresh() {
    // 清除仪表盘缓存
    wx.removeStorageSync('dashboardData');
    wx.removeStorageSync('dashboardCacheTime');

    await Promise.all([
      this.loadDashboard(),
      this.loadHotDJs()
    ]);

    wx.stopPullDownRefresh();
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
  },

  // 查看所有评价
  handleViewAllReviews() {
    wx.navigateTo({
      url: '/pages/all-reviews/all-reviews'
    });
  }
});
