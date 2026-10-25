// 仅返回面向作者的解释，不暴露敏感词命中明细或风控阈值。
function pendingReason(contentResult, qualityResult, wxResult, spamFlags = []) {
  const reasons = [];
  if (contentResult && !contentResult.safe) {
    const categories = { profanity: '疑似辱骂或人身攻击', appearance: '疑似针对外貌的人身评价', sexual: '疑似色情或不适宜内容', discrimination: '疑似歧视性表达', threats: '疑似威胁性表达', emoji: '疑似不适宜符号表达' };
    reasons.push(categories[contentResult.category] || '内容可能不符合社区规则');
  }
  if (qualityResult && qualityResult.quality === 'low') {
    const quality = { empty: '请补充具体评价内容', too_many_emoji: '表情或符号较多，请补充实际听感', too_short_zh: '评价内容过短，请补充具体听感', too_short_en: '评价内容过短，请补充具体听感', not_enough_unique_zh: '重复表达较多，请补充具体听感', not_enough_unique_en: '重复表达较多，请补充具体听感' };
    reasons.push(quality[qualityResult.reason] || '评价内容需要进一步核实');
  }
  if (wxResult && !wxResult.safe) reasons.push('内容安全检测需要进一步核实');
  if (spamFlags.length) reasons.push('本次提交需要进一步核实');
  return reasons.length ? reasons.join('；') + '。已转人工审核，尚未判定违规。' : null;
}
function reviewReason(status, reason) {
  if (status === 'approved') return null;
  if (reason !== undefined && reason !== null && (typeof reason !== 'string' || reason.trim().length > 500)) {
    const error = new Error('审核原因须为不超过500字的文字'); error.statusCode = 400; throw error;
  }
  const value = typeof reason === 'string' ? reason.trim() : '';
  if (status === 'rejected' && !value) {
    const error = new Error('拒绝时请填写具体原因，方便作者了解和修改'); error.statusCode = 400; throw error;
  }
  return value || '已转人工审核，尚未判定违规。';
}
module.exports = { pendingReason, reviewReason };
