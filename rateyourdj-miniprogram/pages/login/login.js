// pages/login/login.js
const app = getApp();

Page({
  data: {
    avatarUrl: '',
    uploadedAvatarUrl: '', // OSS上传后的URL
    nickname: '',
    uploading: false
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
  async onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    this.setData({
      avatarUrl,
      uploading: true
    });

    // 立即上传头像到OSS
    wx.showLoading({
      title: '上传头像中...',
      mask: true
    });

    try {
      const uploadedUrl = await this.uploadAvatarToOSS(avatarUrl);
      console.log('头像上传成功，URL:', uploadedUrl);

      this.setData({
        uploadedAvatarUrl: uploadedUrl,
        uploading: false
      });

      wx.hideLoading();
      wx.showToast({
        title: '头像上传成功',
        icon: 'success',
        duration: 1500
      });
    } catch (error) {
      console.error('头像上传失败:', error);
      this.setData({
        uploading: false,
        avatarUrl: '',
        uploadedAvatarUrl: ''
      });

      wx.hideLoading();
      wx.showToast({
        title: '头像上传失败，请重试',
        icon: 'none',
        duration: 2000
      });
    }
  },

  // 输入昵称
  onNicknameInput(e) {
    this.setData({
      nickname: e.detail.value
    });
  },

  // 上传头像到OSS
  async uploadAvatarToOSS(avatarUrl) {
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: `${app.globalData.apiBaseUrl}/upload/image`,
        filePath: avatarUrl,
        name: 'file',
        formData: {
          dj_name: 'user_avatar',
          dj_label: 'avatars'
        },
        success: (res) => {
          if (res.statusCode !== 200) {
            reject(new Error(`上传失败：${res.statusCode}`));
            return;
          }

          try {
            const data = JSON.parse(res.data);
            if (data.success) {
              resolve(data.data.url);
            } else {
              reject(new Error(data.message || '上传失败'));
            }
          } catch (e) {
            reject(new Error('服务器响应格式错误'));
          }
        },
        fail: (error) => {
          reject(new Error(error.errMsg || '网络请求失败'));
        }
      });
    });
  },

  // 登录
  async handleLogin() {
    const { uploadedAvatarUrl, nickname, uploading } = this.data;

    if (!nickname) {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none'
      });
      return;
    }

    // 如果头像还在上传中，等待
    if (uploading) {
      wx.showToast({
        title: '头像上传中，请稍候...',
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

      // 第二步：发送到后端登录（使用已上传的头像URL）
      const apiRes = await app.request({
        url: '/auth/login',
        method: 'POST',
        data: {
          code: loginRes.code,
          userInfo: {
            nickName: nickname,
            avatarUrl: uploadedAvatarUrl || ''
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
