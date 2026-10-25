// pages/index/index.js
import { djAPI, statsAPI, reviewAPI } from '../../utils/api';
import { showLoading, hideLoading, showToast, generateStars } from '../../utils/util';
import i18n from '../../utils/i18n';
const { createReviewShare } = require('../../utils/review-share');

Page({
  data: {
    activeFeed: 'for-you', feedReviews: [], feedPage: 1, feedMore: false, feedLoading: false, feedError: '', feedAsOf: null, followingCount: 0, feedLoggedIn: false, hotError: '',
    hotDJs: [],
    selectedCity: '全部城市',
    selectedLetter: '', // 选中的字母，空字符串表示全部
    letters: ['#', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
    genreGroups: [],       // 风格大类列表
    selectedGenre: '',     // 选中的风格大类
    subGroups: [],         // 当前大类的子类
    selectedSubGroup: '',  // 选中的子类
    subGroupTags: [],      // 选中子类的具体标签
    selectedTag: '',       // 选中的具体标签
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
    reviewCount24h: 0,
    statsTexts: {},
    recentReviewsTexts: {}
  },

  goToEvents() { wx.navigateTo({url:'/pages/events/events'}); },

  onLoad() {
    // 从 storage 读取上次选择的城市（如果有）
    const selectedCity = wx.getStorageSync('selectedCity') || '全部城市';
    this.setData({ selectedCity });

    this.updateLanguage();
    this.loadDashboard();
    this.loadGenreGroups();
    const activeFeed = wx.getStorageSync('homeFeedTab');
    if (['for-you','following','hot'].includes(activeFeed)) this.setData({activeFeed});
    if (this.data.activeFeed === 'hot') this.loadHotDJs(); else this.loadFeed();
  },

  onShow() {
    const token = getApp().globalData.token || '';
    const revision = getApp().globalData.homeFeedRevision || 0;
    if (this._homeShown && (token !== this._feedToken || revision !== this._feedRevision) && this.data.activeFeed !== 'hot') this.loadFeed();
    this._homeShown = true; this._feedToken = token; this._feedRevision = revision;
    this.setData({feedLoggedIn:!!token});
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
          selectedLetter: '',
          selectedGenre: '',
          selectedSubGroup: '',
          subGroups: [],
          currentPage: 1,
          hasMore: true
        });
        this.loadHotDJs();
      }
    } else {
      // 如果 storage 中没有城市，确保显示"全部城市"
      if (this.data.selectedCity !== '全部城市') {
        console.log('重置为全部城市');
        this.setData({
          selectedCity: '全部城市',
          selectedLetter: '',
          selectedGenre: '',
          selectedSubGroup: '',
          subGroups: [],
          currentPage: 1,
          hasMore: true
        });
        this.loadHotDJs();
      }
    }
  },

  changeFeed(e) {
    const activeFeed=e.currentTarget.dataset.tab;
    if(!['for-you','following','hot'].includes(activeFeed)||activeFeed===this.data.activeFeed)return;
    this._feedRequest=(this._feedRequest||0)+1;
    this.setData({activeFeed,feedReviews:[],feedMore:false,feedLoading:false,feedError:''});
    wx.setStorageSync('homeFeedTab',activeFeed);
    if(activeFeed==='hot')this.loadHotDJs();else this.loadFeed();
  },
  async loadFeed(append=false) {
    if(this.data.activeFeed==='hot'||(append&&(this.data.feedLoading||!this.data.feedMore||this.data.feedError)))return;
    const request=this._feedRequest=(this._feedRequest||0)+1,mode=this.data.activeFeed;
    const token=getApp().globalData.token;
    if(mode==='following'&&!token){this.setData({feedLoggedIn:false,feedReviews:[],feedMore:false,feedLoading:false,feedError:''});return;}
    const page=append?this.data.feedPage+1:1;
    this.setData({feedLoading:true,feedError:'',feedLoggedIn:!!token,...(append?{}:{feedReviews:[],feedMore:false,feedAsOf:null})});
    try {
      const res=await reviewAPI.getFeed(mode,{page,limit:20,...(append&&this.data.feedAsOf?{asOf:this.data.feedAsOf}:{})});
      if(request!==this._feedRequest)return;
      const rows=append?[...this.data.feedReviews,...res.data]:res.data;
      const seen=new Set();
      this.setData({feedReviews:rows.filter(row=>{if(seen.has(row.id))return false;seen.add(row.id);return true;}),feedPage:page,feedMore:page<res.pagination.totalPages,feedAsOf:res.asOf,followingCount:res.following_count});
    }catch(error){if(request===this._feedRequest)this.setData({feedError:error.message||'评价加载失败，请重试'});}
    finally{if(request===this._feedRequest)this.setData({feedLoading:false});}
  },
  retryFeed(){this.loadFeed();},retryHot(){this.loadHotDJs();},
  loginForFeed(){wx.switchTab({url:'/pages/settings/settings'});},
  exploreDJs(){this.changeFeed({currentTarget:{dataset:{tab:'hot'}}});},
  prepareFeedShare(e){this._shareReviewId=e.detail.id;},
  updateFeedReview(e){const update=e.detail;this.setData({feedReviews:this.data.feedReviews.map(row=>Number(row.id)===Number(update.id)?{...row,...update}:row)});},
  onUnload(){this._feedRequest=(this._feedRequest||0)+1;this._hotRequest=(this._hotRequest||0)+1;},

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
        viewAll: i18n.t('home.recentReviews.viewAll'),
        last24h: i18n.t('home.recentReviews.last24h'),
        reviewUnit: i18n.t('home.recentReviews.reviewUnit')
      }
    });
  },

  // 加载热门DJ
  async loadHotDJs(append = false) {
    if (append && (this.data.loading || !this.data.hasMore || this.data.hotError)) return;
    const request = this._hotRequest = (this._hotRequest || 0) + 1;
    this.setData({hotError:''});
    try {
      this.setData({ loading: true });

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
        sort: 'weighted_score',
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

      // 风格过滤：具体标签 > 子类 > 大类
      if (this.data.selectedTag) {
        params.style = this.data.selectedTag;
      } else if (this.data.selectedGenre) {
        params.genre_group = this.data.selectedGenre;
        if (this.data.selectedSubGroup) {
          params.sub_group = this.data.selectedSubGroup;
        }
      }

      console.log('请求参数:', params);
      const res = await djAPI.getList(params);
      if (request !== this._hotRequest) return;
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
      if (request !== this._hotRequest) return;
      this.setData({hotError:error.message || 'DJ加载失败，请重试'});
      console.error('加载热门DJ失败:', error);
      showToast(i18n.t('error.loadFailed'));
    } finally {
      if (request === this._hotRequest) this.setData({ loading: false });
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
          recentReviews: this.formatRecentReviews(cached.recentReviews),
          reviewCount24h: cached.stats.reviewCount24h || 0
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
          recentReviews: this.formatRecentReviews(res.data.recentReviews),
          reviewCount24h: res.data.stats.reviewCount24h || 0
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

  // 加载风格大类
  async loadGenreGroups() {
    try {
      const res = await djAPI.getGenreGroups();
      if (res.success) {
        this.setData({ genreGroups: res.data });
      }
    } catch (error) {
      console.error('加载风格大类失败:', error);
    }
  },

  // 选择风格大类筛选
  selectGenre(e) {
    const { genre } = e.currentTarget.dataset;
    const clicked = genre || '';
    const newGenre = this.data.selectedGenre === clicked ? '' : clicked;

    // 找到该大类的子类
    let subGroups = [];
    if (newGenre) {
      const group = this.data.genreGroups.find(g => g.genre_group === newGenre);
      if (group && group.sub_groups) {
        subGroups = group.sub_groups;
      }
    }

    this.setData({
      selectedGenre: newGenre,
      selectedSubGroup: '',
      subGroups,
      subGroupTags: [],
      selectedTag: '',
      currentPage: 1,
      hasMore: true
    });
    this.loadHotDJs();
  },

  // 选择子类筛选 → 进入第三层（显示具体标签）
  selectSubGroup(e) {
    const { subgroup } = e.currentTarget.dataset;
    const clicked = subgroup || '';

    if (!clicked) {
      // 点了 ALL，清除子类筛选
      this.setData({
        selectedSubGroup: '',
        subGroupTags: [],
        selectedTag: '',
        currentPage: 1,
        hasMore: true
      });
      this.loadHotDJs();
      return;
    }

    // 找到该子类的标签
    const sub = this.data.subGroups.find(s => s.sub_group === clicked);
    const tags = sub && sub.tags ? sub.tags : [];

    this.setData({
      selectedSubGroup: clicked,
      subGroupTags: tags,
      selectedTag: '',
      currentPage: 1,
      hasMore: true
    });
    this.loadHotDJs();
  },

  // 返回子类列表
  goBackToSubGroups() {
    this.setData({
      selectedSubGroup: '',
      subGroupTags: [],
      selectedTag: '',
      currentPage: 1,
      hasMore: true
    });
    this.loadHotDJs();
  },

  // 选择具体标签筛选
  selectTag(e) {
    const { tag } = e.currentTarget.dataset;
    const clicked = tag || '';
    const newTag = this.data.selectedTag === clicked ? '' : clicked;

    this.setData({
      selectedTag: newTag,
      currentPage: 1,
      hasMore: true
    });
    this.loadHotDJs();
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

  // 跳转到厂牌详情
  goToLabel(e) {
    const { label } = e.currentTarget.dataset;
    if (label) {
      wx.navigateTo({
        url: `/pages/label-detail/label-detail?label=${encodeURIComponent(label)}`
      });
    }
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
      this.data.activeFeed === 'hot' ? this.loadHotDJs() : this.loadFeed()
    ]);

    wx.stopPullDownRefresh();
  },

  // 触底加载更多
  onReachBottom() {
    if (this.data.activeFeed === 'hot') { if (this.data.hasMore && !this.data.loading) this.loadHotDJs(true); }
    else if (this.data.feedMore && !this.data.feedLoading) this.loadFeed(true);
  },

  // 分享给好友
  onShareAppMessage(options = {}) {
    if (options.from === 'button') { const id = Number(options.target?.dataset?.reviewId || this._shareReviewId); const review = this.data.feedReviews.find(row=>Number(row.id)===id); if(review) return createReviewShare(review,{name:review.dj_name,photo_url:review.dj_photo_url},this); }
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
