// pages/settings/settings.js
import { userAPI } from '../../utils/api';
import { showLoading, hideLoading, showToast, showConfirm } from '../../utils/util';
import i18n from '../../utils/i18n';

const app = getApp();

Page({
  data: {
    userInfo: null,
    isLoggedIn: false,
    isAdmin: false,
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
    const currentLang = i18n.getLocale();
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
      userInfo: userInfo,
      isAdmin: userInfo && userInfo.role === 'admin'
    });
  },

  // 加载用户资料
  async loadUserProfile() {
    // 确保有 token 才加载
    if (!app.globalData.token) {
      return;
    }

    try {
      const res = await userAPI.getProfile();
      if (res.success) {
        // 更新本地数据
        this.setData({
          userInfo: res.data,
          reviewCount: res.data.review_count || 0,
          favoriteCount: res.data.favorite_count || 0,
          isAdmin: res.data.role === 'admin'
        });

        // 同步更新globalData和storage（包含role字段）
        app.globalData.userInfo = res.data;
        wx.setStorageSync('userInfo', res.data);

        console.log('用户信息已更新:', res.data);
        // 更新全局用户信息
        app.globalData.userInfo = res.data;
      }
    } catch (error) {
      console.error('加载用户资料失败:', error);
      // 如果加载失败，可能是 token 过期，清除登录状态
      if (error.message && error.message.includes('登录')) {
        this.setData({
          isLoggedIn: false,
          userInfo: null
        });
      }
    }
  },

  // 登录
  async handleLogin() {
    try {
      await app.login();
      // 登录成功后刷新页面状态
      this.checkLoginStatus();
      this.loadUserProfile();
    } catch (error) {
      console.error('登录失败:', error);
      // 用户取消授权不需要提示
      if (error.errMsg && !error.errMsg.includes('cancel')) {
        showToast('登录失败，请重试');
      }
    }
  },

  // 切换语言
  switchLanguage() {
    wx.showActionSheet({
      itemList: [this.data.texts.chinese, this.data.texts.english],
      success: (res) => {
        const lang = res.tapIndex === 0 ? 'zh-CN' : 'en-US';
        i18n.setLocale(lang);
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
      showToast('请先登录');
      return;
    }

    wx.navigateTo({
      url: '/pages/my-reviews/my-reviews'
    });
  },

  // 查看我的收藏
  goToMyFavorites() {
    if (!this.data.isLoggedIn) {
      showToast('请先登录');
      return;
    }

    wx.switchTab({
      url: '/pages/my-favorites/my-favorites'
    });
  },

  // 跳转到上传DJ页面
  goToUploadDJ() {
    wx.navigateTo({
      url: '/pages/dj-upload/dj-upload'
    });
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
      '退出登录',
      '确定要退出登录吗？'
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
