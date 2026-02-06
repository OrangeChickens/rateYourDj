// pages/my-favorites/my-favorites.js
import { userAPI } from '../../utils/api';
import { showLoading, hideLoading, showToast, showConfirm, generateStars, requireLogin } from '../../utils/util';
import i18n from '../../utils/i18n';

const app = getApp();

Page({
  data: {
    favorites: [],
    loading: true,
    currentPage: 1,
    hasMore: true,

    // 国际化文本
    texts: {}
  },

  onLoad() {
    this.updateLanguage();
  },

  onShow() {
    // 设置 TabBar 选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 1
      });
    }

    // 每次显示时检查登录状态并加载数据
    if (requireLogin()) {
      this.loadFavorites();
    } else {
      this.setData({ loading: false });
    }
  },

  // 更新语言
  updateLanguage() {
    this.setData({
      texts: {
        title: i18n.t('favorites.title'),
        empty: i18n.t('favorites.empty'),
        goExplore: i18n.t('favorites.goExplore'),
        loading: i18n.t('common.loading'),
        loadMore: i18n.t('common.loadMore'),
        noMore: i18n.t('common.noMore')
      }
    });
  },

  // 加载收藏列表
  async loadFavorites(append = false) {
    try {
      if (!append) {
        this.setData({ loading: true });
      }

      const page = append ? this.data.currentPage + 1 : 1;
      const res = await userAPI.getFavorites({ page, limit: 10 });

      if (res.success) {
        // 处理数据
        const favorites = res.data.map(dj => {
          const stars = generateStars(dj.overall_rating);
          return {
            ...dj,
            fullStars: stars.full,
            emptyStars: stars.empty,
            styleList: dj.music_style ? dj.music_style.split(',').slice(0, 3) : []
          };
        });

        this.setData({
          favorites: append ? [...this.data.favorites, ...favorites] : favorites,
          currentPage: page,
          hasMore: page < res.pagination.totalPages
        });
      } else {
        showToast(res.message);
      }
    } catch (error) {
      console.error('加载收藏列表失败:', error);
      showToast(i18n.t('error.loadFailed'));
    } finally {
      this.setData({ loading: false });
    }
  },

  // 取消收藏
  async removeFavorite(e) {
    const { id, name } = e.currentTarget.dataset;

    const confirmed = await showConfirm(
      '取消收藏',
      `确认取消收藏 ${name}？`
    );

    if (!confirmed) return;

    try {
      showLoading();
      const res = await userAPI.toggleFavorite(id);

      if (res.success) {
        showToast(i18n.t('favorites.removeSuccess'));
        // 从列表中移除
        const favorites = this.data.favorites.filter(item => item.id !== id);
        this.setData({ favorites });
      } else {
        showToast(res.message);
      }
    } catch (error) {
      console.error('取消收藏失败:', error);
      showToast(i18n.t('error.operationFailed'));
    } finally {
      hideLoading();
    }
  },

  // 跳转到DJ详情
  goToDJDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/dj-detail/dj-detail?id=${id}`
    });
  },

  // 跳转到首页
  goToHome() {
    wx.switchTab({
      url: '/pages/index/index'
    });
  },

  // 下拉刷新
  async onPullDownRefresh() {
    await this.loadFavorites();
    wx.stopPullDownRefresh();
  },

  // 触底加载更多
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadFavorites(true);
    }
  }
});
