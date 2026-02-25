// pages/waitlist/waitlist.js
const app = getApp();
import { authAPI } from '../../utils/api';
import { showLoading, hideLoading, showToast } from '../../utils/util';

Page({
  data: {
    inviteCode: ''
  },

  onLoad(options) {
    console.log('💡 Waitlist 页面加载');

    // 如果是 full access 用户误进入，直接跳转首页
    const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo');
    if (userInfo && userInfo.access_level === 'full') {
      console.log('✅ 已是 full access 用户，跳转首页');
      wx.switchTab({
        url: '/pages/index/index'
      });
      return;
    }

    // 从分享链接接收邀请码参数
    if (options.inviteCode) {
      console.log('📥 接收到分享邀请码:', options.inviteCode);
      this.setData({
        inviteCode: options.inviteCode.trim().toUpperCase()
      });
    }
  },

  onInviteCodeInput(e) {
    this.setData({
      inviteCode: e.detail.value.trim().toUpperCase()
    });
  },

  goToLogin() {
    if (app.globalData.token) {
      // 已登录但还在 waitlist — 不需要再登录，提示输入邀请码
      showToast('你已登录，请输入邀请码');
      return;
    }
    wx.navigateTo({
      url: '/pages/login/login'
    });
  },

  async handleVerifyCode() {
    const { inviteCode } = this.data;

    if (!inviteCode) {
      showToast('请输入邀请码');
      return;
    }

    showLoading('验证中...');

    try {
      const res = await authAPI.verifyInviteCode(inviteCode);
      hideLoading();

      if (res.success) {
        console.log('✅ 邀请码验证成功:', inviteCode);

        if (app.globalData.token) {
          // 已登录 — 直接调用 use 端点消费邀请码
          console.log('🎫 已登录，直接使用邀请码');
          const useRes = await authAPI.useInviteCode(inviteCode);
          hideLoading();

          if (useRes.success) {
            const userInfo = app.globalData.userInfo || {};
            userInfo.access_level = 'full';
            app.globalData.userInfo = userInfo;
            wx.setStorageSync('userInfo', userInfo);

            showToast('激活成功！');
            setTimeout(() => {
              wx.switchTab({ url: '/pages/index/index' });
            }, 1500);
          } else {
            showToast(useRes.message || '激活失败');
          }
        } else {
          // 未登录 — 保存邀请码，直接进首页浏览（登录时再消费）
          wx.setStorageSync('pendingInviteCode', inviteCode);
          showToast('验证成功，欢迎浏览！');

          setTimeout(() => {
            wx.switchTab({ url: '/pages/index/index' });
          }, 1500);
        }
      } else {
        console.log('❌ 邀请码验证失败:', res.message);
        showToast(res.message || '邀请码无效');
      }
    } catch (error) {
      hideLoading();
      console.error('❌ 验证邀请码失败:', error);
      showToast('验证失败，请重试');
    }
  }
});
