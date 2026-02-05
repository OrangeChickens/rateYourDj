/**
 * 格式化时间
 */
export function formatTime(date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();

  return `${[year, month, day].map(formatNumber).join('/')} ${[hour, minute, second].map(formatNumber).join(':')}`;
}

/**
 * 格式化日期
 */
export function formatDate(dateString) {
  if (!dateString) return '';

  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;

  // 小于1分钟
  if (diff < 60000) {
    return '刚刚';
  }

  // 小于1小时
  if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`;
  }

  // 小于1天
  if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}小时前`;
  }

  // 小于7天
  if (diff < 604800000) {
    return `${Math.floor(diff / 86400000)}天前`;
  }

  // 显示日期
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  if (year === now.getFullYear()) {
    return `${month}月${day}日`;
  }

  return `${year}年${month}月${day}日`;
}

const formatNumber = n => {
  n = n.toString();
  return n[1] ? n : `0${n}`;
};

/**
 * 显示toast提示
 */
export function showToast(title, icon = 'none') {
  wx.showToast({
    title,
    icon,
    duration: 2000
  });
}

/**
 * 显示加载中
 */
export function showLoading(title = '加载中...') {
  wx.showLoading({
    title,
    mask: true
  });
}

/**
 * 隐藏加载
 */
export function hideLoading() {
  wx.hideLoading();
}

/**
 * 显示确认对话框
 */
export function showConfirm(content, title = '提示') {
  return new Promise((resolve, reject) => {
    wx.showModal({
      title,
      content,
      success: (res) => {
        if (res.confirm) {
          resolve();
        } else {
          reject();
        }
      }
    });
  });
}

/**
 * 防抖函数
 */
export function debounce(fn, delay = 300) {
  let timer = null;
  return function(...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

/**
 * 节流函数
 */
export function throttle(fn, delay = 300) {
  let lastTime = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastTime >= delay) {
      lastTime = now;
      fn.apply(this, args);
    }
  };
}

/**
 * 检查是否登录
 */
export function checkLogin() {
  const app = getApp();
  return !!app.globalData.token;
}

/**
 * 要求登录
 */
export async function requireLogin() {
  const app = getApp();

  if (checkLogin()) {
    return true;
  }

  try {
    const res = await wx.showModal({
      title: '提示',
      content: '此功能需要登录，是否立即登录？'
    });

    if (res.confirm) {
      await app.login();
      return true;
    }

    return false;
  } catch (error) {
    console.error('登录失败:', error);
    showToast('登录失败，请重试');
    return false;
  }
}

/**
 * 格式化评分
 */
export function formatRating(rating) {
  if (!rating) return '0.0';
  return Number(rating).toFixed(1);
}

/**
 * 生成星星数组
 */
export function generateStars(rating) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return {
    full: fullStars,
    half: hasHalfStar ? 1 : 0,
    empty: emptyStars
  };
}

/**
 * 复制到剪贴板
 */
export function copyToClipboard(text) {
  wx.setClipboardData({
    data: text,
    success: () => {
      showToast('已复制到剪贴板', 'success');
    }
  });
}
