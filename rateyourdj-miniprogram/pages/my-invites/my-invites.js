// pages/my-invites/my-invites.js
const app = getApp();
import { showLoading, hideLoading, showToast, checkFullAccess } from '../../utils/util';

Page({
  data: {
    inviteQuota: 0,
    codes: [],
    generating: false,
    currentShareCode: '' // 当前要分享的邀请码
  },

  onLoad() {
    // 检查访问级别
    if (!checkFullAccess()) {
      return;
    }

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

  // 准备分享（在分享前设置当前邀请码）
  prepareShare(e) {
    const { code } = e.currentTarget.dataset;
    this.setData({
      currentShareCode: code
    });
  },

  // 微信分享
  onShareAppMessage() {
    const code = this.data.currentShareCode;

    // 分享文案库
    const shareTitles = [
      `DJ好不好，来这里看真实评价 | 邀请码「${code}」`,
      `一个可以说真话的DJ评分社区 | 邀请码「${code}」`,
      `不吹不黑，就说DJ真实水平 | 邀请码「${code}」`,
      `找好DJ、避雷渣DJ，都在这 | 邀请码「${code}」`,
      `好DJ值得被看见，烂的也值得被知道 | 邀请码「${code}」`,
      `发现了DJ评分社区，好的坏的都能说 | 邀请码「${code}」`,
      `DJ圈终于有说真话的地方了 | 邀请码「${code}」`,
      `终于可以给DJ打分了！邀请码「${code}」`,
      `遇到好DJ收藏，遇到烂的吐槽 | 邀请码「${code}」`
    ];

    // 随机选择一条
    const randomTitle = shareTitles[Math.floor(Math.random() * shareTitles.length)];

    return {
      title: randomTitle,
      path: `/pages/waitlist/waitlist?inviteCode=${code}`,
      imageUrl: '' // 可以设置自定义分享图片
    };
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
