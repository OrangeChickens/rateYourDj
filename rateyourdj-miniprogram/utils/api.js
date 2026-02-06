// API 接口封装
const app = getApp();

/**
 * DJ相关API
 */
export const djAPI = {
  // 获取DJ列表
  getList(params) {
    return app.request({
      url: '/dj/list',
      method: 'GET',
      data: params
    });
  },

  // 获取DJ详情
  getDetail(id) {
    return app.request({
      url: `/dj/${id}`,
      method: 'GET'
    });
  },

  // 搜索DJ
  search(keyword, page = 1, limit = 20) {
    return app.request({
      url: '/dj/search/query',
      method: 'GET',
      data: { keyword, page, limit }
    });
  },

  // 获取热门DJ
  getHotList(limit = 10) {
    return app.request({
      url: '/dj/hot/list',
      method: 'GET',
      data: { limit }
    });
  },

  // 获取城市列表
  getCities() {
    return app.request({
      url: '/dj/cities/all',
      method: 'GET'
    });
  },

  // 获取厂牌列表
  getLabels() {
    return app.request({
      url: '/dj/labels/all',
      method: 'GET'
    });
  },

  // 创建DJ（管理员）
  create(data) {
    return app.request({
      url: '/dj/create',
      method: 'POST',
      data,
      needAuth: true
    });
  }
};

/**
 * 评论相关API
 */
export const reviewAPI = {
  // 创建评论
  create(data) {
    return app.request({
      url: '/review/create',
      method: 'POST',
      data,
      needAuth: true
    });
  },

  // 获取DJ的评论列表
  getList(djId, params = {}) {
    return app.request({
      url: `/review/list/${djId}`,
      method: 'GET',
      data: params
    });
  },

  // 删除评论
  delete(reviewId) {
    return app.request({
      url: `/review/${reviewId}`,
      method: 'DELETE',
      needAuth: true
    });
  },

  // 标记评论有帮助
  markHelpful(reviewId) {
    return app.request({
      url: `/review/${reviewId}/helpful`,
      method: 'POST',
      needAuth: true
    });
  },

  // 举报评论
  report(reviewId) {
    return app.request({
      url: `/review/${reviewId}/report`,
      method: 'POST',
      needAuth: true
    });
  }
};

/**
 * 用户相关API
 */
export const userAPI = {
  // 获取用户资料
  getProfile() {
    return app.request({
      url: '/user/profile',
      method: 'GET',
      needAuth: true
    });
  },

  // 获取收藏列表
  getFavorites(page = 1, limit = 20) {
    return app.request({
      url: '/user/favorites',
      method: 'GET',
      data: { page, limit },
      needAuth: true
    });
  },

  // 收藏/取消收藏
  toggleFavorite(djId) {
    return app.request({
      url: `/user/favorite/${djId}`,
      method: 'POST',
      needAuth: true
    });
  },

  // 获取用户评论历史
  getReviews(page = 1, limit = 20) {
    return app.request({
      url: '/user/reviews',
      method: 'GET',
      data: { page, limit },
      needAuth: true
    });
  },

  // 获取搜索历史
  getSearchHistory() {
    return app.request({
      url: '/user/search-history',
      method: 'GET',
      needAuth: true
    });
  }
};

/**
 * 标签相关API
 */
export const tagAPI = {
  // 获取预设标签
  getPresets() {
    return app.request({
      url: '/tags/presets',
      method: 'GET'
    });
  },

  // 获取DJ的热门标签
  getDJTags(djId) {
    return app.request({
      url: `/tags/dj/${djId}`,
      method: 'GET'
    });
  }
};
