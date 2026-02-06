Component({
  data: {
    selected: 0,
    list: [
      {
        pagePath: "/pages/index/index",
        text: "首页",
        emoji: "HOME"
      },
      {
        pagePath: "/pages/my-favorites/my-favorites",
        text: "收藏",
        emoji: "FAV"
      },
      {
        pagePath: "/pages/settings/settings",
        text: "我的",
        emoji: "ME"
      }
    ]
  },

  methods: {
    switchTab(e) {
      const data = e.currentTarget.dataset;
      const url = data.path;
      wx.switchTab({ url });
    }
  }
});
