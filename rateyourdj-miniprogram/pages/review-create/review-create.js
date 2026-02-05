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
    wouldChooseAgain: true,

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
    submitting: false
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
        writeComment: i18n.t('review.writeComment'),
        commentPlaceholder: i18n.t('review.commentPlaceholder'),
        anonymous: i18n.t('review.anonymous'),
        submit: i18n.t('common.submit'),
        pleaseRate: i18n.t('review.pleaseRate'),
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
        // 按类别分组标签
        const tags = res.data.map(tag => ({
          id: tag.id,
          name: tag.tag_name,
          category: tag.category
        }));

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
    const { name } = e.currentTarget.dataset;
    const selectedTags = [...this.data.selectedTags];
    const index = selectedTags.indexOf(name);

    if (index > -1) {
      // 取消选择
      selectedTags.splice(index, 1);
    } else {
      // 选择标签
      if (selectedTags.length >= this.data.maxTags) {
        showToast(`最多选择${this.data.maxTags}个标签`);
        return;
      }
      selectedTags.push(name);
    }

    this.setData({ selectedTags });
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

    // 检查评论长度（可选，但如果填写则至少10字）
    if (comment && comment.trim().length < 10) {
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

        // 延迟返回，让用户看到成功提示
        setTimeout(() => {
          wx.navigateBack({
            success: () => {
              // 通知上一页刷新
              const pages = getCurrentPages();
              if (pages.length > 1) {
                const prevPage = pages[pages.length - 2];
                if (prevPage.route === 'pages/dj-detail/dj-detail') {
                  prevPage.loadReviews && prevPage.loadReviews();
                  prevPage.loadDJDetail && prevPage.loadDJDetail();
                }
              }
            }
          });
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
  }
});
