// pages/city-list/city-list.js
import { djAPI } from '../../utils/api';
import { showLoading, hideLoading, showToast } from '../../utils/util';
import i18n from '../../utils/i18n';

Page({
  data: {
    cities: [],
    selectedCity: '全部城市',
    loading: true,

    // 国际化文本
    texts: {}
  },

  onLoad() {
    this.updateLanguage();

    // 获取当前选中的城市
    const selectedCity = wx.getStorageSync('selectedCity') || '全部城市';
    this.setData({ selectedCity });
  },

  onShow() {
    // 每次显示页面时都刷新城市列表数据
    this.loadCities();
  },

  // 更新语言
  updateLanguage() {
    this.setData({
      texts: {
        title: i18n.t('city.title'),
        allCities: i18n.t('city.allCities'),
        loading: i18n.t('common.loading'),
        noData: i18n.t('common.noData')
      }
    });
  },

  // 加载城市列表
  async loadCities() {
    try {
      showLoading();
      const res = await djAPI.getCities();

      if (res.success) {
        // 添加"全部城市"选项
        const cities = [
          { city: '全部城市', dj_count: res.data.reduce((sum, item) => sum + item.dj_count, 0) },
          ...res.data
        ];

        this.setData({ cities });
      } else {
        showToast(res.message);
      }
    } catch (error) {
      console.error('加载城市列表失败:', error);
      showToast(i18n.t('error.loadFailed'));
    } finally {
      this.setData({ loading: false });
      hideLoading();
    }
  },

  // 选择城市
  selectCity(e) {
    const { city } = e.currentTarget.dataset;

    // 保存到本地存储
    wx.setStorageSync('selectedCity', city);

    this.setData({ selectedCity: city });

    // 返回上一页（让首页的 onShow 自动处理刷新）
    setTimeout(() => {
      wx.navigateBack();
    }, 300);
  }
});
