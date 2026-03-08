const { pinyin } = require('pinyin-pro');

/**
 * 获取名字的首字母（大写）
 * - 中文：转拼音取首字母
 * - 英文/拉丁字母：直接取首字母
 * - 数字：返回 '#'
 * - 其他：返回 '#'
 */
function getNameInitial(name) {
  if (!name || typeof name !== 'string') return '#';

  const trimmed = name.trim();
  if (!trimmed) return '#';

  const firstChar = trimmed.charAt(0);

  // 数字开头
  if (/[0-9]/.test(firstChar)) {
    return '#';
  }

  // 英文/拉丁字母开头
  if (/[A-Za-z]/.test(firstChar)) {
    return firstChar.toUpperCase();
  }

  // 中文字符：用 pinyin-pro 转换
  if (/[\u4e00-\u9fff\u3400-\u4dbf\uF900-\uFAFF]/.test(firstChar)) {
    const py = pinyin(firstChar, { pattern: 'first', toneType: 'none' });
    if (py && /[a-zA-Z]/.test(py.charAt(0))) {
      return py.charAt(0).toUpperCase();
    }
  }

  return '#';
}

module.exports = { getNameInitial };
