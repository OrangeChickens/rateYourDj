// pages/suggestions/suggestions.js
import { suggestionAPI } from '../../utils/api';
import { showToast, showConfirm, requireLogin, formatDate } from '../../utils/util';

const app = getApp();

Page({
  data: {
    suggestions: [],
    loading: true,
    currentPage: 1,
    hasMore: true,
    inputContent: '',
    submitting: false,
    isLoggedIn: false,
    currentUserId: null
  },

  onLoad() {
    this.checkLoginStatus();
    this.loadSuggestions();
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 2
      });
    }
    this.checkLoginStatus();
  },

  checkLoginStatus() {
    const token = app.globalData.token;
    const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo');
    this.setData({
      isLoggedIn: !!token,
      currentUserId: userInfo ? userInfo.id : null
    });
  },

  // 加载建议列表
  async loadSuggestions(append = false) {
    if (!append) {
      this.setData({ loading: true });
    }

    try {
      const res = await suggestionAPI.getList(this.data.currentPage, 20);
      if (res.success) {
        const list = res.data.map(item => ({
          ...item,
          timeAgo: formatDate(item.created_at)
        }));

        this.setData({
          suggestions: append ? [...this.data.suggestions, ...list] : list,
          hasMore: this.data.currentPage < res.pagination.totalPages,
          loading: false
        });
      }
    } catch (error) {
      console.error('加载建议失败:', error);
      this.setData({ loading: false });
    }
  },

  // 输入内容
  onInput(e) {
    this.setData({ inputContent: e.detail.value });
  },

  // 提交建议
  async handleSubmit() {
    const loggedIn = await requireLogin();
    if (!loggedIn) return;

    const content = this.data.inputContent.trim();
    if (!content) {
      showToast('请输入建议内容');
      return;
    }
    this.setData({ submitting: true });

    try {
      const res = await suggestionAPI.create(content);
      if (res.success) {
        showToast('提交成功');
        this.setData({
          inputContent: '',
          currentPage: 1
        });
        this.loadSuggestions();
      }
    } catch (error) {
      console.error('提交建议失败:', error);
      showToast('提交失败');
    } finally {
      this.setData({ submitting: false });
    }
  },

  // 投票
  async handleVote(e) {
    const loggedIn = await requireLogin();
    if (!loggedIn) return;

    const { id, type } = e.currentTarget.dataset;
    const idx = this.data.suggestions.findIndex(s => s.id === id);
    if (idx === -1) return;

    const item = this.data.suggestions[idx];
    const oldVote = item.user_vote;

    // 乐观更新
    let upDelta = 0, downDelta = 0, newVote = null;
    if (oldVote === type) {
      // 取消
      newVote = null;
      if (type === 'up') upDelta = -1;
      else downDelta = -1;
    } else {
      newVote = type;
      if (type === 'up') {
        upDelta = 1;
        if (oldVote === 'down') downDelta = -1;
      } else {
        downDelta = 1;
        if (oldVote === 'up') upDelta = -1;
      }
    }

    const key = `suggestions[${idx}]`;
    this.setData({
      [`${key}.user_vote`]: newVote,
      [`${key}.upvote_count`]: Math.max(0, item.upvote_count + upDelta),
      [`${key}.downvote_count`]: Math.max(0, item.downvote_count + downDelta)
    });

    try {
      await suggestionAPI.vote(id, type);
    } catch (error) {
      // 回滚
      this.setData({
        [`${key}.user_vote`]: oldVote,
        [`${key}.upvote_count`]: item.upvote_count,
        [`${key}.downvote_count`]: item.downvote_count
      });
      showToast('操作失败');
    }
  },

  // 删除建议
  async handleDelete(e) {
    const { id } = e.currentTarget.dataset;

    const confirmed = await showConfirm('删除建议', '确定要删除这条建议吗？');
    if (!confirmed) return;

    try {
      const res = await suggestionAPI.delete(id);
      if (res.success) {
        showToast('已删除');
        this.setData({
          suggestions: this.data.suggestions.filter(s => s.id !== id)
        });
      }
    } catch (error) {
      console.error('删除失败:', error);
      showToast('删除失败');
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({ currentPage: 1 });
    this.loadSuggestions().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 上拉加载更多
  onReachBottom() {
    if (!this.data.hasMore || this.data.loading) return;
    this.setData({ currentPage: this.data.currentPage + 1 });
    this.loadSuggestions(true);
  },

  // 登录
  handleLogin() {
    wx.navigateTo({ url: '/pages/login/login' });
  }
});
