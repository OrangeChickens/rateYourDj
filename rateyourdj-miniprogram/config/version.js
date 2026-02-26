/**
 * RateYourDJ Mini-Program Version
 * Single source of truth for version tracking.
 */
module.exports = {
  version: '0.1.6-beta',
  buildDate: '2026-02-26',
  changelog: [
    '0.1.6-beta - 评价页支持自定义标签输入',
    '0.1.5-beta - 首页DJ排序改用Bayesian加权评分',
    '0.1.4-beta - 修复评价投票互斥、显示已投状态、乐观更新',
    '0.1.3-beta - 修复"查看更多回复"点击无反应的问题',
    '0.1.2-beta - 修复评论回复不显示、waitlist 添加登录入口',
    '0.1.1-beta - 允许未登录浏览：waitlist验证后直接进首页，移除强制跳转',
    '0.1.0-beta - Initial beta with waitlist, invite codes, DJ browsing, reviews'
  ]
}
