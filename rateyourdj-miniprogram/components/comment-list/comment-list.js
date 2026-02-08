// components/comment-list/comment-list.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    comments: {
      type: Array,
      value: []
    },
    reviewId: {
      type: Number,
      value: null
    },
    replyingCommentId: {
      type: Number,
      value: null
    },
    replyingNickname: {
      type: String,
      value: ''
    },
    replyInputValue: {
      type: String,
      value: ''
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 点赞
    onUpvote(e) {
      // 如果事件来自子组件，直接传递
      if (e.detail && e.detail.commentId) {
        this.triggerEvent('upvote', e.detail);
        return;
      }

      const { id } = e.currentTarget.dataset;
      this.triggerEvent('upvote', { commentId: id });
    },

    // 点踩
    onDownvote(e) {
      // 如果事件来自子组件，直接传递
      if (e.detail && e.detail.commentId) {
        this.triggerEvent('downvote', e.detail);
        return;
      }

      const { id } = e.currentTarget.dataset;
      this.triggerEvent('downvote', { commentId: id });
    },

    // 回复
    onReply(e) {
      // 如果事件来自子组件，直接传递
      if (e.detail && e.detail.commentId !== undefined) {
        console.log(`🔵 comment-list.onReply 传递子组件事件:`, e.detail);
        this.triggerEvent('reply', e.detail);
        return;
      }

      const { id, nickname } = e.currentTarget.dataset;
      console.log(`🔵 comment-list.onReply 被触发:`, {
        commentId: id,
        nickname,
        reviewId: this.properties.reviewId
      });
      this.triggerEvent('reply', { commentId: id, nickname, reviewId: this.properties.reviewId });
    },

    // 删除
    onDelete(e) {
      // 如果事件来自子组件，直接传递
      if (e.detail && e.detail.commentId) {
        this.triggerEvent('delete', e.detail);
        return;
      }

      const { id } = e.currentTarget.dataset;
      this.triggerEvent('delete', { commentId: id });
    },

    // 切换回复框显示
    toggleReplyBox(e) {
      const { id, nickname } = e.currentTarget.dataset;
      this.triggerEvent('toggleReply', { commentId: id, nickname, reviewId: this.properties.reviewId });
    },

    // 传递子组件的 toggleReply 事件
    onToggleReply(e) {
      this.triggerEvent('toggleReply', e.detail);
    },

    // 回复输入
    onReplyInput(e) {
      // 传递给父页面
      this.triggerEvent('replyInput', { value: e.detail.value });
    },

    // 提交回复
    submitReply(e) {
      this.triggerEvent('submitReply', {});
    },

    // 传递子组件的提交事件
    onSubmitReply(e) {
      this.triggerEvent('submitReply', e.detail);
    },

    // 取消回复
    cancelReply(e) {
      this.triggerEvent('cancelReply', {});
    },

    // 传递子组件的取消事件
    onCancelReply(e) {
      this.triggerEvent('cancelReply', e.detail);
    }
  }
});
