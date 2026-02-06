// pages/login/login.js
const app = getApp();

Page({
  data: {
    avatarUrl: '',
    nickname: ''
  },

  onLoad(options) {
    // 如果已经登录，跳转回我的页面
    if (app.globalData.token) {
      wx.switchTab({
        url: '/pages/settings/settings'
      });
    }
  },

  // 选择头像
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    this.setData({
      avatarUrl
    });
  },

  // 输入昵称
  onNicknameInput(e) {
    this.setData({
      nickname: e.detail.value
    });
  },

  // 登录
  async handleLogin() {
    const { avatarUrl, nickname } = this.data;

    if (!nickname) {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({
      title: '登录中...',
      mask: true
    });

    try {
      // 第一步：获取微信登录凭证 code
      const loginRes = await new Promise((resolve, reject) => {
        wx.login({
          success: resolve,
          fail: reject
        });
      });

      if (!loginRes.code) {
        throw new Error('获取登录凭证失败');
      }

      // 第二步：上传头像到服务器（如果有选择头像）
      let uploadedAvatarUrl = '';
      if (avatarUrl) {
        // 注意：这里需要后端提供上传接口
        // 临时方案：直接使用微信临时路径
        uploadedAvatarUrl = avatarUrl;
      }

      // 第三步：发送到后端登录
      const apiRes = await app.request({
        url: '/auth/login',
        method: 'POST',
        data: {
          code: loginRes.code,
          userInfo: {
            nickName: nickname,
            avatarUrl: uploadedAvatarUrl || '/images/default-avatar.png'
          }
        }
      });

      wx.hideLoading();

      if (apiRes.success) {
        // 保存登录信息
        app.globalData.token = apiRes.data.token;
        app.globalData.userInfo = apiRes.data.user;

        wx.setStorageSync('token', apiRes.data.token);
        wx.setStorageSync('userInfo', apiRes.data.user);

        wx.showToast({
          title: '登录成功',
          icon: 'success'
        });

        // 跳转回我的页面
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/settings/settings'
          });
        }, 1500);
      } else {
        throw new Error(apiRes.message || '登录失败');
      }
    } catch (error) {
      wx.hideLoading();
      console.error('登录失败:', error);
      wx.showToast({
        title: error.message || '登录失败',
        icon: 'none'
      });
    }
  }
});
