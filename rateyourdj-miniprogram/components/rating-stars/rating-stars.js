// components/rating-stars/rating-stars.js
Component({
  /**
   * 组件属性
   */
  properties: {
    // 评分值（0-5）
    rating: {
      type: Number,
      value: 0
    },
    // 星星大小（small, medium, large）
    size: {
      type: String,
      value: 'medium'
    },
    // 是否可交互（用于评分输入）
    interactive: {
      type: Boolean,
      value: false
    }
  },

  /**
   * 组件数据
   */
  data: {
    fullStars: 0,
    emptyStars: 5
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    attached() {
      this.updateStars();
    }
  },

  /**
   * 属性监听
   */
  observers: {
    'rating': function(newRating) {
      this.updateStars();
    }
  },

  /**
   * 组件方法
   */
  methods: {
    // 更新星星显示
    updateStars() {
      const rating = Math.max(0, Math.min(5, this.data.rating || 0));
      const fullStars = Math.floor(rating);
      const emptyStars = 5 - fullStars;

      this.setData({
        fullStars,
        emptyStars
      });
    },

    // 点击星星（仅在interactive模式下触发）
    onStarTap(e) {
      if (!this.data.interactive) return;

      const { index } = e.currentTarget.dataset;
      const rating = index + 1;

      this.setData({ rating });
      this.updateStars();

      // 触发评分变化事件
      this.triggerEvent('change', { rating });
    }
  }
});
