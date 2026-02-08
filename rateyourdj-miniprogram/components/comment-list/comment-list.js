// components/comment-list/comment-list.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    comments: {
      type: Array,
      value: []
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 点赞
    onUpvote(e) {
      const { id } = e.currentTarget.dataset;
      this.triggerEvent('upvote', { commentId: id });
    },

    // 点踩
    onDownvote(e) {
      const { id } = e.currentTarget.dataset;
      this.triggerEvent('downvote', { commentId: id });
    },

    // 回复
    onReply(e) {
      const { id, nickname } = e.currentTarget.dataset;
      this.triggerEvent('reply', { commentId: id, nickname });
    },

    // 删除
    onDelete(e) {
      const { id } = e.currentTarget.dataset;
      this.triggerEvent('delete', { commentId: id });
    }
  }
});
