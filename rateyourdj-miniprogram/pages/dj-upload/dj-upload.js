// pages/dj-upload/dj-upload.js
import { showLoading, hideLoading, showToast } from '../../utils/util';
import { djAPI, tagAPI } from '../../utils/api';

const app = getApp();

Page({
  data: {
    djId: null, // DJ ID（编辑模式）
    isEditMode: false, // 是否编辑模式

    name: '',
    city: '',
    cityRegion: ['', '', ''], // 省、市、区
    customCityItem: '全部',

    label: '',
    labelIndex: 0,
    labelOptions: [],
    labelList: [], // 实际的厂牌列表数据
    showCustomLabel: false,
    customLabel: '',

    selectedStyles: [], // 选中的音乐风格
    styleTagOptions: [], // 可选的风格标签

    photo_url: '',
    localImagePath: '',
    uploading: false
  },

  async onLoad(options) {
    // 检查是否是编辑模式
    if (options.id) {
      this.setData({
        djId: options.id,
        isEditMode: true
      });
      wx.setNavigationBarTitle({
        title: '编辑DJ资料'
      });
    }
    // 检查管理员权限
    const userInfo = app.globalData.userInfo;
    const token = app.globalData.token;

    console.log('DJ上传页面 - 权限检查:');
    console.log('token:', token ? '存在' : '不存在');
    console.log('userInfo:', userInfo);
    console.log('role:', userInfo ? userInfo.role : '无');

    // 未登录
    if (!token || !userInfo) {
      console.log('用户未登录，返回');
      wx.showModal({
        title: '需要登录',
        content: '请先登录后再上传DJ资料',
        confirmText: '去登录',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            wx.switchTab({
              url: '/pages/settings/settings'
            });
          } else {
            wx.navigateBack();
          }
        }
      });
      return;
    }

    // 不是管理员
    if (userInfo.role !== 'admin') {
      console.log('用户不是管理员，role:', userInfo.role);
      wx.showModal({
        title: '权限不足',
        content: '只有管理员才能上传DJ资料',
        showCancel: false,
        confirmText: '知道了',
        success: () => {
          wx.navigateBack();
        }
      });
      return;
    }

    console.log('权限检查通过，用户是管理员');

    // 加载数据
    await this.loadFormData();
  },

  // 加载表单数据
  async loadFormData() {
    try {
      showLoading('加载中...');

      // 并行加载厂牌和标签数据
      const promises = [
        djAPI.getLabels(),
        tagAPI.getPresets()
      ];

      // 如果是编辑模式，加载DJ详情
      if (this.data.isEditMode) {
        promises.push(djAPI.getDetail(this.data.djId));
      }

      const results = await Promise.all(promises);
      const [labelsRes, tagsRes, djRes] = results;

      // 处理厂牌数据
      if (labelsRes.success) {
        const labelList = labelsRes.data || [];

        // 自定义排序：
        // 1. "自定义" 放第一
        // 2. "独立" 放第二
        // 3. 剩余按 A-Z 排序
        const labels = labelList.map(item => item.label);
        const sortedLabels = [];

        // 1. 先添加"自定义"
        sortedLabels.push('自定义');

        // 2. 如果存在"独立"，添加到第二位
        const independentIndex = labels.indexOf('独立');
        if (independentIndex > -1) {
          sortedLabels.push('独立');
          labels.splice(independentIndex, 1);
        }

        // 3. 剩余的按字母/拼音 A-Z 排序
        // 中文按拼音首字母，英文按字母，统一排序
        const remaining = labels.sort((a, b) => {
          return a.localeCompare(b, 'zh-CN', { sensitivity: 'base' });
        });

        sortedLabels.push(...remaining);

        this.setData({
          labelList,
          labelOptions: sortedLabels
        });
      }

      // 处理标签数据 - 只使用 style 类别的标签
      if (tagsRes.success) {
        const styleTagOptions = tagsRes.data.style || [];
        this.setData({
          styleTagOptions
        });
      }

      // 编辑模式：填充现有数据
      if (this.data.isEditMode && djRes && djRes.success) {
        const dj = djRes.data;

        // 处理厂牌
        let labelIndex = 0;
        let showCustomLabel = false;
        let customLabel = '';

        if (dj.label) {
          const index = this.data.labelOptions.indexOf(dj.label);
          if (index > -1) {
            labelIndex = index;
          } else {
            // 自定义厂牌（"自定义"现在在索引0）
            labelIndex = 0;
            showCustomLabel = true;
            customLabel = dj.label;
          }
        }

        // 处理音乐风格
        const selectedStyles = dj.music_style ? dj.music_style.split(',') : [];

        this.setData({
          name: dj.name || '',
          city: dj.city || '',
          label: dj.label || '',
          labelIndex,
          showCustomLabel,
          customLabel,
          selectedStyles,
          photo_url: dj.photo_url || '',
          localImagePath: dj.photo_url || '' // 显示现有图片
        });
      }

    } catch (error) {
      console.error('加载表单数据失败:', error);
      showToast('加载数据失败，请重试');
    } finally {
      hideLoading();
    }
  },

  // 输入DJ名称
  onNameInput(e) {
    this.setData({ name: e.detail.value });
  },

  // 城市选择变化
  onCityChange(e) {
    const cityRegion = e.detail.value;
    // 使用市级城市，如果没有则使用省级
    const city = cityRegion[1] || cityRegion[0];

    this.setData({
      cityRegion,
      city
    });
  },

  // 厂牌选择变化
  onLabelChange(e) {
    const index = e.detail.value;
    const selectedLabel = this.data.labelOptions[index];

    if (selectedLabel === '自定义') {
      // 显示自定义输入框
      this.setData({
        labelIndex: index,
        label: '',
        showCustomLabel: true,
        customLabel: ''
      });
    } else {
      // 使用已有厂牌
      this.setData({
        labelIndex: index,
        label: selectedLabel,
        showCustomLabel: false,
        customLabel: ''
      });
    }
  },

  // 自定义厂牌输入
  onCustomLabelInput(e) {
    this.setData({
      customLabel: e.detail.value,
      label: e.detail.value
    });
  },

  // 音乐风格标签点击
  onStyleTagTap(e) {
    const tagName = e.currentTarget.dataset.name;
    const selectedStyles = [...this.data.selectedStyles];
    const index = selectedStyles.indexOf(tagName);

    if (index > -1) {
      // 已选中，取消选择
      selectedStyles.splice(index, 1);
    } else {
      // 未选中，添加选择
      if (selectedStyles.length >= 5) {
        showToast('最多选择 5 个音乐风格');
        return;
      }
      selectedStyles.push(tagName);
    }

    this.setData({ selectedStyles });
  },

  // 选择图片
  chooseImage() {
    console.log('开始选择图片...');

    // 首先检查权限状态
    wx.getSetting({
      success: (settingRes) => {
        console.log('当前权限设置:', settingRes.authSetting);

        const cameraAuth = settingRes.authSetting['scope.camera'];

        // 如果明确拒绝了相机权限，引导用户开启
        if (cameraAuth === false) {
          wx.showModal({
            title: '需要相机权限',
            content: '请在设置中允许访问相机和相册',
            confirmText: '去设置',
            cancelText: '取消',
            success: (modalRes) => {
              if (modalRes.confirm) {
                wx.openSetting({
                  success: (openRes) => {
                    console.log('打开设置成功:', openRes);
                  }
                });
              }
            }
          });
          return;
        }

        // 直接尝试选择图片
        this.doChooseImage();
      },
      fail: (error) => {
        console.error('获取权限失败:', error);
        // 即使获取权限失败，也尝试选择图片
        this.doChooseImage();
      }
    });
  },

  // 执行选择图片
  doChooseImage() {
    // 尝试使用新API wx.chooseMedia（基础库2.10.0+）
    if (wx.chooseMedia) {
      console.log('使用 wx.chooseMedia');
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
          showToast('图片选择成功');
        },
        fail: (error) => {
          console.error('选择图片失败:', error);
          this.handleChooseImageError(error);
        }
      });
    } else {
      // 降级使用旧API wx.chooseImage
      console.log('使用 wx.chooseImage');
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
          showToast('图片选择成功');
        },
        fail: (error) => {
          console.error('选择图片失败:', error);
          this.handleChooseImageError(error);
        }
      });
    }
  },

  // 处理选择图片错误
  handleChooseImageError(error) {
    console.error('选择图片错误详情:', error);

    // 用户拒绝授权
    if (error.errMsg && (error.errMsg.includes('auth') || error.errMsg.includes('deny') || error.errMsg.includes('cancel'))) {
      wx.showModal({
        title: '需要相册权限',
        content: '请允许访问相册和相机，以便上传DJ照片',
        confirmText: '去设置',
        cancelText: '取消',
        success: (modalRes) => {
          if (modalRes.confirm) {
            wx.openSetting({
              success: (openRes) => {
                console.log('打开设置成功:', openRes.authSetting);
                if (openRes.authSetting['scope.camera'] || openRes.authSetting['scope.writePhotosAlbum']) {
                  showToast('权限已开启，请重试');
                }
              }
            });
          }
        }
      });
    } else {
      // 其他错误
      showToast('选择图片失败：' + (error.errMsg || '未知错误'));
    }
  },

  // 上传图片到阿里云
  async uploadImageToAliyun(filePath) {
    console.log('开始上传图片:', filePath);
    console.log('DJ信息:', {
      name: this.data.name,
      label: this.data.label || 'independent'
    });

    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: `${app.globalData.apiBaseUrl}/upload/image`,
        filePath: filePath,
        name: 'file',
        formData: {
          dj_name: this.data.name || 'unknown',
          dj_label: this.data.label || 'independent'
        },
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

    // 新建模式必须选择图片
    if (!this.data.isEditMode && !this.data.localImagePath) {
      showToast('请选择DJ照片');
      return;
    }

    try {
      this.setData({ uploading: true });

      console.log('开始提交DJ信息...');

      let photoUrl = this.data.photo_url; // 使用现有URL

      // 如果选择了新图片，先上传
      if (this.data.localImagePath && this.data.localImagePath !== this.data.photo_url) {
        showLoading('正在上传图片...');
        photoUrl = await this.uploadImageToAliyun(this.data.localImagePath);
        console.log('图片上传成功，URL:', photoUrl);
      }

      const actionText = this.data.isEditMode ? '更新' : '创建';
      showLoading(`正在${actionText}DJ...`);

      // 组装音乐风格字符串
      const music_style = this.data.selectedStyles.join(',') || null;

      // 提交DJ信息
      let res;
      if (this.data.isEditMode) {
        res = await djAPI.update(this.data.djId, {
          name: this.data.name,
          city: this.data.city,
          label: this.data.label || null,
          music_style: music_style,
          photo_url: photoUrl
        });
      } else {
        res = await djAPI.create({
          name: this.data.name,
          city: this.data.city,
          label: this.data.label || null,
          music_style: music_style,
          photo_url: photoUrl
        });
      }

      console.log(`${actionText}DJ响应:`, res);

      if (res.success) {
        showToast(`DJ${actionText}成功`);
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        showToast(res.message || `${actionText}失败`);
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
