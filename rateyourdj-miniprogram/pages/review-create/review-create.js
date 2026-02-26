// pages/review-create/review-create.js
import { reviewAPI, tagAPI } from '../../utils/api';
import { showLoading, hideLoading, showToast, checkFullAccess } from '../../utils/util';
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

    // 音乐风格标签分类 (genre → subgroup 两级)
    styleCategories: [],
    originalCategories: [],
    searchKeyword: '',
    expandedGroups: {},

    // 自定义标签
    customTagInput: '',
    customTags: [],

    // 匿名
    isAnonymous: false,

    // 国际化文本
    texts: {},

    // 提交中
    submitting: false,

    // 滑动提交相关
    readyToSwipe: false, // 两步提交：先确认，再上滑
    swipeProgress: 0,
    touchStartY: 0,
    touchStartTime: 0,

    // 提交动画相关
    showSubmitAnimation: false,
    animationPhase: '', // 'slide-up' 或 'success'
    confettiPieces: []
  },

  onLoad(options) {
    // 检查访问级别
    if (!checkFullAccess()) {
      return;
    }

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
              genre_group: tag.genre_group || null,
              sub_group: tag.sub_group || null,
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

        // 处理音乐风格分类
        const styleTags = tags.filter(t => t.category === 'style');
        const categories = this.categorizeStyles(styleTags);

        this.setData({
          styleCategories: JSON.parse(JSON.stringify(categories)),
          originalCategories: categories
        });
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

  // 音乐风格分类 — 数据驱动，从 API 返回的 genre_group/sub_group 构建两级结构
  categorizeStyles(styles) {
    const genreMap = new Map(); // genre_group → { subgroups: Map<sub_group, tags[]> }

    styles.forEach(tag => {
      const group = tag.genre_group || '其他';
      const sub = tag.sub_group || '其他';

      if (!genreMap.has(group)) {
        genreMap.set(group, new Map());
      }
      const subMap = genreMap.get(group);
      if (!subMap.has(sub)) {
        subMap.set(sub, []);
      }
      subMap.get(sub).push(tag);
    });

    const categories = [];
    genreMap.forEach((subMap, genreName) => {
      const subgroups = [];
      let totalCount = 0;
      subMap.forEach((tags, subName) => {
        subgroups.push({ name: subName, tags, count: tags.length });
        totalCount += tags.length;
      });
      categories.push({ name: genreName, subgroups, totalCount });
    });

    return categories;
  },

  // 搜索输入
  onSearchInput(e) {
    const keyword = e.detail.value;
    this.setData({ searchKeyword: keyword });
    this.updateFilteredCategories();
  },

  // 更新过滤后的分类（两级过滤）
  updateFilteredCategories() {
    const keyword = this.data.searchKeyword.toLowerCase();

    if (!keyword) {
      this.setData({
        styleCategories: JSON.parse(JSON.stringify(this.data.originalCategories)),
        expandedGroups: {}
      });
      return;
    }

    // 两级过滤：过滤每个 subgroup 内的标签
    const filtered = [];
    const expandedGroups = {};

    this.data.originalCategories.forEach(genre => {
      const filteredSubgroups = [];
      let totalCount = 0;

      genre.subgroups.forEach(sub => {
        const filteredTags = sub.tags.filter(tag =>
          tag.name.toLowerCase().includes(keyword)
        );
        if (filteredTags.length > 0) {
          filteredSubgroups.push({ ...sub, tags: filteredTags, count: filteredTags.length });
          totalCount += filteredTags.length;
        }
      });

      if (filteredSubgroups.length > 0) {
        filtered.push({ ...genre, subgroups: filteredSubgroups, totalCount });
        expandedGroups[genre.name] = true; // 自动展开有结果的组
      }
    });

    this.setData({
      styleCategories: filtered,
      expandedGroups
    });
  },

  // 切换 Genre Group 展开/折叠
  toggleGenreGroup(e) {
    const groupName = e.currentTarget.dataset.name;
    const key = `expandedGroups.${groupName}`;
    this.setData({
      [key]: !this.data.expandedGroups[groupName]
    });
  },

  // 音乐风格标签点击
  toggleStyleTag(e) {
    const tagName = e.currentTarget.dataset.name;
    console.log('点击音乐风格标签:', tagName);

    let selectedTags = [...this.data.selectedTags];
    const index = selectedTags.indexOf(tagName);

    if (index > -1) {
      // 取消选择
      selectedTags.splice(index, 1);
      console.log('取消选择，剩余:', selectedTags);
    } else {
      // 添加选择
      if (selectedTags.length >= this.data.maxTags) {
        showToast(i18n.t('review.maxTagsReached').replace('{n}', this.data.maxTags));
        return;
      }
      selectedTags.push(tagName);
      console.log('添加选择，当前:', selectedTags);
    }

    // 同步更新 presetTags 的 selected 状态
    const presetTags = this.data.presetTags.map(tag => {
      if (tag.name === tagName) {
        return { ...tag, selected: !tag.selected };
      }
      return tag;
    });

    this.setData({
      selectedTags,
      presetTags
    }, () => {
      console.log('已选标签:', this.data.selectedTags);
    });
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
      // 检查是否已达到最大数量（含自定义标签）
      const selectedCount = presetTags.filter(t => t.selected).length + this.data.customTags.length;
      if (selectedCount >= this.data.maxTags) {
        showToast(i18n.t('review.maxTagsReached').replace('{n}', this.data.maxTags));
        return;
      }
      tag.selected = true;
      console.log('添加选择:', name);
    }

    // 更新数据（保留风格标签和自定义标签）
    const presetSelected = presetTags.filter(t => t.selected).map(t => t.name);
    // 收集已选的风格标签（不在 presetTags 中的非自定义标签）
    const presetNames = new Set(presetTags.map(t => t.name));
    const customNames = new Set(this.data.customTags);
    const styleTags = this.data.selectedTags.filter(t => !presetNames.has(t) && !customNames.has(t));
    this.setData({
      presetTags,
      selectedTags: [...styleTags, ...presetSelected, ...this.data.customTags]
    }, () => {
      console.log('已选标签:', this.data.selectedTags);
    });
  },

  // 自定义标签输入跟踪
  onCustomTagInput(e) {
    this.setData({ customTagInput: e.detail.value });
  },

  // 添加自定义标签
  addCustomTag() {
    const tagName = this.data.customTagInput.trim();

    if (!tagName) return;

    if (tagName.length > 20) {
      showToast('标签最多20个字符');
      return;
    }

    if (this.data.selectedTags.includes(tagName)) {
      showToast('标签已存在');
      return;
    }

    if (this.data.selectedTags.length >= this.data.maxTags) {
      showToast(i18n.t('review.maxTagsReached').replace('{n}', this.data.maxTags));
      return;
    }

    const selectedTags = [...this.data.selectedTags, tagName];
    const customTags = [...this.data.customTags, tagName];
    this.setData({
      selectedTags,
      customTags,
      customTagInput: ''
    });
  },

  // 移除自定义标签
  removeCustomTag(e) {
    const tagName = e.currentTarget.dataset.name;
    const selectedTags = this.data.selectedTags.filter(t => t !== tagName);
    const customTags = this.data.customTags.filter(t => t !== tagName);
    this.setData({ selectedTags, customTags });
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

    // 自动提交未确认的自定义标签输入
    if (this.data.customTagInput && this.data.customTagInput.trim()) {
      this.addCustomTag();
    }

    if (!this.validateForm()) return;

    try {
      this.setData({ submitting: true });

      // 第一阶段：页面向上滑动
      this.setData({
        showSubmitAnimation: true,
        animationPhase: 'slide-up'
      });

      // 等待滑动动画完成（500ms）
      await new Promise(resolve => setTimeout(resolve, 500));

      // 发送请求
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

      console.log('📤 提交标签:', data.tags, '自定义标签:', this.data.customTags);

      const res = await reviewAPI.create(data);

      if (res.success) {
        // 第二阶段：显示成功动画
        this.generateConfetti();
        this.setData({
          animationPhase: 'success'
        });

        // 成功触觉反馈
        wx.vibrateShort({
          type: 'heavy'
        });

        // 设置全局刷新标记
        const app = getApp();
        app.globalData.needRefreshDJDetail = true;

        // 延迟返回（2.5秒后）
        setTimeout(() => {
          wx.navigateBack();
        }, 2500);
      } else {
        // 失败时隐藏动画并显示错误
        this.setData({
          showSubmitAnimation: false,
          animationPhase: ''
        });
        showToast(res.message);
      }
    } catch (error) {
      console.error('提交评论失败:', error);
      this.setData({
        showSubmitAnimation: false,
        animationPhase: ''
      });
      showToast(i18n.t('review.submitFailed'));
    } finally {
      this.setData({ submitting: false });
    }
  },

  // 生成五彩纸屑
  generateConfetti() {
    const confettiPieces = [];
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];

    for (let i = 0; i < 50; i++) {
      confettiPieces.push({
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 2 + Math.random() * 2, // 2-4秒随机
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    this.setData({ confettiPieces });
  },

  // 按类别获取标签
  getTagsByCategory(category) {
    return this.data.presetTags.filter(tag => tag.category === category);
  },

  // 确认提交（第一步）
  confirmReady(e) {
    if (!this.validateForm()) return;
    wx.vibrateShort({ type: 'light' });
    this.setData({ readyToSwipe: true });
  },

  // 取消确认，回到按钮状态
  cancelReady() {
    this.setData({ readyToSwipe: false, swipeProgress: 0 });
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
      // 触觉反馈
      wx.vibrateShort({
        type: 'medium'
      });

      // 触发提交
      this.submitReview();
    }

    // 重置进度
    this.setData({ swipeProgress: 0 });
  }
});
