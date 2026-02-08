// pages/my-reviews/my-reviews.js
import { userAPI, reviewAPI } from '../../utils/api';
import { showToast, formatDate, generateStars, checkFullAccess } from '../../utils/util';
import i18n from '../../utils/i18n';

const app = getApp();

Page({
  data: {
    reviews: [],
    loading: true,
    loadingMore: false,
    hasMore: true,
    currentPage: 1,
    texts: {}
  },

  onLoad(options) {
    // 检查访问级别
    if (!checkFullAccess()) {
      return;
    }

    this.updateLanguage();
    this.loadReviews();

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
  },

  // 更新语言
  updateLanguage() {
    this.setData({
      texts: {
        loading: i18n.t('common.loading'),
        noReviews: i18n.t('profile.noReviews'),
        set: 'SET',
        performance: '表演力',
        personality: '性格'
      }
    });
  },

  // 加载评论
  async loadReviews(append = false) {
    if (!append) {
      this.setData({ loading: true });
    } else {
      this.setData({ loadingMore: true });
    }

    try {
      const page = append ? this.data.currentPage + 1 : 1;
      const res = await userAPI.getReviews(page, 10);

      if (res.success) {
        // 处理评论数据
        const reviews = res.data.map(review => ({
          ...review,
          formattedDate: formatDate(review.created_at),
          stars: generateStars(review.overall_rating),
          tagList: Array.isArray(review.tags)
            ? review.tags
            : (review.tags ? review.tags.split(',') : [])
        }));

        this.setData({
          reviews: append ? [...this.data.reviews, ...reviews] : reviews,
          currentPage: page,
          hasMore: page < res.pagination.totalPages,
          loading: false,
          loadingMore: false
        });
      }
    } catch (error) {
      console.error('加载评论失败:', error);
      showToast('加载失败');
      this.setData({ loading: false, loadingMore: false });
    }
  },

  // 加载更多
  loadMore() {
    if (this.data.hasMore && !this.data.loadingMore) {
      this.loadReviews(true);
    }
  },

  // 删除评论
  deleteReview(e) {
    const reviewId = e.currentTarget.dataset.id;

    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条评论吗？',
      confirmText: '删除',
      confirmColor: '#000000',
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await reviewAPI.delete(reviewId);
            if (result.success) {
              showToast('删除成功');
              // 重新加载列表
              this.loadReviews();
            }
          } catch (error) {
            console.error('删除失败:', error);
            showToast('删除失败');
          }
        }
      }
    });
  },

  // 跳转到 DJ 详情
  goToDJDetail(e) {
    const djId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/dj-detail/dj-detail?id=${djId}`
    });
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadReviews();
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
  },

  // 触底加载
  onReachBottom() {
    this.loadMore();
  },

  // 阻止事件冒泡（用于分享按钮）
  preventBubble() {
    // 空函数，只用于阻止事件冒泡到父元素
  },

  // 分享评论给好友
  onShareAppMessage(options) {
    console.log('📤 触发分享到好友/群聊');
    // 设置标记，在页面onShow时记录任务
    this.pendingShareTask = true;

    // 从按钮的 dataset 中获取评论信息
    const review = options && options.target && options.target.dataset ? options.target.dataset.review : null;

    if (!review) {
      return {
        title: '我的DJ评价 - 烂u盘',
        path: '/pages/index/index'
      };
    }

    // 构建星星显示
    const stars = '⭐'.repeat(review.overall_rating);

    // 构建分享标题
    const title = `我给${review.dj_name}的评价：${stars} ${review.overall_rating}分`;

    // 构建分享路径，跳转到DJ详情页
    const path = `/pages/dj-detail/dj-detail?id=${review.dj_id}`;

    return {
      title: title,
      path: path,
      imageUrl: '' // 可以使用DJ的照片
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    console.log('📤 触发分享到朋友圈');
    // 设置标记，在页面onShow时记录任务
    this.pendingShareTask = true;

    return {
      title: '我的DJ评价 - 烂u盘',
      query: ''
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
  }
});
