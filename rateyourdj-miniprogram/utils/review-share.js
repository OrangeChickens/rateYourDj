// 评价分享保持精确ID；封面生成失败时仍可通过标题与链接查看原评价。
function sharePath(id) {
  return `/pages/review-detail/review-detail?id=${encodeURIComponent(id)}`;
}
function wrapText(ctx, text, width, maxLines) {
  const chars = Array.from(String(text || '').replace(/\s+/g, ' ').trim());
  const lines = [];
  let line = '';
  for (let i = 0; i < chars.length; i++) {
    const candidate = line + chars[i];
    if (ctx.measureText(candidate).width > width && line) {
      lines.push(line);
      line = chars[i];
      if (lines.length === maxLines) {
        let last = lines[maxLines - 1];
        while (last && ctx.measureText(last + '…').width > width) last = last.slice(0, -1);
        lines[maxLines - 1] = last + '…';
        return lines;
      }
    } else line = candidate;
  }
  if (line) lines.push(line);
  return lines;
}
function drawCover(review, dj, page) {
  return new Promise(resolve => {
    let finished = false;
    const done = value => { if (!finished) { finished = true; clearTimeout(timer); resolve(value); } };
    const timer = setTimeout(() => done(null), 2000);
    try {
      const ctx = wx.createCanvasContext('review-share-canvas', page);
      ctx.setFillStyle('#FFF'); ctx.fillRect(0, 0, 500, 400);
      ctx.setStrokeStyle('#000'); ctx.setLineWidth(4); ctx.strokeRect(2, 2, 496, 396);
      ctx.setFillStyle('#000'); ctx.setFontSize(18); ctx.fillText('RATEYOURDJ / REVIEW', 32, 40);
      ctx.setFontSize(32);
      wrapText(ctx, dj.name, 436, 2).forEach((line, i) => ctx.fillText(line, 32, 88 + i * 40));
      ctx.setFontSize(22); ctx.fillText(`${review.overall_rating} / 5`, 32, 170);
      ctx.setFontSize(24);
      wrapText(ctx, review.comment, 436, 4).forEach((line, i) => ctx.fillText(line, 32, 218 + i * 34));
      ctx.setFillStyle('#666'); ctx.setFontSize(18); ctx.fillText('RATEYOURDJ', 32, 372);
      ctx.draw(false, () => {
        if (finished) return;
        wx.canvasToTempFilePath({ canvasId: 'review-share-canvas', width: 500, height: 400,
          destWidth: 1000, destHeight: 800, fileType: 'png',
          success: res => done(res.tempFilePath), fail: () => done(null)
        }, page);
      });
    } catch (error) { done(null); }
  });
}
function createReviewShare(review, dj, page) {
  const snippet = String(review.comment || '').replace(/\s+/g, ' ').trim().slice(0, 60);
  const payload = { title: `${dj.name} · ${review.overall_rating}/5 · ${snippet}`, path: sharePath(review.id), imageUrl: dj.photo_url || '' };
  // 同一页面复用一个画布，串行生成以免快速分享不同评价时封面串内容。
  const cover = (page._shareCoverQueue || Promise.resolve()).then(() => drawCover(review, dj, page));
  page._shareCoverQueue = cover.catch(() => null);
  return { ...payload, promise: cover.then(imageUrl => ({ ...payload, imageUrl: imageUrl || payload.imageUrl })).catch(() => payload) };
}
module.exports = { sharePath, wrapText, createReviewShare };
