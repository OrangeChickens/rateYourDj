// pages/login/login.js
const app = getApp();
import { authAPI } from '../../utils/api';

Page({
  data: {
    avatarUrl: '',
    uploadedAvatarUrl: '', // 新上传的OSS URL
    existingAvatarUrl: '', // 老用户已有的头像URL
    nickname: '',
    uploading: false,
    isExistingUser: false,
    avatarTip: '选择头像（可选）' // 动态提示文案
  },

  async onLoad(options) {
    // 如果已经登录，跳转回我的页面
    if (app.globalData.token) {
      wx.switchTab({
        url: '/pages/settings/settings'
      });
      return;
    }

    // 预检查用户状态
    await this.checkUserStatus();
  },

  // 预检查用户状态
  async checkUserStatus() {
    try {
      // 获取微信登录凭证
      const loginRes = await new Promise((resolve, reject) => {
        wx.login({
          success: resolve,
          fail: reject
        });
      });

      if (!loginRes.code) {
        console.error('获取登录凭证失败');
        return;
      }

      // 调用后端预检查接口
      const res = await authAPI.checkUser(loginRes.code);

      if (res.success && res.data.isExistingUser) {
        // 老用户
        this.setData({
          isExistingUser: true,
          existingAvatarUrl: res.data.avatar_url || '',
          avatarUrl: res.data.avatar_url || '/images/default-avatar.png',
          nickname: res.data.nickname || '',
          avatarTip: res.data.avatar_url ? '点击更换头像' : '选择头像（可选）'
        });
      } else {
        // 新用户
        this.setData({
          isExistingUser: false,
          avatarUrl: '/images/default-avatar.png',
          avatarTip: '选择头像（可选）'
        });
      }
    } catch (error) {
      console.error('预检查失败:', error);
      // 预检查失败不影响登录流程，使用默认状态
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
    const { uploadedAvatarUrl, existingAvatarUrl, nickname, uploading, isExistingUser } = this.data;

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

      // 第二步：构建登录数据
      const loginData = {
        code: loginRes.code,
        userInfo: {
          nickName: nickname
        }
      };

      // 头像逻辑：
      // 1. 如果用户上传了新头像（uploadedAvatarUrl存在），使用新头像
      // 2. 如果是老用户且没上传新头像，不传avatarUrl（后端会保持原有头像）
      // 3. 如果是新用户且没选头像，传空字符串
      if (uploadedAvatarUrl) {
        // 用户选择并上传了新头像
        loginData.userInfo.avatarUrl = uploadedAvatarUrl;
      } else if (!isExistingUser) {
        // 新用户没选头像，传空字符串
        loginData.userInfo.avatarUrl = '';
      }
      // 老用户没上传新头像，不传avatarUrl字段

      // 第三步：发送到后端登录
      const apiRes = await app.request({
        url: '/auth/login',
        method: 'POST',
        data: loginData
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
