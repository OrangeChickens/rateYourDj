// app.js
import i18n from './utils/i18n';

App({
  globalData: {
    userInfo: null,
    token: null,
    // 生产环境：使用域名
    apiBaseUrl: 'https://rateyourdj.pbrick.cn/api',
    // 真机调试：使用电脑局域网 IP（手机无法访问 localhost）
    // apiBaseUrl: 'http://192.168.101.4:3000/api',
    // 模拟器调试：使用 localhost
    // apiBaseUrl: 'http://localhost:3000/api'
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
      // 第一步：同步调用 getUserProfile（必须在用户点击的同步调用栈中）
      wx.getUserProfile({
        desc: '用于完善会员资料',
        success: (userRes) => {
          // 第二步：获取到用户信息后，再调用 wx.login 获取 code
          wx.login({
            success: async (loginRes) => {
              if (loginRes.code) {
                try {
                  // 第三步：将 code 和用户信息一起发送到后端
                  const apiRes = await this.request({
                    url: '/auth/login',
                    method: 'POST',
                    data: {
                      code: loginRes.code,
                      userInfo: userRes.userInfo
                    }
                  });

                  if (apiRes.success) {
                    // 保存登录信息
                    this.globalData.token = apiRes.data.token;
                    this.globalData.userInfo = apiRes.data.user;

                    wx.setStorageSync('token', apiRes.data.token);
                    wx.setStorageSync('userInfo', apiRes.data.user);

                    wx.showToast({
                      title: '登录成功',
                      icon: 'success'
                    });

                    resolve(apiRes.data);
                  } else {
                    reject(new Error(apiRes.message || '登录失败'));
                  }
                } catch (error) {
                  reject(error);
                }
              } else {
                reject(new Error('获取微信登录凭证失败'));
              }
            },
            fail: (error) => {
              reject(error);
            }
          });
        },
        fail: (error) => {
          // 用户取消授权
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
    // 不跳转页面，保持在当前页面
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

      // 构建完整URL
      let fullUrl = `${this.globalData.apiBaseUrl}${url}`;

      // 对于GET请求，将参数拼接到URL中
      if (method === 'GET' && data && Object.keys(data).length > 0) {
        const params = Object.keys(data)
          .filter(key => data[key] !== undefined && data[key] !== null)
          .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
          .join('&');
        if (params) {
          fullUrl += `?${params}`;
        }
      }

      console.log(`[请求] ${method} ${fullUrl}`, method === 'GET' ? {} : data);

      wx.request({
        url: fullUrl,
        method,
        data: method === 'GET' ? {} : data,
        header,
        success: (res) => {
          console.log(`[响应] ${method} ${fullUrl}`, res);
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
          console.error(`[请求失败] ${method} ${fullUrl}`, error);
          reject(error);
        }
      });
    });
  }
});
