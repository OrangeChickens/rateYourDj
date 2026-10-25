import { reviewAPI } from '../../utils/api';
import { formatDate, generateStars } from '../../utils/util';
import i18n from '../../utils/i18n';
const { createReviewShare } = require('../../utils/review-share');

Page({
  data: { reviewId: null, review: null, loading: true, error: '', texts: {} },
  onLoad(options) {
    wx.hideShareMenu();
    this.setData({ texts: {
      loading: i18n.t('common.loading'), retry: i18n.t('reviewDetail.retry'),
      unavailable: i18n.t('reviewDetail.unavailable'), title: i18n.t('reviewDetail.title'),
      loadFailed: i18n.t('reviewDetail.loadFailed'), viewDJ: i18n.t('reviewDetail.viewDJ'),
      set: i18n.t('djDetail.setRating'), performance: i18n.t('djDetail.performance'),
      personality: i18n.t('djDetail.personality'), anonymousUser: i18n.t('review.anonymousUser'),
      share: i18n.t('review.share')
    } });
    wx.setNavigationBarTitle({ title: this.data.texts.title });
    if (!/^[1-9]\d*$/.test(options.id || '') || !Number.isSafeInteger(Number(options.id))) {
      this.setData({ loading: false, error: this.data.texts.unavailable });
      return;
    }
    this.setData({ reviewId: Number(options.id) });
    return this.loadReview();
  },
  async loadReview() {
    if (!this.data.reviewId) return;
    const requestId = (this._requestId || 0) + 1;
    this._requestId = requestId;
    this.setData({ loading: true, error: '', review: null });
    wx.hideShareMenu();
    try {
      const res = await reviewAPI.getDetail(this.data.reviewId);
      if (requestId !== this._requestId) return;
      if (!res.success || !res.data || Number(res.data.id) !== this.data.reviewId) {
        this.setData({ error: this.data.texts.unavailable });
        return;
      }
      const review = { ...res.data, formattedDate: formatDate(res.data.created_at), stars: generateStars(Number(res.data.overall_rating)) };
      this.setData({ review });
      wx.showShareMenu({ menus: ['shareAppMessage'] });
    } catch (error) {
      if (requestId !== this._requestId) return;
      this.setData({ error: error.statusCode === 404 && error.code === 'REVIEW_UNAVAILABLE' ? this.data.texts.unavailable : this.data.texts.loadFailed });
    } finally {
      if (requestId === this._requestId) this.setData({ loading: false });
    }
  },
  viewDJ() {
    const review = this.data.review;
    if (review) wx.navigateTo({ url: `/pages/dj-detail/dj-detail?id=${review.dj_id}` });
  },
  onShareAppMessage() {
    const review = this.data.review;
    if (!review) return { title: 'RateYourDJ', path: '/pages/index/index' };
    return createReviewShare(review, { name: review.dj_name, photo_url: review.dj_photo_url }, this);
  },
  async onPullDownRefresh() {
    await this.loadReview();
    wx.stopPullDownRefresh();
  },
  onUnload() { this._requestId = (this._requestId || 0) + 1; }
});
