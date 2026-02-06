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
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.setData({
          localImagePath: tempFilePath
        });
      },
      fail: (error) => {
        console.error('选择图片失败:', error);
        showToast('选择图片失败');
      }
    });
  },

  // 上传图片到阿里云
  async uploadImageToAliyun(filePath) {
    // 这里需要实现阿里云 OSS 上传
    // 由于需要阿里云配置，这里先使用后端代理上传的方式
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: `${app.globalData.apiBaseUrl}/upload/image`,
        filePath: filePath,
        name: 'file',
        header: {
          'Authorization': `Bearer ${app.globalData.token}`
        },
        success: (res) => {
          const data = JSON.parse(res.data);
          if (data.success) {
            resolve(data.data.url);
          } else {
            reject(new Error(data.message));
          }
        },
        fail: reject
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
      showLoading('上传中...');

      // 先上传图片
      const photoUrl = await this.uploadImageToAliyun(this.data.localImagePath);

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
      showToast('提交失败，请重试');
    } finally {
      this.setData({ uploading: false });
      hideLoading();
    }
  }
});
