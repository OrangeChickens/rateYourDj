// 空值表示全部；仅允许 1–5 的整数星级。
function parseReviewRating(value) {
  if (value === undefined || value === null || value === '') return null;
  if (!['string', 'number'].includes(typeof value) || !/^[1-5]$/.test(String(value))) {
    const error = new Error('星数筛选必须为1至5的整数');
    error.statusCode = 400;
    throw error;
  }
  return Number(value);
}
module.exports = { parseReviewRating };
