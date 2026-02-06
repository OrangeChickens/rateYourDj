// pages/dj-detail/dj-detail.js
import { djAPI, reviewAPI, userAPI } from '../../utils/api';
import { showLoading, hideLoading, showToast, showConfirm, generateStars, formatDate } from '../../utils/util';
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

    // 分页
    currentPage: 1,
    totalPages: 1,
    hasMore: true,

    // 排序
    sortType: 'created_at', // created_at, helpful_count, overall_rating
    sortOrder: 'DESC',
    sortOptions: [],
    selectedSortIndex: 0,

    // 国际化文本
    texts: {}
  },

  onLoad(options) {
    const djId = parseInt(options.id);
    if (!djId) {
      showToast('DJ ID 无效');
      wx.navigateBack();
      return;
    }

    this.setData({ djId });
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
          tagList: review.tags || []
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

  // 分享
  onShareAppMessage() {
    return {
      title: `${this.data.dj.name} - RateYourDJ`,
      path: `/pages/dj-detail/dj-detail?id=${this.data.djId}`
    };
  }
});
