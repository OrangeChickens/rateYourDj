// pages/search/search.js
import { djAPI, userAPI } from '../../utils/api';
import { showToast, debounce, generateStars } from '../../utils/util';
import i18n from '../../utils/i18n';

const app = getApp();

Page({
  data: {
    keyword: '',
    searchHistory: [],
    hotSearches: ['Techno', 'House', 'Melodic', 'EDM'],
    searchResults: [],
    searching: false,
    hasSearched: false,

    // 分页
    currentPage: 1,
    hasMore: true,

    // 国际化文本
    texts: {}
  },

  onLoad() {
    this.updateLanguage();
    this.loadSearchHistory();

    // 创建防抖搜索函数
    this.debouncedSearch = debounce(this.performSearch.bind(this), 500);
  },

  onShow() {
    // 每次显示时刷新搜索历史
    this.loadSearchHistory();
  },

  // 更新语言
  updateLanguage() {
    this.setData({
      texts: {
        placeholder: i18n.t('search.placeholder'),
        history: i18n.t('search.history'),
        clearHistory: i18n.t('search.clearHistory'),
        hotSearch: i18n.t('search.hotSearch'),
        result: i18n.t('search.result'),
        noResult: i18n.t('search.noResult'),
        loading: i18n.t('common.loading')
      }
    });
  },

  // 加载搜索历史
  async loadSearchHistory() {
    if (!app.globalData.token) {
      // 未登录，从本地存储加载
      const history = wx.getStorageSync('searchHistory') || [];
      this.setData({ searchHistory: history });
      return;
    }

    try {
      const res = await userAPI.getSearchHistory();
      if (res.success) {
        const history = res.data.map(item => item.keyword);
        this.setData({ searchHistory: history });
      }
    } catch (error) {
      console.error('加载搜索历史失败:', error);
      // 失败时从本地加载
      const history = wx.getStorageSync('searchHistory') || [];
      this.setData({ searchHistory: history });
    }
  },

  // 保存搜索历史
  saveSearchHistory(keyword) {
    if (!keyword.trim()) return;

    let history = [...this.data.searchHistory];

    // 移除重复项
    const index = history.indexOf(keyword);
    if (index > -1) {
      history.splice(index, 1);
    }

    // 添加到最前面
    history.unshift(keyword);

    // 限制数量为10条
    history = history.slice(0, 10);

    this.setData({ searchHistory: history });

    // 保存到本地存储
    wx.setStorageSync('searchHistory', history);
  },

  // 清空搜索历史
  clearHistory() {
    wx.showModal({
      title: i18n.t('search.clearHistory'),
      content: '确认清空搜索历史？',
      success: (res) => {
        if (res.confirm) {
          this.setData({ searchHistory: [] });
          wx.removeStorageSync('searchHistory');
          showToast('已清空');
        }
      }
    });
  },

  // 输入搜索
  onSearchInput(e) {
    const keyword = e.detail.value;
    this.setData({ keyword });

    if (keyword.trim()) {
      // 防抖搜索
      this.debouncedSearch(keyword);
    } else {
      // 清空搜索结果
      this.setData({
        searchResults: [],
        hasSearched: false
      });
    }
  },

  // 点击搜索历史或热门搜索
  selectKeyword(e) {
    const { keyword } = e.currentTarget.dataset;
    this.setData({ keyword });
    this.performSearch(keyword);
  },

  // 执行搜索
  async performSearch(keyword, append = false) {
    if (!keyword || !keyword.trim()) return;

    if (this.data.searching) return;

    try {
      this.setData({ searching: true });

      const page = append ? this.data.currentPage + 1 : 1;
      const res = await djAPI.search(keyword.trim(), page, 20);

      if (res.success) {
        // 处理搜索结果
        const results = res.data.map(dj => {
          const stars = generateStars(dj.overall_rating);
          return {
            ...dj,
            fullStars: stars.full,
            emptyStars: stars.empty,
            styleList: dj.music_style ? dj.music_style.split(',').slice(0, 3) : []
          };
        });

        this.setData({
          searchResults: append ? [...this.data.searchResults, ...results] : results,
          hasSearched: true,
          currentPage: page,
          hasMore: page < res.pagination.totalPages
        });

        // 保存搜索历史（仅首次搜索时）
        if (!append) {
          this.saveSearchHistory(keyword.trim());
        }
      } else {
        showToast(res.message);
      }
    } catch (error) {
      console.error('搜索失败:', error);
      showToast(i18n.t('error.loadFailed'));
    } finally {
      this.setData({ searching: false });
    }
  },

  // 加载更多
  loadMore() {
    if (!this.data.hasMore || this.data.searching) return;
    this.performSearch(this.data.keyword, true);
  },

  // 跳转到DJ详情
  goToDJDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/dj-detail/dj-detail?id=${id}`
    });
  },

  // 清空搜索框
  clearInput() {
    this.setData({
      keyword: '',
      searchResults: [],
      hasSearched: false
    });
  },

  // 触底加载更多
  onReachBottom() {
    this.loadMore();
  }
});
