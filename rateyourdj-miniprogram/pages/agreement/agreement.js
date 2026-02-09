// pages/agreement/agreement.js
Page({
  data: {
    type: 'user'  // 'user' 或 'privacy'
  },

  onLoad(options) {
    this.setData({
      type: options.type || 'user'
    });

    wx.setNavigationBarTitle({
      title: options.type === 'privacy' ? '隐私政策' : '用户服务协议'
    });
  }
});
