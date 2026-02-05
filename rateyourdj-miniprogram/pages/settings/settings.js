// pages/settings/settings.js
import { userAPI } from '../../utils/api';
import { showLoading, hideLoading, showToast, showConfirm } from '../../utils/util';
import i18n from '../../utils/i18n';

const app = getApp();

Page({
  data: {
    userInfo: null,
    isLoggedIn: false,
    currentLanguage: 'zh-CN',
    reviewCount: 0,
    favoriteCount: 0,

    // 国际化文本
    texts: {}
  },

  onLoad() {
    this.updateLanguage();
  },

  onShow() {
    this.checkLoginStatus();
    if (this.data.isLoggedIn) {
      this.loadUserProfile();
    }
  },

  // 更新语言
  updateLanguage() {
    const currentLang = i18n.getLanguage();
    this.setData({
      currentLanguage: currentLang,
      texts: {
        title: i18n.t('profile.title'),
        login: i18n.t('profile.login'),
        myReviews: i18n.t('profile.myReviews'),
        myFavorites: i18n.t('profile.myFavorites'),
        settings: i18n.t('profile.settings'),
        language: i18n.t('settings.language'),
        chinese: i18n.t('settings.chinese'),
        english: i18n.t('settings.english'),
        clearCache: i18n.t('settings.cache'),
        about: i18n.t('profile.about'),
        version: i18n.t('settings.version'),
        logout: i18n.t('profile.logout'),
        reviewCount: i18n.t('profile.reviewCount'),
        favoriteCount: i18n.t('profile.favoriteCount')
      }
    });
  },

  // 检查登录状态
  checkLoginStatus() {
    const token = app.globalData.token;
    const userInfo = app.globalData.userInfo;
    this.setData({
      isLoggedIn: !!token,
      userInfo: userInfo
    });
  },

  // 加载用户资料
  async loadUserProfile() {
    try {
      const res = await userAPI.getProfile();
      if (res.success) {
        this.setData({
          userInfo: res.data,
          reviewCount: res.data.review_count || 0,
          favoriteCount: res.data.favorite_count || 0
        });
        // 更新全局用户信息
        app.globalData.userInfo = res.data;
      }
    } catch (error) {
      console.error('加载用户资料失败:', error);
    }
  },

  // 登录
  handleLogin() {
    app.login();
  },

  // 切换语言
  switchLanguage() {
    wx.showActionSheet({
      itemList: [this.data.texts.chinese, this.data.texts.english],
      success: (res) => {
        const lang = res.tapIndex === 0 ? 'zh-CN' : 'en-US';
        i18n.setLanguage(lang);
        this.updateLanguage();

        // 通知其他页面更新语言
        showToast(lang === 'zh-CN' ? '语言已切换为中文' : 'Language switched to English');

        // 延迟刷新页面
        setTimeout(() => {
          this.onShow();
        }, 500);
      }
    });
  },

  // 查看我的评论
  goToMyReviews() {
    if (!this.data.isLoggedIn) {
      app.login();
      return;
    }

    wx.navigateTo({
      url: '/pages/my-reviews/my-reviews'
    });
  },

  // 查看我的收藏
  goToMyFavorites() {
    if (!this.data.isLoggedIn) {
      app.login();
      return;
    }

    wx.switchTab({
      url: '/pages/my-favorites/my-favorites'
    });
  },

  // 清除缓存
  async clearCache() {
    const confirmed = await showConfirm(
      this.data.texts.clearCache,
      i18n.t('settings.clearCacheConfirm')
    );

    if (!confirmed) return;

    try {
      showLoading();
      // 清除本地缓存（保留登录信息和语言设置）
      const token = wx.getStorageSync('token');
      const language = wx.getStorageSync('language');

      wx.clearStorageSync();

      // 恢复关键信息
      if (token) wx.setStorageSync('token', token);
      if (language) wx.setStorageSync('language', language);

      showToast(i18n.t('settings.clearCacheSuccess'));
    } catch (error) {
      console.error('清除缓存失败:', error);
      showToast(i18n.t('error.operationFailed'));
    } finally {
      hideLoading();
    }
  },

  // 关于
  showAbout() {
    wx.showModal({
      title: 'RateYourDJ',
      content: 'Version 1.0.0\n\n一个为DJ评分的社区平台\n\n© 2024 RateYourDJ',
      showCancel: false,
      confirmText: '确定'
    });
  },

  // 退出登录
  async handleLogout() {
    const confirmed = await showConfirm(
      this.data.texts.logout,
      i18n.t('profile.logoutConfirm')
    );

    if (!confirmed) return;

    app.logout();
    this.setData({
      isLoggedIn: false,
      userInfo: null,
      reviewCount: 0,
      favoriteCount: 0
    });
    showToast('已退出登录');
  }
});
