// 国际化工具
import zhCN from '../i18n/zh-CN';
import enUS from '../i18n/en-US';

const languages = {
  'zh-CN': zhCN,
  'en-US': enUS
};

class I18n {
  constructor() {
    this.locale = wx.getStorageSync('locale') || 'zh-CN';
  }

  setLocale(locale) {
    if (languages[locale]) {
      this.locale = locale;
      wx.setStorageSync('locale', locale);
    }
  }

  getLocale() {
    return this.locale;
  }

  t(path) {
    const keys = path.split('.');
    let value = languages[this.locale];

    for (const key of keys) {
      if (value && typeof value === 'object') {
        value = value[key];
      } else {
        return path;
      }
    }

    return value || path;
  }
}

export default new I18n();
