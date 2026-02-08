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

    // 分页
    currentPage: 1,
    totalPages: 1,
    hasMore: true,

    // 排序
    sortType: 'created_at', // created_at, helpful_count, overall_rating
    sortOrder: 'DESC',
    sortOptions: [],
    selectedSortIndex: 0,

    // 评论相关
    expandedComments: {},      // 展开的评论区（key: reviewId, value: boolean）
    reviewComments: {},        // 各评价的评论列表（key: reviewId, value: comments[]）
    commentInputs: {},         // 评论输入内容（key: reviewId, value: string）
    replyingTo: null,          // 正在回复的评论ID
    replyingToNickname: '',    // 正在回复的用户昵称

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
  },

  onShow() {
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
      i18n.t('djDetail.sortNewest'),
      i18n.t('djDetail.sortMostHelpful'),
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

        this.setData({ dj, loading: false });
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
        // 处理评论数据
        const reviews = res.data.map(review => ({
          ...review,
          stars: generateStars(review.overall_rating),
          formattedDate: formatDate(review.created_at),
          tagList: review.tags || [],
          avatar_url: review.avatar_url || '/images/default-avatar.png'
        }));

        this.setData({
          reviews: append ? [...this.data.reviews, ...reviews] : reviews,
          currentPage: page,
          totalPages: res.pagination.totalPages,
          hasMore: page < res.pagination.totalPages
        });
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
          case 0: // 最新
            sortType = 'created_at';
            sortOrder = 'DESC';
            break;
          case 1: // 最有帮助
            sortType = 'helpful_count';
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

  // 标记评论有帮助
  async markHelpful(e) {
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

    try {
      const res = await reviewAPI.markHelpful(id);
      if (res.success) {
        showToast(i18n.t('review.helpfulMarked'));
        // 刷新评论列表
        this.loadReviews();
      } else {
        showToast(res.message);
      }
    } catch (error) {
      console.error('标记有帮助失败:', error);
      showToast(i18n.t('error.operationFailed'));
    }
  },

  // 标记没帮助
  async markNotHelpful(e) {
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

    try {
      const res = await reviewAPI.markNotHelpful(id);
      if (res.success) {
        showToast(i18n.t('review.notHelpfulMarked'));
        // 刷新评论列表
        this.loadReviews();
      } else {
        showToast(res.message);
      }
    } catch (error) {
      console.error('标记没帮助失败:', error);
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
      if (res.success) {
        // 格式化评论数据
        const formattedComments = this.formatComments(res.data);

        this.setData({
          [`reviewComments.${reviewId}`]: formattedComments
        });

        // 更新评论计数
        const reviews = this.data.reviews.map(review => {
          if (review.id === parseInt(reviewId)) {
            return { ...review, comment_count: res.data.length };
          }
          return review;
        });
        this.setData({ reviews });
      }
    } catch (error) {
      console.error('加载评论失败:', error);
      showToast('加载评论失败');
    }
  },

  // 格式化评论数据
  formatComments(comments) {
    const userId = app.globalData.userInfo?.id;

    return comments.map(comment => {
      return {
        ...comment,
        timeAgo: this.formatTimeAgo(comment.created_at),
        canDelete: comment.user_id === userId
      };
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

  // 提交评论
  async submitComment(e) {
    const { reviewId } = e.currentTarget.dataset;
    const content = this.data.commentInputs[reviewId];

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

      const res = await commentAPI.create(
        parseInt(reviewId),
        content.trim(),
        this.data.replyingTo
      );

      if (res.success) {
        showToast(i18n.t('comment.submitSuccess') || '评论成功');

        // 清空输入和回复状态
        this.setData({
          [`commentInputs.${reviewId}`]: '',
          replyingTo: null,
          replyingToNickname: ''
        });

        // 刷新评论列表
        this.loadComments(reviewId);
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

  // 点赞评论
  async handleCommentUpvote(e) {
    const { commentId } = e.detail;

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
      await commentAPI.vote(commentId, 'upvote');

      // 刷新当前展开的评论
      const expandedReviewIds = Object.keys(this.data.expandedComments).filter(
        id => this.data.expandedComments[id]
      );
      expandedReviewIds.forEach(id => this.loadComments(id));
    } catch (error) {
      console.error('投票失败:', error);
      showToast('投票失败');
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
        wx.switchTab({
          url: '/pages/settings/settings'
        });
      }
      return;
    }

    try {
      await commentAPI.vote(commentId, 'downvote');

      // 刷新当前展开的评论
      const expandedReviewIds = Object.keys(this.data.expandedComments).filter(
        id => this.data.expandedComments[id]
      );
      expandedReviewIds.forEach(id => this.loadComments(id));
    } catch (error) {
      console.error('投票失败:', error);
      showToast('投票失败');
    }
  },

  // 回复评论
  handleCommentReply(e) {
    const { commentId, nickname } = e.detail;

    this.setData({
      replyingTo: commentId,
      replyingToNickname: nickname
    });

    // 可选：聚焦输入框（微信小程序需要用户主动触发）
    showToast(`回复 @${nickname}`);
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
        expandedReviewIds.forEach(id => this.loadComments(id));
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

  // 分享给好友
  onShareAppMessage() {
    const { dj } = this.data;
    if (!dj) {
      return {
        title: '查看DJ评分 - 烂u盘',
        path: '/pages/index/index'
      };
    }

    // 构建分享标题
    const rating = dj.overall_rating > 0 ? `⭐${dj.overall_rating}分` : '⭐';
    const reviewCount = dj.review_count > 0 ? `${dj.review_count}条评论` : '';
    const title = `DJ ${dj.name} | ${dj.city} ${rating} ${reviewCount}`.trim();

    return {
      title: title,
      path: `/pages/dj-detail/dj-detail?id=${this.data.djId}`,
      imageUrl: dj.photo_url || '' // 推荐5:4比例图片
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    const { dj } = this.data;
    if (!dj) {
      return {
        title: '查看DJ评分 - 烂u盘',
        query: ''
      };
    }

    const rating = dj.overall_rating > 0 ? `⭐${dj.overall_rating}分` : '⭐';
    const title = `推荐DJ：${dj.name} ${rating}`.trim();

    return {
      title: title,
      query: `id=${this.data.djId}`,
      imageUrl: dj.photo_url || ''
    };
  },

  // 检查管理员权限
  checkAdminStatus() {
    const userInfo = app.globalData.userInfo;
    if (userInfo && userInfo.role === 'admin') {
      this.setData({ isAdmin: true });
    }
  },

  // 跳转到编辑页面
  goToEdit() {
    wx.navigateTo({
      url: `/pages/dj-upload/dj-upload?id=${this.data.djId}`
    });
  }
});
