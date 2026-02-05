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
    this.loadCities();

    // 获取当前选中的城市
    const selectedCity = wx.getStorageSync('selectedCity') || '全部城市';
    this.setData({ selectedCity });
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

    // 返回上一页
    setTimeout(() => {
      wx.navigateBack({
        success: () => {
          // 通知首页刷新
          const pages = getCurrentPages();
          if (pages.length > 1) {
            const prevPage = pages[pages.length - 2];
            if (prevPage.route === 'pages/index/index' && prevPage.loadHotDJs) {
              prevPage.setData({ selectedCity: city });
              prevPage.loadHotDJs();
            }
          }
        }
      });
    }, 300);
  }
});
