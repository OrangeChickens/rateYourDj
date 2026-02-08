// pages/my-invites/my-invites.js
const app = getApp();
import { showLoading, hideLoading, showToast } from '../../utils/util';

Page({
  data: {
    inviteQuota: 0,
    codes: [],
    generating: false
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    this.loadData();
  },

  // 加载数据
  async loadData() {
    await Promise.all([
      this.loadInviteQuota(),
      this.loadMyCodes()
    ]);
  },

  // 加载邀请码额度
  async loadInviteQuota() {
    try {
      const res = await app.request({
        url: '/tasks/list',
        needAuth: true
      });

      if (res.success) {
        this.setData({
          inviteQuota: res.inviteQuota || 0
        });
      }
    } catch (error) {
      console.error('加载邀请码额度失败:', error);
    }
  },

  // 加载我的邀请码
  async loadMyCodes() {
    try {
      showLoading();

      const res = await app.request({
        url: '/invite/my-codes',
        needAuth: true
      });

      if (res.success) {
        // 格式化时间
        const codes = res.codes.map(code => ({
          ...code,
          createdAt: this.formatTime(code.createdAt),
          usedBy: code.usedBy.map(user => ({
            ...user,
            usedAt: this.formatTime(user.usedAt)
          }))
        }));

        this.setData({ codes });
      } else {
        showToast(res.message || '加载失败');
      }
    } catch (error) {
      console.error('加载邀请码列表失败:', error);
      showToast('加载失败，请重试');
    } finally {
      hideLoading();
    }
  },

  // 生成邀请码
  async generateCode() {
    if (this.data.generating) return;
    if (this.data.inviteQuota <= 0) {
      showToast('邀请码额度不足');
      return;
    }

    try {
      this.setData({ generating: true });
      showLoading('生成中...');

      const res = await app.request({
        url: '/invite/generate',
        method: 'POST',
        needAuth: true
      });

      hideLoading();

      if (res.success) {
        showToast('生成成功');

        // 刷新数据
        this.loadData();
      } else {
        showToast(res.message || '生成失败');
      }
    } catch (error) {
      hideLoading();
      console.error('生成邀请码失败:', error);
      showToast('生成失败，请重试');
    } finally {
      this.setData({ generating: false });
    }
  },

  // 复制邀请码
  copyCode(e) {
    const { code } = e.currentTarget.dataset;

    wx.setClipboardData({
      data: code,
      success: () => {
        showToast('已复制到剪贴板');
      }
    });
  },

  // 分享邀请码
  shareCode(e) {
    const { code } = e.currentTarget.dataset;

    // 构造分享内容
    const shareText = `我在烂U盘发现了超多好DJ！用我的邀请码「${code}」加入吧`;

    // 复制分享文本到剪贴板
    wx.setClipboardData({
      data: shareText,
      success: () => {
        wx.showModal({
          title: '分享邀请码',
          content: `分享文本已复制到剪贴板\n\n${shareText}\n\n请粘贴分享给好友`,
          showCancel: false,
          confirmText: '知道了'
        });
      }
    });
  },

  // 跳转到任务中心
  goToTasks() {
    wx.navigateTo({
      url: '/pages/tasks/tasks'
    });
  },

  // 格式化时间
  formatTime(timestamp) {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    // 小于1分钟
    if (diff < 60000) {
      return '刚刚';
    }

    // 小于1小时
    if (diff < 3600000) {
      return `${Math.floor(diff / 60000)}分钟前`;
    }

    // 小于24小时
    if (diff < 86400000) {
      return `${Math.floor(diff / 3600000)}小时前`;
    }

    // 小于7天
    if (diff < 604800000) {
      return `${Math.floor(diff / 86400000)}天前`;
    }

    // 超过7天，显示日期
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');

    return `${year}-${month}-${day} ${hour}:${minute}`;
  },

  // 下拉刷新
  async onPullDownRefresh() {
    await this.loadData();
    wx.stopPullDownRefresh();
  }
});
