/**
 * RateYourDJ Mini-Program Version
 * Single source of truth for version tracking.
 */
module.exports = {
  version: '0.2.5-beta',
  buildDate: '2026-03-07',
  userChangelog: '· DJ Bio + 资料修改申请，DJ名称大小写\n· 禁止人身攻击、辱骂，关注音乐、场景等在场真实体验\n· or You will be banned',
  changelog: [
    '0.2.5-beta - 建议页新增已完成tab，已完成建议从默认列表隐藏',
    '0.2.4-beta - DJ Bio字段，用户申请修改DJ资料，admin审核，DJ名称保留原始大小写',
    '0.2.3-beta - 合并评价审核页面(PENDING/REPORTED/APPROVED/REJECTED)',
    '0.2.2-beta - 待审核评价页面，ID类型修复，评价placeholder更新',
    '0.2.1-beta - 管理员内容审核：建议/评价/DJ审核，举报评价管理',
    '0.2.0-beta - 新增建议Tab，用户可提交产品建议并投票',
    '0.1.9-beta - DJ用户提交+管理员审核系统',
    '0.1.8-beta - 评论默认按热度排序，两步提交评价',
    '0.1.7-beta - 曲风分类重构：genre→subgenre两级嵌套，72个风格标签',
    '0.1.6-beta - 评价页支持自定义标签输入',
    '0.1.5-beta - 首页DJ排序改用Bayesian加权评分',
    '0.1.4-beta - 修复评价投票互斥、显示已投状态、乐观更新',
    '0.1.3-beta - 修复"查看更多回复"点击无反应的问题',
    '0.1.2-beta - 修复评论回复不显示、waitlist 添加登录入口',
    '0.1.1-beta - 允许未登录浏览：waitlist验证后直接进首页，移除强制跳转',
    '0.1.0-beta - Initial beta with waitlist, invite codes, DJ browsing, reviews'
  ]
}
