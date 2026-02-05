// app.js
import i18n from './utils/i18n';

App({
  globalData: {
    userInfo: null,
    token: null,
    apiBaseUrl: 'http://localhost:3000/api' // 开发环境
    // apiBaseUrl: 'https://你的域名.com/api' // 生产环境
  },

  onLaunch() {
    console.log('RateYourDJ App Launched');

    // 检查登录状态
    this.checkLoginStatus();

    // 初始化语言
    this.initLanguage();
  },

  // 检查登录状态
  checkLoginStatus() {
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');

    if (token && userInfo) {
      this.globalData.token = token;
      this.globalData.userInfo = userInfo;
    }
  },

  // 初始化语言
  initLanguage() {
    const systemInfo = wx.getSystemInfoSync();
    const language = systemInfo.language || 'zh-CN';

    // 如果用户已设置语言，使用用户设置
    const savedLocale = wx.getStorageSync('locale');
    if (savedLocale) {
      i18n.setLocale(savedLocale);
    } else {
      // 否则根据系统语言自动设置
      const locale = language.startsWith('zh') ? 'zh-CN' : 'en-US';
      i18n.setLocale(locale);
    }
  },

  // 微信登录
  async login() {
    return new Promise((resolve, reject) => {
      wx.login({
        success: (res) => {
          if (res.code) {
            // 获取用户信息
            wx.getUserProfile({
              desc: '用于完善会员资料',
              success: async (userRes) => {
                try {
                  // 调用后端登录接口
                  const loginRes = await this.request({
                    url: '/auth/login',
                    method: 'POST',
                    data: {
                      code: res.code,
                      userInfo: userRes.userInfo
                    }
                  });

                  if (loginRes.success) {
                    // 保存登录信息
                    this.globalData.token = loginRes.data.token;
                    this.globalData.userInfo = loginRes.data.user;

                    wx.setStorageSync('token', loginRes.data.token);
                    wx.setStorageSync('userInfo', loginRes.data.user);

                    resolve(loginRes.data);
                  } else {
                    reject(new Error(loginRes.message));
                  }
                } catch (error) {
                  reject(error);
                }
              },
              fail: (error) => {
                reject(error);
              }
            });
          } else {
            reject(new Error('微信登录失败'));
          }
        },
        fail: (error) => {
          reject(error);
        }
      });
    });
  },

  // 退出登录
  logout() {
    this.globalData.token = null;
    this.globalData.userInfo = null;
    wx.removeStorageSync('token');
    wx.removeStorageSync('userInfo');
    wx.reLaunch({
      url: '/pages/index/index'
    });
  },

  // 统一请求方法
  request(options) {
    return new Promise((resolve, reject) => {
      const { url, method = 'GET', data = {}, needAuth = false } = options;

      const header = {
        'Content-Type': 'application/json'
      };

      // 如果需要认证，添加token
      if (needAuth && this.globalData.token) {
        header['Authorization'] = `Bearer ${this.globalData.token}`;
      }

      wx.request({
        url: `${this.globalData.apiBaseUrl}${url}`,
        method,
        data,
        header,
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res.data);
          } else if (res.statusCode === 401) {
            // token 过期，清除登录信息
            this.logout();
            reject(new Error('登录已过期，请重新登录'));
          } else {
            reject(new Error(res.data.message || '请求失败'));
          }
        },
        fail: (error) => {
          reject(error);
        }
      });
    });
  }
});
