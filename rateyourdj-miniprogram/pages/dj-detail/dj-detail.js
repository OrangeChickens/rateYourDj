// pages/dj-detail/dj-detail.js
import { djAPI, reviewAPI, commentAPI, userAPI } from '../../utils/api';
import { showLoading, hideLoading, showToast, showConfirm, generateStars, formatDate, checkFullAccess } from '../../utils/util';
import i18n from '../../utils/i18n';

const app = getApp();

Page({
  data: {
    djId: null,
    dj: null,
    reviews: [],
    loading: true,
    reviewsLoading: false,
    isFavorited: false,
    isAdmin: false, // 是否是管理员
    isLoggedIn: false, // 是否已登录
    bioExpanded: false, // bio是否展开
    djNameFontSize: '72rpx', // DJ 名字字体大小（自适应）

    // 分页
    currentPage: 1,
    totalPages: 1,
    hasMore: true,

    // 排序
    sortType: 'hot', // hot, created_at, helpful_count, overall_rating
    sortOrder: 'DESC',
    sortOptions: [],
    selectedSortIndex: 0,

    // 评论相关
    expandedComments: {},      // 展开的评论区（key: reviewId, value: boolean）
    reviewComments: {},        // 各评价的评论列表（key: reviewId, value: comments[]）
    commentInputs: {},         // 顶级评论输入内容（key: reviewId, value: string）
    replyingTo: {},            // 正在回复的评论ID（key: reviewId, value: commentId）
    replyingToNickname: {},    // 正在回复的用户昵称（key: reviewId, value: nickname）
    replyInputValue: {},       // 回复输入内容（key: reviewId, value: string）

    // 国际化文本
    texts: {}
  },

  onLoad(options) {
    // 检查访问级别
    if (!checkFullAccess()) {
      return;
    }

    const djId = parseInt(options.id);
    if (!djId) {
      showToast('DJ ID 无效');
      wx.navigateBack();
      return;
    }

    this.setData({ djId });
    this.checkAdminStatus();
    this.updateLanguage();
    this.loadDJDetail();
    this.loadReviews();
    this.checkFavoriteStatus();

    // 启用分享到朋友圈功能
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  onShow() {
    // 检查是否有待处理的分享任务
    if (this.pendingShareTask) {
      console.log('🔄 检测到待处理的分享任务，开始记录...');
      this.pendingShareTask = false;
      this.recordShareTask();
    }

    // 检查是否需要刷新数据（从写评论页返回）
    const needRefresh = getApp().globalData.needRefreshDJDetail;
    if (needRefresh) {
      console.log('检测到需要刷新DJ详情');
      this.loadDJDetail();
      this.loadReviews();
      // 清除刷新标记
      getApp().globalData.needRefreshDJDetail = false;
    }
  },

  // 更新语言
  updateLanguage() {
    const sortOptions = [
      i18n.t('djDetail.sortHottest') || '热度最高',
      i18n.t('djDetail.sortNewest'),
      i18n.t('djDetail.sortHighestRating'),
      i18n.t('djDetail.sortLowestRating')
    ];

    this.setData({
      sortOptions,
      texts: {
        reviews: i18n.t('djDetail.reviews'),
        writeReview: i18n.t('djDetail.writeReview'),
        favorite: i18n.t('djDetail.favorite'),
        unfavorite: i18n.t('djDetail.unfavorite'),
        wouldChooseAgain: i18n.t('djDetail.wouldChooseAgain'),
        set: i18n.t('djDetail.setRating'),
        performance: i18n.t('djDetail.performance'),
        personality: i18n.t('djDetail.personality'),
        anonymousUser: i18n.t('review.anonymousUser'),
        report: i18n.t('review.report'),
        reply: i18n.t('review.reply'),
        share: i18n.t('review.share'),
        loading: i18n.t('common.loading'),
        noReviews: i18n.t('djDetail.noReviews'),
        loadMore: i18n.t('common.loadMore'),
        noMore: i18n.t('common.noMore')
      }
    });
  },

  // 加载DJ详情
  async loadDJDetail() {
    try {
      showLoading();
      const res = await djAPI.getDetail(this.data.djId);

      if (res.success) {
        const dj = res.data;
        // 处理音乐风格
        dj.styleList = dj.music_style ? dj.music_style.split(',') : [];
        // 生成星星
        dj.overallStars = generateStars(dj.overall_rating);
        dj.setStars = generateStars(dj.set_rating);
        dj.performanceStars = generateStars(dj.performance_rating);
        dj.personalityStars = generateStars(dj.personality_rating);

        // 根据名字长度计算字体大小
        const fontSize = this.calculateNameFontSize(dj.name);

        this.setData({
          dj,
          loading: false,
          djNameFontSize: fontSize
        });
      } else {
        showToast(res.message);
        setTimeout(() => wx.navigateBack(), 1500);
      }
    } catch (error) {
      console.error('加载DJ详情失败:', error);
      showToast(i18n.t('error.loadFailed'));
      setTimeout(() => wx.navigateBack(), 1500);
    } finally {
      hideLoading();
    }
  },

  // 加载评论列表
  async loadReviews(append = false) {
    if (this.data.reviewsLoading) return;

    try {
      this.setData({ reviewsLoading: true });

      const page = append ? this.data.currentPage + 1 : 1;
      const res = await reviewAPI.getList(this.data.djId, {
        sort: this.data.sortType,
        order: this.data.sortOrder,
        page,
        limit: 10
      });

      if (res.success) {
        console.log('📊 后端返回的评价数据:', res.data);

        // 处理评论数据
        const reviews = res.data.map(review => {
          console.log(`评价 ${review.id} 的 comment_count:`, review.comment_count);
          return {
            ...review,
            stars: generateStars(review.overall_rating),
            formattedDate: formatDate(review.created_at),
            tagList: review.tags || [],
            avatar_url: review.avatar_url || '/images/default-avatar.png'
          };
        });

        console.log('📊 处理后的评价数据:', reviews);

        this.setData({
          reviews: append ? [...this.data.reviews, ...reviews] : reviews,
          currentPage: page,
          totalPages: res.pagination.totalPages,
          hasMore: page < res.pagination.totalPages
        });

        // 如果是首次加载且有评价，自动展开第一条评价的评论区
        if (!append && reviews.length > 0 && reviews[0].comment_count > 0) {
          const firstReviewId = reviews[0].id;

          // 延迟展开，等待 DOM 渲染完成
          setTimeout(() => {
            this.setData({
              [`expandedComments.${firstReviewId}`]: true
            });
            // 加载第一条评价的评论
            this.loadComments(firstReviewId);
          }, 100);
        }
      } else {
        showToast(res.message);
      }
    } catch (error) {
      console.error('加载评论失败:', error);
      showToast(i18n.t('error.loadFailed'));
    } finally {
      this.setData({ reviewsLoading: false });
    }
  },

  // 检查收藏状态
  async checkFavoriteStatus() {
    if (!app.globalData.token) return;

    try {
      const res = await userAPI.getFavorites({ page: 1, limit: 100 });
      if (res.success) {
        const isFavorited = res.data.some(fav => fav.id === this.data.djId);
        this.setData({ isFavorited });
      }
    } catch (error) {
      console.error('检查收藏状态失败:', error);
    }
  },

  // 切换收藏
  async toggleFavorite() {
    if (!app.globalData.token) {
      const confirmed = await showConfirm(
        i18n.t('common.loginRequired'),
        i18n.t('common.loginConfirm')
      );
      if (confirmed) {
        wx.switchTab({
          url: '/pages/settings/settings'
        });
      }
      return;
    }

    try {
      showLoading();
      const res = await userAPI.toggleFavorite(this.data.djId);

      if (res.success) {
        this.setData({ isFavorited: !this.data.isFavorited });

        // 设置全局刷新标记，通知收藏页面需要更新
        app.globalData.needRefreshFavorites = true;

        showToast(res.message);
      } else {
        showToast(res.message);
      }
    } catch (error) {
      console.error('收藏操作失败:', error);
      showToast(i18n.t('error.operationFailed'));
    } finally {
      hideLoading();
    }
  },

  // 显示排序选择器
  showSortOptions() {
    wx.showActionSheet({
      itemList: this.data.sortOptions,
      success: (res) => {
        const index = res.tapIndex;
        let sortType = 'created_at';
        let sortOrder = 'DESC';

        switch (index) {
          case 0: // 热度最高
            sortType = 'hot';
            sortOrder = 'DESC';
            break;
          case 1: // 最新
            sortType = 'created_at';
            sortOrder = 'DESC';
            break;
          case 2: // 评分最高
            sortType = 'overall_rating';
            sortOrder = 'DESC';
            break;
          case 3: // 评分最低
            sortType = 'overall_rating';
            sortOrder = 'ASC';
            break;
        }

        this.setData({
          sortType,
          sortOrder,
          selectedSortIndex: index
        });

        this.loadReviews();
      }
    });
  },

  // 乐观更新 review 投票状态
  _applyReviewVote(reviewId, voteType) {
    const reviews = this.data.reviews.map(review => {
      if (review.id !== reviewId) return review;

      const currentVote = review.user_vote;
      let { helpful_count, not_helpful_count } = review;
      let newVote;

      if (currentVote === voteType) {
        // 取消当前投票
        newVote = null;
        if (voteType === 'helpful') helpful_count--;
        else not_helpful_count--;
      } else {
        // 如果有对立投票，先取消
        if (currentVote === 'helpful') helpful_count--;
        else if (currentVote === 'not_helpful') not_helpful_count--;
        // 添加新投票
        newVote = voteType;
        if (voteType === 'helpful') helpful_count++;
        else not_helpful_count++;
      }

      return { ...review, user_vote: newVote, helpful_count, not_helpful_count };
    });

    this.setData({ reviews });
  },

  // 标记评论有帮助
  async markHelpful(e) {
    const { id } = e.currentTarget.dataset;
    const reviewId = parseInt(id);

    if (!app.globalData.token) {
      const confirmed = await showConfirm(
        i18n.t('common.loginRequired'),
        i18n.t('common.loginConfirm')
      );
      if (confirmed) {
        wx.switchTab({
          url: '/pages/settings/settings'
        });
      }
      return;
    }

    // 乐观更新
    this._applyReviewVote(reviewId, 'helpful');

    try {
      const res = await reviewAPI.markHelpful(id);
      if (!res.success) {
        // 回滚：重新加载
        this.loadReviews();
        showToast(res.message);
      }
    } catch (error) {
      console.error('标记有帮助失败:', error);
      this.loadReviews();
      showToast(i18n.t('error.operationFailed'));
    }
  },

  // 标记没帮助
  async markNotHelpful(e) {
    const { id } = e.currentTarget.dataset;
    const reviewId = parseInt(id);

    if (!app.globalData.token) {
      const confirmed = await showConfirm(
        i18n.t('common.loginRequired'),
        i18n.t('common.loginConfirm')
      );
      if (confirmed) {
        wx.switchTab({
          url: '/pages/settings/settings'
        });
      }
      return;
    }

    // 乐观更新
    this._applyReviewVote(reviewId, 'not_helpful');

    try {
      const res = await reviewAPI.markNotHelpful(id);
      if (!res.success) {
        // 回滚：重新加载
        this.loadReviews();
        showToast(res.message);
      }
    } catch (error) {
      console.error('标记没帮助失败:', error);
      this.loadReviews();
      showToast(i18n.t('error.operationFailed'));
    }
  },

  // 举报评论
  async reportReview(e) {
    const { id } = e.currentTarget.dataset;

    if (!app.globalData.token) {
      const confirmed = await showConfirm(
        i18n.t('common.loginRequired'),
        i18n.t('common.loginConfirm')
      );
      if (confirmed) {
        wx.switchTab({
          url: '/pages/settings/settings'
        });
      }
      return;
    }

    const confirmed = await showConfirm(
      i18n.t('review.reportTitle'),
      i18n.t('review.reportConfirm')
    );

    if (!confirmed) return;

    try {
      showLoading();
      const res = await reviewAPI.report(id);
      if (res.success) {
        showToast(res.message);
      } else {
        showToast(res.message);
      }
    } catch (error) {
      console.error('举报失败:', error);
      showToast(i18n.t('error.operationFailed'));
    } finally {
      hideLoading();
    }
  },

  // 分享给朋友（页面级分享配置）
  onShareAppMessage(options) {
    console.log('📤 触发分享到好友/群聊');
    // 设置标记，在页面onShow时记录任务
    this.pendingShareTask = true;

    // 如果是从分享按钮触发的
    if (options.from === 'button') {
      const { djId, reviewId } = options.target.dataset;
      return {
        title: `查看 ${this.data.dj.name} 的评价 - 烂u盘`,
        path: `/pages/dj-detail/dj-detail?id=${djId}&reviewId=${reviewId}`,
        imageUrl: this.data.dj.photo_url || ''
      };
    }

    // 默认分享（右上角分享）
    return {
      title: `${this.data.dj.name} - 烂u盘`,
      path: `/pages/dj-detail/dj-detail?id=${this.data.djId}`,
      imageUrl: this.data.dj.photo_url || ''
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    console.log('📤 触发分享到朋友圈');
    // 设置标记，在页面onShow时记录任务
    this.pendingShareTask = true;

    const { dj } = this.data;
    return {
      title: `${dj.name} 的DJ评分 - 烂u盘`,
      query: `id=${this.data.djId}`,
      imageUrl: dj.photo_url || ''
    };
  },

  // 记录分享任务完成
  async recordShareTask() {
    const token = app.globalData.token;
    if (!token) {
      console.log('⚠️ 未登录，跳过分享任务记录');
      return; // 未登录不记录
    }

    try {
      console.log('📤 开始记录分享任务...');
      const res = await app.request({
        url: '/tasks/share-review',
        method: 'POST',
        needAuth: true
      });

      if (res.success) {
        console.log('✅ 分享任务已记录成功');
        // 提示用户任务已记录
        wx.showToast({
          title: '分享已记录',
          icon: 'success',
          duration: 1500
        });
      } else {
        console.error('❌ 分享任务记录失败:', res.message);
      }
    } catch (error) {
      console.error('❌ 记录分享任务异常:', error);
    }
  },

  // ========== 评论功能 ==========

  // 切换评论区展开/折叠
  toggleComments(e) {
    const { reviewId } = e.currentTarget.dataset;
    const expanded = this.data.expandedComments[reviewId];

    this.setData({
      [`expandedComments.${reviewId}`]: !expanded
    });

    // 首次展开时加载评论
    if (!expanded && !this.data.reviewComments[reviewId]) {
      this.loadComments(reviewId);
    }
  },

  // 加载评论列表
  async loadComments(reviewId) {
    try {
      const res = await commentAPI.getList(reviewId, 1, 20);
      console.log('📊 加载评论返回:', res);
      console.log('📊 评论数据详情:', JSON.stringify(res.data, null, 2));

      if (res.success) {
        // 格式化评论数据
        const formattedComments = this.formatComments(res.data);
        console.log('📊 格式化后的评论:', formattedComments);
        console.log('📊 格式化后详情:', JSON.stringify(formattedComments, null, 2));

        this.setData({
          [`reviewComments.${reviewId}`]: formattedComments
        });

        // 不在这里更新 comment_count，应该由后端在评价列表中返回
      }
    } catch (error) {
      console.error('❌ 加载评论失败:', error);
      showToast('加载评论失败');
    }
  },

  // 格式化评论数据（递归处理嵌套回复）
  formatComments(comments) {
    const userId = app.globalData.userInfo?.id;

    return comments.map(comment => {
      const formatted = {
        ...comment,
        timeAgo: this.formatTimeAgo(comment.created_at),
        canDelete: comment.user_id === userId
      };

      // 递归格式化嵌套回复
      if (comment.replies && comment.replies.length > 0) {
        formatted.replies = this.formatComments(comment.replies);
      }

      return formatted;
    });
  },

  // 格式化时间（"3分钟前"）
  formatTimeAgo(timestamp) {
    const now = new Date();
    const past = new Date(timestamp);
    const diff = now - past;

    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}小时前`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}天前`;

    return past.toLocaleDateString();
  },

  // 评论输入
  onCommentInput(e) {
    const { reviewId } = e.currentTarget.dataset;
    this.setData({
      [`commentInputs.${reviewId}`]: e.detail.value
    });
  },

  // 提交顶级评论（不是回复某条评论）
  async submitComment(e) {
    const { reviewId } = e.currentTarget.dataset;
    const content = this.data.commentInputs[reviewId];
    const parentCommentId = null; // 顶级评论，不设置父评论ID

    if (!app.globalData.token) {
      const confirmed = await showConfirm(
        i18n.t('common.loginRequired'),
        i18n.t('common.loginConfirm')
      );
      if (confirmed) {
        wx.switchTab({
          url: '/pages/settings/settings'
        });
      }
      return;
    }

    if (!content || content.trim().length === 0) {
      showToast('请输入评论内容');
      return;
    }

    if (content.trim().length > 500) {
      showToast('评论最多 500 字');
      return;
    }

    try {
      showLoading('发送中...');

      console.log(`📝 提交评论: reviewId=${reviewId}, parentCommentId=${parentCommentId}, content=${content}`);

      const res = await commentAPI.create(
        parseInt(reviewId),
        content.trim(),
        parentCommentId
      );

      if (res.success) {
        showToast(i18n.t('comment.submitSuccess') || '评论成功');

        // 清空输入（不清空 replyingTo 因为那是回复框的状态）
        this.setData({
          [`commentInputs.${reviewId}`]: ''
        });

        // 刷新评论列表
        this.loadComments(reviewId);

        // 手动增加评论计数
        const reviews = this.data.reviews.map(review => {
          if (review.id === parseInt(reviewId)) {
            return { ...review, comment_count: (review.comment_count || 0) + 1 };
          }
          return review;
        });
        this.setData({ reviews });
      } else {
        showToast(res.message || '评论失败');
      }
    } catch (error) {
      console.error('提交评论失败:', error);
      showToast(i18n.t('comment.submitFailed') || '评论失败');
    } finally {
      hideLoading();
    }
  },

  // 在嵌套评论树中查找并更新指定评论
  _updateCommentInTree(comments, commentId, updateFn) {
    return comments.map(c => {
      if (c.id == commentId) return updateFn(c);
      if (c.replies && c.replies.length > 0) {
        return { ...c, replies: this._updateCommentInTree(c.replies, commentId, updateFn) };
      }
      return c;
    });
  },

  // 乐观更新投票状态（立刻更新 UI，不等服务器）
  _applyOptimisticVote(commentId, voteType) {
    const reviewComments = this.data.reviewComments;
    for (const reviewId of Object.keys(reviewComments)) {
      const updated = this._updateCommentInTree(reviewComments[reviewId], commentId, (comment) => {
        const cur = comment.user_vote_type;
        let scoreChange, newVoteType;

        if (!cur) {
          // 没投过 → 新投票
          newVoteType = voteType;
          scoreChange = voteType === 'upvote' ? 1 : -1;
        } else if (cur === voteType) {
          // 相同 → 取消
          newVoteType = null;
          scoreChange = voteType === 'upvote' ? -1 : 1;
        } else {
          // 不同 → 切换
          newVoteType = voteType;
          scoreChange = voteType === 'upvote' ? 2 : -2;
        }

        return { ...comment, vote_score: comment.vote_score + scoreChange, user_vote_type: newVoteType };
      });
      this.setData({ [`reviewComments.${reviewId}`]: updated });
    }
  },

  // 点赞评论
  async handleCommentUpvote(e) {
    const { commentId } = e.detail;

    if (!app.globalData.token) {
      const confirmed = await showConfirm(
        i18n.t('common.loginRequired'),
        i18n.t('common.loginConfirm')
      );
      if (confirmed) {
        wx.switchTab({ url: '/pages/settings/settings' });
      }
      return;
    }

    this._applyOptimisticVote(commentId, 'upvote');

    try {
      await commentAPI.vote(commentId, 'upvote');
    } catch (error) {
      console.error('投票失败:', error);
      showToast('投票失败');
      // 投票失败，重新加载以恢复正确状态
      const expandedReviewIds = Object.keys(this.data.expandedComments).filter(
        id => this.data.expandedComments[id]
      );
      expandedReviewIds.forEach(id => this.loadComments(id));
    }
  },

  // 点踩评论
  async handleCommentDownvote(e) {
    const { commentId } = e.detail;

    if (!app.globalData.token) {
      const confirmed = await showConfirm(
        i18n.t('common.loginRequired'),
        i18n.t('common.loginConfirm')
      );
      if (confirmed) {
        wx.switchTab({ url: '/pages/settings/settings' });
      }
      return;
    }

    this._applyOptimisticVote(commentId, 'downvote');

    try {
      await commentAPI.vote(commentId, 'downvote');
    } catch (error) {
      console.error('投票失败:', error);
      showToast('投票失败');
      // 投票失败，重新加载以恢复正确状态
      const expandedReviewIds = Object.keys(this.data.expandedComments).filter(
        id => this.data.expandedComments[id]
      );
      expandedReviewIds.forEach(id => this.loadComments(id));
    }
  },

  // 切换回复框（旧的 handleCommentReply，保留用于兼容）
  handleCommentReply(e) {
    const { commentId, nickname, reviewId } = e.detail;
    this.handleToggleReply(e);
  },

  // 切换回复框显示
  handleToggleReply(e) {
    const { commentId, nickname, reviewId } = e.detail;

    console.log(`💬 切换回复框: reviewId=${reviewId}, commentId=${commentId}, nickname=${nickname}`);

    // 如果点击的是当前正在回复的评论，则关闭回复框
    if (this.data.replyingTo[reviewId] === commentId) {
      this.setData({
        [`replyingTo.${reviewId}`]: null,
        [`replyingToNickname.${reviewId}`]: '',
        [`replyInputValue.${reviewId}`]: ''
      });
    } else {
      // 否则打开回复框
      this.setData({
        [`replyingTo.${reviewId}`]: commentId,
        [`replyingToNickname.${reviewId}`]: nickname,
        [`replyInputValue.${reviewId}`]: ''
      });
    }
  },

  // 回复输入
  handleReplyInput(e) {
    const { value } = e.detail;

    // 找到当前展开的 reviewId
    const expandedReviewIds = Object.keys(this.data.expandedComments).filter(
      id => this.data.expandedComments[id]
    );

    if (expandedReviewIds.length > 0) {
      const reviewId = expandedReviewIds[0];
      this.setData({
        [`replyInputValue.${reviewId}`]: value
      });
    }
  },

  // 提交回复
  async handleSubmitReply(e) {
    // 找到当前展开的评论区
    const expandedReviewIds = Object.keys(this.data.expandedComments).filter(
      id => this.data.expandedComments[id]
    );

    if (expandedReviewIds.length === 0) return;

    const reviewId = expandedReviewIds[0];
    const content = this.data.replyInputValue[reviewId];
    const parentCommentId = this.data.replyingTo[reviewId];

    if (!content || content.trim().length === 0) {
      showToast('请输入回复内容');
      return;
    }

    if (content.trim().length > 500) {
      showToast('回复最多 500 字');
      return;
    }

    try {
      showLoading('发送中...');

      console.log(`📝 提交回复: reviewId=${reviewId}, parentCommentId=${parentCommentId}, content=${content}`);

      const res = await commentAPI.create(
        parseInt(reviewId),
        content.trim(),
        parentCommentId
      );

      if (res.success) {
        showToast('回复成功');

        // 清空输入和回复状态
        this.setData({
          [`replyInputValue.${reviewId}`]: '',
          [`replyingTo.${reviewId}`]: null,
          [`replyingToNickname.${reviewId}`]: ''
        });

        // 刷新评论列表
        this.loadComments(reviewId);

        // 手动增加评论计数
        const reviews = this.data.reviews.map(review => {
          if (review.id === parseInt(reviewId)) {
            return { ...review, comment_count: (review.comment_count || 0) + 1 };
          }
          return review;
        });
        this.setData({ reviews });
      } else {
        showToast(res.message || '回复失败');
      }
    } catch (error) {
      console.error('提交回复失败:', error);
      showToast('回复失败');
    } finally {
      hideLoading();
    }
  },

  // 取消回复
  handleCancelReply(e) {
    // 找到当前展开的 reviewId
    const expandedReviewIds = Object.keys(this.data.expandedComments).filter(
      id => this.data.expandedComments[id]
    );

    if (expandedReviewIds.length > 0) {
      const reviewId = expandedReviewIds[0];
      this.setData({
        [`replyingTo.${reviewId}`]: null,
        [`replyingToNickname.${reviewId}`]: '',
        [`replyInputValue.${reviewId}`]: ''
      });
    }
  },

  // 删除评论
  async handleCommentDelete(e) {
    const { commentId } = e.detail;

    const confirmed = await showConfirm(
      '确认删除',
      '删除后无法恢复，是否继续？'
    );

    if (!confirmed) return;

    try {
      showLoading('删除中...');

      const res = await commentAPI.delete(commentId);

      if (res.success) {
        showToast('删除成功');

        // 刷新当前展开的评论
        const expandedReviewIds = Object.keys(this.data.expandedComments).filter(
          id => this.data.expandedComments[id]
        );
        expandedReviewIds.forEach(id => {
          this.loadComments(id);

          // 手动减少评论计数
          const reviews = this.data.reviews.map(review => {
            if (review.id === parseInt(id)) {
              return { ...review, comment_count: Math.max(0, (review.comment_count || 0) - 1) };
            }
            return review;
          });
          this.setData({ reviews });
        });
      } else {
        showToast(res.message || '删除失败');
      }
    } catch (error) {
      console.error('删除评论失败:', error);
      showToast('删除失败');
    } finally {
      hideLoading();
    }
  },

  // 跳转到写评论页
  goToWriteReview() {
    if (!app.globalData.token) {
      showConfirm(
        i18n.t('common.loginRequired'),
        i18n.t('common.loginConfirm')
      ).then(confirmed => {
        if (confirmed) {
          wx.switchTab({
            url: '/pages/settings/settings'
          });
        }
      });
      return;
    }

    wx.navigateTo({
      url: `/pages/review-create/review-create?djId=${this.data.djId}&djName=${this.data.dj.name}`
    });
  },

  // 加载更多评论
  loadMoreReviews() {
    if (!this.data.hasMore || this.data.reviewsLoading) return;
    this.loadReviews(true);
  },

  // 下拉刷新
  async onPullDownRefresh() {
    await Promise.all([
      this.loadDJDetail(),
      this.loadReviews()
    ]);
    wx.stopPullDownRefresh();
  },

  // 检查管理员权限和登录状态
  checkAdminStatus() {
    const userInfo = app.globalData.userInfo;
    const token = app.globalData.token;
    this.setData({
      isLoggedIn: !!token,
      isAdmin: !!(userInfo && userInfo.role === 'admin')
    });
  },

  // 展开/收起 bio
  toggleBio() {
    this.setData({ bioExpanded: !this.data.bioExpanded });
  },

  // 跳转到编辑页面（管理员）
  goToEdit() {
    wx.navigateTo({
      url: `/pages/dj-upload/dj-upload?id=${this.data.djId}`
    });
  },

  // 跳转到申请修改页面（普通用户）
  goToEditRequest() {
    wx.navigateTo({
      url: `/pages/dj-upload/dj-upload?id=${this.data.djId}&mode=editRequest`
    });
  },

  // 根据名字长度计算字体大小
  calculateNameFontSize(name) {
    if (!name) return '64rpx';

    const length = name.length;

    if (length <= 6) {
      return '72rpx';  // 短名字：大字号
    } else if (length <= 10) {
      return '56rpx';  // 中等名字：较小字号
    } else if (length <= 14) {
      return '48rpx';  // 较长名字：小字号
    } else if (length <= 18) {
      return '42rpx';  // 长名字：更小字号
    } else {
      return '36rpx';  // 超长名字：最小字号
    }
  }
});
