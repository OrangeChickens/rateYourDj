const api = require('../../utils/dj-content');
Page({
  data: { djId: null, name: '', env: 'release', image: '', loading: false, error: '', saving: false },
  onLoad(options) {
    const djId = Number(options.djId); if (!Number.isSafeInteger(djId) || djId <= 0) { wx.navigateBack(); return; }
    let name = options.name || ''; try { name = decodeURIComponent(name); } catch (_) {}
    const version = wx.getAccountInfoSync().miniProgram.envVersion;
    this.setData({ djId, name, env: version === 'release' ? 'release' : 'trial' }); this.loadCode();
  },
  async loadCode() {
    if (this.data.loading) return;
    this.setData({ loading: true, error: '', image: '' });
    try {
      const res = await new Promise((resolve, reject) => wx.downloadFile({ url: api.codeURL(this.data.djId, this.data.env), success: resolve, fail: reject }));
      if (res.statusCode !== 200) throw new Error('生成失败，请重试，并确认对应版本已发布或已设置体验版。');
      this.setData({ image: res.tempFilePath });
    } catch (error) { this.setData({ error: error.message || '分享码加载失败，请重试' }); }
    finally { this.setData({ loading: false }); }
  },
  async save() {
    if (!this.data.image || this.data.saving) return;
    this.setData({ saving: true });
    try { await new Promise((resolve, reject) => wx.saveImageToPhotosAlbum({ filePath: this.data.image, success: resolve, fail: reject })); wx.showToast({ title: '已保存' }); }
    catch (_) { wx.showModal({ title: '未保存', content: '请确认允许保存到相册，或重试。', showCancel: false }); }
    finally { this.setData({ saving: false }); }
  },
  preview() { if (this.data.image) wx.previewImage({ current: this.data.image, urls: [this.data.image] }); }
});
