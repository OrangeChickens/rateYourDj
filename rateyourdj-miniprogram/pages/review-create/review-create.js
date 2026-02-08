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

    // 音乐风格标签分类
    styleCategories: [],
    originalCategories: [],
    searchKeyword: '',
    expandedCategories: {},

    // 匿名
    isAnonymous: false,

    // 国际化文本
    texts: {},

    // 提交中
    submitting: false,

    // 滑动提交相关
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

  // 音乐风格分类
  categorizeStyles(styles) {
    const categoryRules = {
      '主流 EDM': ['EDM', 'Future Bass', 'Electro House', 'Melbourne Bounce', 'Hardstyle', 'Drum & Bass', 'Future House'],
      'Techno/House': ['Techno', 'House', 'Tech House', 'Minimal Techno', 'Industrial Techno', 'Acid Techno', 'Breakbeat', 'Garage', 'UK Garage', 'Disco House', 'Afro House', 'Micro House'],
      'Trance': ['Trance', 'Psytrance', 'Progressive Trance', 'Uplifting Trance', 'Tech Trance'],
      'Bass 音乐': ['Dubstep', 'Future Garage', 'Riddim', 'Halftime', 'Neurofunk'],
      '实验性/小众': ['Hyperpop', 'Glitch Hop', 'IDM', 'Vaporwave', 'Footwork', 'Jungle', 'Breakcore', 'Ambient', 'Downtempo', 'Trip Hop', 'Wave', 'Jersey Club'],
      '其他流行': ['Trap', 'Moombahton', 'Hardwave', 'Phonk', 'UK Drill', 'Slap House', 'Bassline', 'Grime', 'Electro Swing'],
      '中国/亚洲': ['国风电音', 'J-Core', 'K-House', 'Bounce', 'Hands Up']
    };

    const categories = [];
    const assignedTags = new Set();

    // 按规则分类
    for (const [categoryName, ruleNames] of Object.entries(categoryRules)) {
      const categoryTags = [];

      for (const style of styles) {
        if (ruleNames.includes(style.name)) {
          categoryTags.push(style);
          assignedTags.add(style.name);
        }
      }

      if (categoryTags.length > 0) {
        categories.push({
          name: categoryName,
          tags: categoryTags,
          count: categoryTags.length
        });
      }
    }

    // 未分类的放入"其他"
    const uncategorizedTags = styles.filter(s => !assignedTags.has(s.name));
    if (uncategorizedTags.length > 0) {
      categories.push({
        name: '其他',
        tags: uncategorizedTags,
        count: uncategorizedTags.length
      });
    }

    return categories;
  },

  // 搜索输入
  onSearchInput(e) {
    const keyword = e.detail.value;
    this.setData({ searchKeyword: keyword });
    this.updateFilteredCategories();
  },

  // 更新过滤后的分类
  updateFilteredCategories() {
    const keyword = this.data.searchKeyword.toLowerCase();

    if (!keyword) {
      // 清空搜索，恢复原始数据
      this.setData({
        styleCategories: JSON.parse(JSON.stringify(this.data.originalCategories))
      });
      return;
    }

    // 过滤标签
    const filteredCategories = this.data.originalCategories.map(category => {
      const filteredTags = category.tags.filter(tag =>
        tag.name.toLowerCase().includes(keyword) ||
        (tag.name_en && tag.name_en.toLowerCase().includes(keyword))
      );
      return {
        ...category,
        tags: filteredTags,
        count: filteredTags.length
      };
    }).filter(category => category.count > 0);

    // 自动展开有结果的分类
    const expandedCategories = {};
    filteredCategories.forEach(category => {
      expandedCategories[category.name] = true;
    });

    this.setData({
      styleCategories: filteredCategories,
      expandedCategories
    });
  },

  // 切换分类展开/折叠
  toggleCategory(e) {
    const categoryName = e.currentTarget.dataset.name;
    const key = `expandedCategories.${categoryName}`;
    this.setData({
      [key]: !this.data.expandedCategories[categoryName]
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
