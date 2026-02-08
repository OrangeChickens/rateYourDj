// pages/waitlist/waitlist.js
const app = getApp();
import { showToast, showLoading, hideLoading } from '../../utils/util';

Page({
  data: {
    position: 0,
    totalWaitlist: 0,
    inviteCode: ''
  },

  onLoad(options) {
    console.log('Waitlist 页面加载，options:', options);

    // 检查 URL 参数中是否有邀请码（支持 code 和 inviteCode 两种参数名）
    const inviteCodeFromUrl = options.inviteCode || options.code;
    if (inviteCodeFromUrl) {
      this.setData({ inviteCode: inviteCodeFromUrl });
      // 延迟自动提交，等待页面渲染完成
      setTimeout(() => {
        this.autoSubmitInviteCode();
      }, 500);
    } else {
      this.loadWaitlistInfo();
    }
  },

  // 加载 waitlist 信息
  async loadWaitlistInfo() {
    try {
      const res = await app.request({
        url: '/user/waitlist-status',
        needAuth: true
      });

      if (res.success) {
        this.setData({
          position: res.data.position || 0,
          totalWaitlist: res.data.total || 0
        });
      }
    } catch (error) {
      console.error('加载 waitlist 信息失败:', error);
      // 失败时显示默认值
      this.setData({
        position: 0,
        totalWaitlist: 0
      });
    }
  },

  // 输入邀请码
  onInviteInput(e) {
    this.setData({ inviteCode: e.detail.value.toUpperCase() });
  },

  // 自动提交邀请码（来自 URL 参数）
  async autoSubmitInviteCode() {
    console.log('自动提交邀请码:', this.data.inviteCode);
    await this.submitInviteCode();
  },

  // 提交邀请码
  async submitInviteCode() {
    const { inviteCode } = this.data;

    if (!inviteCode || inviteCode.trim().length === 0) {
      showToast('请输入邀请码');
      return;
    }

    try {
      showLoading('验证中...');

      const res = await app.request({
        url: '/auth/use-invite-code',
        method: 'POST',
        data: { code: inviteCode.trim() },
        needAuth: true
      });

      hideLoading();

      if (res.success) {
        // 更新全局用户信息
        app.globalData.userInfo = app.globalData.userInfo || {};
        app.globalData.userInfo.access_level = 'full';
        app.globalData.accessLevel = 'full';

        // 显示成功提示并跳转
        this.showWelcomeAnimation();
      } else {
        showToast(res.message || '邀请码无效');
      }
    } catch (error) {
      hideLoading();
      console.error('验证邀请码失败:', error);
      showToast('验证失败，请重试');
    }
  },

  // 欢迎动画
  showWelcomeAnimation() {
    wx.showModal({
      title: '欢迎加入',
      content: '你已获得完整访问权限\n\n完成任务获得邀请码，邀请好友一起玩',
      showCancel: false,
      confirmText: '开始探索',
      success: () => {
        // 跳转到首页
        wx.switchTab({
          url: '/pages/index/index'
        });
      }
    });
  }
});
