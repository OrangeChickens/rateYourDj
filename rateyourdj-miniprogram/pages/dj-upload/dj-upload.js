// pages/dj-upload/dj-upload.js
import { showLoading, hideLoading, showToast } from '../../utils/util';

const app = getApp();

Page({
  data: {
    name: '',
    city: '',
    label: '',
    music_style: '',
    photo_url: '',
    localImagePath: '',
    uploading: false
  },

  onLoad() {
    // 检查管理员权限
    const userInfo = app.globalData.userInfo;
    if (!userInfo || userInfo.role !== 'admin') {
      showToast('无权限访问');
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  // 输入DJ名称
  onNameInput(e) {
    this.setData({ name: e.detail.value });
  },

  // 输入城市
  onCityInput(e) {
    this.setData({ city: e.detail.value });
  },

  // 输入厂牌
  onLabelInput(e) {
    this.setData({ label: e.detail.value });
  },

  // 输入音乐风格
  onStyleInput(e) {
    this.setData({ music_style: e.detail.value });
  },

  // 选择图片
  chooseImage() {
    // 检查相册权限
    wx.getSetting({
      success: (res) => {
        // 如果用户已经拒绝过授权
        if (res.authSetting['scope.album'] === false) {
          wx.showModal({
            title: '需要相册权限',
            content: '请在设置中允许访问相册',
            confirmText: '去设置',
            success: (modalRes) => {
              if (modalRes.confirm) {
                wx.openSetting();
              }
            }
          });
          return;
        }

        // 尝试使用新API wx.chooseMedia（基础库2.10.0+）
        if (wx.chooseMedia) {
          wx.chooseMedia({
            count: 1,
            mediaType: ['image'],
            sourceType: ['album', 'camera'],
            sizeType: ['compressed'], // 使用压缩图片
            success: (res) => {
              const tempFilePath = res.tempFiles[0].tempFilePath;
              console.log('选择图片成功:', tempFilePath);
              this.setData({
                localImagePath: tempFilePath
              });
            },
            fail: (error) => {
              console.error('选择图片失败:', error);
              // 如果是用户拒绝授权
              if (error.errMsg.includes('auth')) {
                showToast('您拒绝了访问相册');
              } else {
                showToast('选择图片失败：' + error.errMsg);
              }
            }
          });
        } else {
          // 降级使用旧API wx.chooseImage
          wx.chooseImage({
            count: 1,
            sourceType: ['album', 'camera'],
            sizeType: ['compressed'],
            success: (res) => {
              const tempFilePath = res.tempFilePaths[0];
              console.log('选择图片成功:', tempFilePath);
              this.setData({
                localImagePath: tempFilePath
              });
            },
            fail: (error) => {
              console.error('选择图片失败:', error);
              if (error.errMsg.includes('auth')) {
                showToast('您拒绝了访问相册');
              } else {
                showToast('选择图片失败：' + error.errMsg);
              }
            }
          });
        }
      },
      fail: () => {
        showToast('获取权限状态失败');
      }
    });
  },

  // 上传图片到阿里云
  async uploadImageToAliyun(filePath) {
    console.log('开始上传图片:', filePath);

    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: `${app.globalData.apiBaseUrl}/upload/image`,
        filePath: filePath,
        name: 'file',
        header: {
          'Authorization': `Bearer ${app.globalData.token}`
        },
        success: (res) => {
          console.log('上传响应:', res);

          if (res.statusCode !== 200) {
            console.error('上传失败，状态码:', res.statusCode);
            reject(new Error(`服务器错误：${res.statusCode}`));
            return;
          }

          try {
            const data = JSON.parse(res.data);
            console.log('上传结果:', data);

            if (data.success) {
              console.log('图片URL:', data.data.url);
              resolve(data.data.url);
            } else {
              reject(new Error(data.message || '上传失败'));
            }
          } catch (e) {
            console.error('解析响应失败:', e);
            reject(new Error('服务器响应格式错误'));
          }
        },
        fail: (error) => {
          console.error('上传请求失败:', error);
          reject(new Error(error.errMsg || '网络请求失败'));
        }
      });
    });
  },

  // 提交表单
  async handleSubmit() {
    // 验证必填字段
    if (!this.data.name || !this.data.city) {
      showToast('请填写DJ名称和城市');
      return;
    }

    if (!this.data.localImagePath) {
      showToast('请选择DJ照片');
      return;
    }

    try {
      this.setData({ uploading: true });
      showLoading('正在上传图片...');

      console.log('开始提交DJ信息...');

      // 先上传图片
      const photoUrl = await this.uploadImageToAliyun(this.data.localImagePath);
      console.log('图片上传成功，URL:', photoUrl);

      showLoading('正在创建DJ...');

      // 提交DJ信息
      const res = await app.request({
        url: '/dj/create',
        method: 'POST',
        data: {
          name: this.data.name,
          city: this.data.city,
          label: this.data.label || null,
          music_style: this.data.music_style || null,
          photo_url: photoUrl
        },
        needAuth: true
      });

      console.log('创建DJ响应:', res);

      if (res.success) {
        showToast('DJ创建成功');
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        showToast(res.message || '创建失败');
      }
    } catch (error) {
      console.error('提交失败:', error);

      // 根据错误类型给出不同的提示
      let errorMsg = '提交失败，请重试';
      if (error.message) {
        if (error.message.includes('网络')) {
          errorMsg = '网络错误，请检查网络连接';
        } else if (error.message.includes('服务器')) {
          errorMsg = '服务器错误，请稍后重试';
        } else if (error.message.includes('token') || error.message.includes('认证')) {
          errorMsg = '登录已过期，请重新登录';
        } else {
          errorMsg = error.message;
        }
      }

      showToast(errorMsg);
    } finally {
      this.setData({ uploading: false });
      hideLoading();
    }
  }
});
