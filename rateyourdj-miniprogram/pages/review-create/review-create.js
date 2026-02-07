// pages/review-create/review-create.js
import { reviewAPI, tagAPI } from '../../utils/api';
import { showLoading, hideLoading, showToast } from '../../utils/util';
import i18n from '../../utils/i18n';

Page({
  data: {
    djId: null,
    djName: '',

    // 评分（1-5）
    overallRating: 0,
    setRating: 0,
    performanceRating: 0,
    personalityRating: 0,

    // 是否会再选
    wouldChooseAgain: false,

    // 评论内容
    comment: '',

    // 标签
    presetTags: [],
    selectedTags: [],
    maxTags: 5,

    // 匿名
    isAnonymous: false,

    // 国际化文本
    texts: {},

    // 提交中
    submitting: false,

    // 滑动提交相关
    swipeProgress: 0,
    touchStartY: 0,
    touchStartTime: 0
  },

  onLoad(options) {
    const djId = parseInt(options.djId);
    const djName = options.djName || '';

    if (!djId) {
      showToast('DJ ID 无效');
      wx.navigateBack();
      return;
    }

    this.setData({ djId, djName });
    this.updateLanguage();
    this.loadPresetTags();
  },

  // 更新语言
  updateLanguage() {
    this.setData({
      texts: {
        title: i18n.t('review.create'),
        rateOverall: i18n.t('review.rateOverall'),
        rateSet: i18n.t('review.rateSet'),
        ratePerformance: i18n.t('review.ratePerformance'),
        ratePersonality: i18n.t('review.ratePersonality'),
        wouldChooseAgain: i18n.t('review.wouldChooseAgain'),
        selectTags: i18n.t('review.selectTags'),
        styleTags: i18n.t('review.styleTags'),
        performanceTags: i18n.t('review.performanceTags'),
        personalityTags: i18n.t('review.personalityTags'),
        writeComment: i18n.t('review.writeComment'),
        commentPlaceholder: i18n.t('review.commentPlaceholder'),
        anonymous: i18n.t('review.anonymous'),
        tagsSelected: i18n.t('review.tagsSelected'),
        submitting: i18n.t('review.submitting'),
        submit: i18n.t('common.submit'),
        pleaseRate: i18n.t('review.pleaseRate'),
        commentRequired: i18n.t('review.commentRequired'),
        commentTooShort: i18n.t('review.commentTooShort')
      }
    });
  },

  // 加载预设标签
  async loadPresetTags() {
    try {
      showLoading();
      const res = await tagAPI.getPresets();

      if (res.success) {
        // 后端返回的是分组格式: { style: [...], performance: [...], personality: [...] }
        // 需要转换成扁平数组，每个标签带 category 字段
        const tags = [];

        // 处理音乐风格标签
        if (res.data.style) {
          res.data.style.forEach(tag => {
            tags.push({
              id: tag.id,
              name: tag.name,
              category: 'style',
              selected: false
            });
          });
        }

        // 处理表现力标签
        if (res.data.performance) {
          res.data.performance.forEach(tag => {
            tags.push({
              id: tag.id,
              name: tag.name,
              category: 'performance',
              selected: false
            });
          });
        }

        // 处理性格标签
        if (res.data.personality) {
          res.data.personality.forEach(tag => {
            tags.push({
              id: tag.id,
              name: tag.name,
              category: 'personality',
              selected: false
            });
          });
        }

        this.setData({ presetTags: tags });
      } else {
        showToast(res.message);
      }
    } catch (error) {
      console.error('加载标签失败:', error);
      showToast(i18n.t('error.loadFailed'));
    } finally {
      hideLoading();
    }
  },

  // 设置评分
  setRating(e) {
    const { type, value } = e.currentTarget.dataset;
    this.setData({ [type]: value });
  },

  // 切换会再选
  toggleWouldChoose(e) {
    this.setData({ wouldChooseAgain: e.detail.value });
  },

  // 切换标签选择
  toggleTag(e) {
    const { name, index } = e.currentTarget.dataset;
    console.log('点击标签:', name, 'index:', index);

    const presetTags = [...this.data.presetTags];
    const tag = presetTags[index];

    if (!tag) {
      console.error('找不到标签:', index);
      return;
    }

    // 切换选中状态
    const isCurrentlySelected = tag.selected || false;

    if (isCurrentlySelected) {
      // 取消选择
      tag.selected = false;
      console.log('取消选择:', name);
    } else {
      // 检查是否已达到最大数量
      const selectedCount = presetTags.filter(t => t.selected).length;
      if (selectedCount >= this.data.maxTags) {
        showToast(i18n.t('review.maxTagsReached').replace('{n}', this.data.maxTags));
        return;
      }
      tag.selected = true;
      console.log('添加选择:', name);
    }

    // 更新数据
    this.setData({
      presetTags,
      selectedTags: presetTags.filter(t => t.selected).map(t => t.name)
    }, () => {
      console.log('已选标签:', this.data.selectedTags);
    });
  },

  // 评论输入
  onCommentInput(e) {
    this.setData({ comment: e.detail.value });
  },

  // 切换匿名
  toggleAnonymous(e) {
    this.setData({ isAnonymous: e.detail.value });
  },

  // 验证表单
  validateForm() {
    const { overallRating, setRating, performanceRating, personalityRating, comment } = this.data;

    // 检查是否所有评分都已完成
    if (!overallRating || !setRating || !performanceRating || !personalityRating) {
      showToast(this.data.texts.pleaseRate);
      return false;
    }

    // 检查评论是否为空（必填）
    if (!comment || comment.trim().length === 0) {
      showToast(this.data.texts.commentRequired);
      return false;
    }

    // 检查评论长度（至少10字）
    if (comment.trim().length < 10) {
      showToast(this.data.texts.commentTooShort);
      return false;
    }

    return true;
  },

  // 提交评论
  async submitReview() {
    if (this.data.submitting) return;

    if (!this.validateForm()) return;

    try {
      this.setData({ submitting: true });
      showLoading(i18n.t('common.loading'));

      const data = {
        dj_id: this.data.djId,
        overall_rating: this.data.overallRating,
        set_rating: this.data.setRating,
        performance_rating: this.data.performanceRating,
        personality_rating: this.data.personalityRating,
        would_choose_again: this.data.wouldChooseAgain,
        comment: this.data.comment.trim() || null,
        tags: this.data.selectedTags,
        is_anonymous: this.data.isAnonymous
      };

      const res = await reviewAPI.create(data);

      if (res.success) {
        showToast(i18n.t('review.submitSuccess'));

        // 设置全局刷新标记，让DJ详情页在onShow时自动刷新
        const app = getApp();
        app.globalData.needRefreshDJDetail = true;

        // 延迟返回，让用户看到成功提示
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        showToast(res.message);
      }
    } catch (error) {
      console.error('提交评论失败:', error);
      showToast(i18n.t('review.submitFailed'));
    } finally {
      this.setData({ submitting: false });
      hideLoading();
    }
  },

  // 按类别获取标签
  getTagsByCategory(category) {
    return this.data.presetTags.filter(tag => tag.category === category);
  },

  // 触摸开始
  handleTouchStart(e) {
    if (this.data.submitting) return;

    this.setData({
      touchStartY: e.touches[0].pageY,
      touchStartTime: Date.now()
    });
  },

  // 触摸移动
  handleTouchMove(e) {
    if (this.data.submitting) return;

    const touchCurrentY = e.touches[0].pageY;
    const deltaY = this.data.touchStartY - touchCurrentY; // 向上滑动为正值

    if (deltaY > 0) {
      // 计算进度 (0-100)，最大滑动距离为150rpx
      const progress = Math.min((deltaY / 150) * 100, 100);
      this.setData({ swipeProgress: progress });
    } else {
      this.setData({ swipeProgress: 0 });
    }
  },

  // 触摸结束
  handleTouchEnd(e) {
    if (this.data.submitting) return;

    const touchEndY = e.changedTouches[0].pageY;
    const deltaY = this.data.touchStartY - touchEndY;
    const deltaTime = Date.now() - this.data.touchStartTime;

    // 如果滑动距离超过100rpx，或者快速滑动（速度够快），触发提交
    const velocity = deltaY / deltaTime; // 速度：像素/毫秒

    if (this.data.swipeProgress >= 100 || (deltaY > 50 && velocity > 0.5)) {
      // 触发提交
      this.submitReview();
    }

    // 重置进度
    this.setData({ swipeProgress: 0 });
  }
});
