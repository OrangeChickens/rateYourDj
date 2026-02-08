// 中文语言包
export default {
  common: {
    search: '搜索',
    cancel: '取消',
    confirm: '确认',
    delete: '删除',
    edit: '编辑',
    save: '保存',
    submit: '提交',
    loading: '加载中...',
    noData: '暂无数据',
    more: '查看更多',
    back: '返回',
    all: '全部',
    loadMore: '加载更多',
    noMore: '没有更多了',
    loginRequired: '需要登录',
    loginConfirm: '是否前往登录？',
    operationFailed: '操作失败'
  },

  tabBar: {
    home: '首页',
    favorites: '收藏',
    profile: '我的'
  },

  home: {
    title: 'RateYourDJ',
    hotDJs: '热门DJ',
    searchPlaceholder: '搜索DJ名称、城市或厂牌',
    selectCity: '选择城市',
    allCities: '全部城市',
    stats: {
      title: '平台数据',
      djTotal: 'DJ总数',
      reviewTotal: '评价总数',
      interactionTotal: '互动总数',
      userTotal: '用户总数'
    },
    recentReviews: {
      title: '最近评价',
      ratedDJ: '评价了',
      noReviews: '暂无评价'
    }
  },

  search: {
    title: '搜索',
    placeholder: '搜索DJ',
    history: '搜索历史',
    clearHistory: '清空历史',
    hotSearch: '热门搜索',
    result: '搜索结果',
    noResult: '未找到相关DJ',
    filterSort: '筛选排序'
  },

  djDetail: {
    overallRating: '综合评分',
    setRating: 'Set评分',
    performance: '表演力',
    personality: '性格',
    wouldChooseAgain: '会再次选择',
    reviews: '评论',
    writeReview: '写评价',
    favorite: '收藏',
    unfavorite: '取消收藏',
    ratingDistribution: '评分分布',
    popularTags: '热门标签',
    reviewList: '评论列表',
    sortBy: '排序',
    sortByTime: '按时间',
    sortByHelpful: '按点赞',
    sortByRating: '按评分',
    sortNewest: '最新评论',
    sortMostHelpful: '最有帮助',
    sortHighestRating: '评分最高',
    sortLowestRating: '评分最低',
    noReviews: '暂无评论，来写第一条吧！'
  },

  review: {
    create: '写评价',
    rateOverall: '综合评分',
    rateSet: 'Set评分',
    ratePerformance: '表演力评分',
    ratePersonality: '性格评分',
    wouldChooseAgain: '会再次选择这位DJ',
    selectTags: '选择标签（最多5个）',
    styleTags: '音乐风格',
    performanceTags: '表现力',
    personalityTags: '性格',
    writeComment: '写下你的评价...',
    commentPlaceholder: '分享你对这位DJ的看法，帮助其他人做出选择',
    anonymous: '匿名评论',
    anonymousUser: '匿名用户',
    tagsSelected: '已选择',
    submitting: '提交中...',
    maxTagsReached: '最多选择{n}个标签',
    submitSuccess: '评论提交成功',
    submitFailed: '评论提交失败',
    pleaseRate: '请完成所有评分',
    commentRequired: '请填写评论内容',
    commentTooShort: '评论至少10个字',
    helpful: '有帮助',
    notHelpful: '没帮助',
    report: '举报',
    deleteConfirm: '确认删除这条评论？',
    deleteSuccess: '评论已删除',
    helpfulMarked: '已标记有帮助',
    notHelpfulMarked: '已标记没帮助',
    reportTitle: '举报评论',
    reportConfirm: '确认举报这条评论吗？我们会尽快处理。'
  },

  comment: {
    reply: '回复',
    comments: '条评论',
    writeComment: '写评论...',
    upvote: '赞同',
    downvote: '反对',
    delete: '删除',
    noComments: '暂无评论，来说点什么吧',
    replyTo: '回复 @{nickname}...',
    maxDepth: '回复层级已达上限',
    minLength: '评论至少 10 个字',
    submitSuccess: '评论成功',
    submitFailed: '评论失败'
  },

  favorites: {
    title: '我的收藏',
    empty: '还没有收藏任何DJ',
    goExplore: '去首页看看',
    addSuccess: '收藏成功',
    removeSuccess: '取消收藏'
  },

  profile: {
    title: '我的',
    login: '登录',
    myReviews: '我的评论',
    myFavorites: '我的收藏',
    settings: '设置',
    about: '关于',
    reviewCount: '条评论',
    favoriteCount: '个收藏',
    logout: '退出登录',
    logoutConfirm: '确认退出登录？',
    noReviews: '还没有写过评论'
  },

  settings: {
    title: '设置',
    language: '语言设置',
    chinese: '简体中文',
    english: 'English',
    theme: '主题',
    notification: '通知',
    privacy: '隐私政策',
    terms: '服务条款',
    version: '版本',
    cache: '清除缓存',
    clearCacheConfirm: '确认清除缓存？',
    clearCacheSuccess: '缓存已清除'
  },

  city: {
    title: '选择城市',
    hotCities: '热门城市',
    allCities: '全部城市'
  },

  error: {
    networkError: '网络错误，请稍后重试',
    loginRequired: '请先登录',
    loginFailed: '登录失败',
    loadFailed: '加载失败',
    submitFailed: '提交失败',
    deleteFailed: '删除失败',
    unauthorized: '没有权限',
    notFound: '内容不存在',
    operationFailed: '操作失败，请重试'
  }
};
