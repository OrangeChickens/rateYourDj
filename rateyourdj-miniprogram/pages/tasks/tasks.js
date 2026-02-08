// pages/tasks/tasks.js
const app = getApp();
import { showLoading, hideLoading, showToast } from '../../utils/util';

Page({
  data: {
    inviteQuota: 0,
    invitesSent: 0,
    invitesAccepted: 0,

    beginnerTasks: [],
    advancedTasks: [],
    vipTasks: [],

    loading: false
  },

  onLoad() {
    this.loadTasks();
  },

  onShow() {
    // 每次显示时刷新任务列表
    this.loadTasks();
  },

  // 加载任务列表
  async loadTasks() {
    if (this.data.loading) return;

    try {
      this.setData({ loading: true });
      showLoading('加载中...');

      const res = await app.request({
        url: '/tasks/list',
        needAuth: true
      });

      if (res.success) {
        this.setData({
          inviteQuota: res.inviteQuota || 0,
          invitesSent: res.invitesSent || 0,
          invitesAccepted: res.invitesAccepted || 0,
          beginnerTasks: res.tasks.beginner || [],
          advancedTasks: res.tasks.advanced || [],
          vipTasks: res.tasks.vip || []
        });
      } else {
        showToast(res.message || '加载失败');
      }
    } catch (error) {
      console.error('加载任务列表失败:', error);
      showToast('加载失败，请重试');
    } finally {
      this.setData({ loading: false });
      hideLoading();
    }
  },

  // 点击任务卡片
  onTaskTap(e) {
    const { code } = e.currentTarget.dataset;

    // 找到对应的任务
    const allTasks = [
      ...this.data.beginnerTasks,
      ...this.data.advancedTasks,
      ...this.data.vipTasks
    ];
    const task = allTasks.find(t => t.code === code);

    if (!task) return;

    // 如果可以领取，则领取奖励
    if (task.canClaim) {
      this.claimReward(code, task.name, task.reward);
    } else if (task.completed) {
      showToast('任务已完成');
    } else {
      // 显示任务提示
      this.showTaskHint(task);
    }
  },

  // 领取奖励
  async claimReward(taskCode, taskName, reward) {
    try {
      showLoading('领取中...');

      const res = await app.request({
        url: '/tasks/claim',
        method: 'POST',
        data: { taskCode },
        needAuth: true
      });

      hideLoading();

      if (res.success) {
        // 显示成功提示
        wx.showModal({
          title: '🎉 领取成功！',
          content: `完成「${taskName}」任务\n获得 ${reward} 个邀请码`,
          showCancel: false,
          confirmText: '太棒了',
          success: () => {
            // 刷新任务列表
            this.loadTasks();
          }
        });
      } else {
        showToast(res.message || '领取失败');
      }
    } catch (error) {
      hideLoading();
      console.error('领取奖励失败:', error);
      showToast('领取失败，请重试');
    }
  },

  // 显示任务提示
  showTaskHint(task) {
    let hint = '';

    switch (task.code) {
      case 'first_review':
        hint = '去评价一个 DJ 即可完成';
        break;
      case 'reviews_3':
        hint = `还需评价 ${task.target - task.progress} 个 DJ`;
        break;
      case 'favorite_5':
        hint = `还需收藏 ${task.target - task.progress} 个 DJ`;
        break;
      case 'quality_review':
        hint = '评价时写 30 字以上的内容';
        break;
      case 'helpful_received_5':
        hint = `你的评价还需获得 ${task.target - task.progress} 个「有帮助」`;
        break;
      case 'reviews_10':
        hint = `还需评价 ${task.target - task.progress} 个 DJ`;
        break;
      case 'share_review':
        hint = '分享你的评价到朋友圈';
        break;
      case 'invite_active_user':
        hint = '邀请好友并让 TA 完成首次评价';
        break;
      case 'helpful_received_20':
        hint = `你的评价还需获得 ${task.target - task.progress} 个「有帮助」`;
        break;
      default:
        hint = '完成任务即可领取奖励';
    }

    wx.showModal({
      title: task.name,
      content: `${task.desc}\n\n当前进度: ${task.progress}/${task.target}\n\n${hint}`,
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 跳转到邀请码管理
  goToInvites() {
    wx.navigateTo({
      url: '/pages/my-invites/my-invites'
    });
  },

  // 下拉刷新
  async onPullDownRefresh() {
    await this.loadTasks();
    wx.stopPullDownRefresh();
  }
});
