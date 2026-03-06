Component({
  properties: {
    reviews: {
      type: Array,
      value: []
    },
    texts: {
      type: Object,
      value: {
        title: '最近评价',
        ratedDJ: '评价了',
        noReviews: '暂无评价',
        viewAll: '查看全部 →',
        last24h: '过去24h',
        reviewUnit: '个评价'
      }
    },
    reviewCount24h: {
      type: Number,
      value: 0
    }
  },

  methods: {
    goToReview(e) {
      const { djId, reviewId } = e.currentTarget.dataset;
      wx.navigateTo({
        url: `/pages/dj-detail/dj-detail?id=${djId}&scrollToReview=${reviewId}`
      });
    },

    onViewAll() {
      // 触发事件，让父页面处理
      this.triggerEvent('viewall');
    }
  }
});
