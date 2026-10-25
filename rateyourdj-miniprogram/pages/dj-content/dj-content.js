const api = require('../../utils/dj-content');
const location = require('../../utils/event-location');
import { djAPI } from '../../utils/api';
const labels = { sets: 'SET 视频', events: '演出', duplicates: '重复资料' };
Page({
  data: { type: 'sets', djId: null, entryId: null, djName: '', title: '', feed_token: '', previewToken: '', date: '', time: '20:00', city: '', venue: '', address: '', latitude: null, longitude: null, choosingLocation: false, locationNotice: '', venueSelected: false, lineupSearchMessage: '', targetSearchMessage: '', lineup: [], lineupSearch: '', lineupCandidates: [], lineupSearching: false, source_url: '', reason: '', target_dj_id: null, targetName: '', search: '', candidates: [], searching: false, saving: false, loading: true, error: '', myItems: [], myPage: 1, myMore: false, myLoading: false, myError: '', expected_status: 'pending', isAdmin: false },
  onLoad(options) {
    if (!getApp().globalData.token) { wx.showToast({ title: '请先登录', icon: 'none' }); wx.navigateBack(); return; }
    const type = options.type, djId = Number(options.djId), entryId = options.id ? Number(options.id) : null;
    if (!labels[type] || !Number.isSafeInteger(djId) || djId <= 0 || (options.id && (!Number.isSafeInteger(entryId) || entryId <= 0))) { wx.navigateBack(); return; }
    if (type === 'sets' && getApp().globalData.userInfo?.role !== 'admin') { wx.showToast({ title: '仅管理员可添加SET', icon: 'none' }); wx.navigateBack(); return; }
    this.setData({ type, djId, entryId, isAdmin: getApp().globalData.userInfo?.role === 'admin', date: new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10) });
    wx.setNavigationBarTitle({ title: `${entryId ? '编辑' : '提交'}${labels[type]}` });
    this.load();
  },
  async load() {
    this.setData({ loading: true, error: '' });
    try {
      const res = await djAPI.getDetail(this.data.djId);
      if (Number(res.data.id) !== this.data.djId) throw new Error('DJ资料已合并，请返回新的DJ主页操作');
      this.setData({ djName: res.data.name, lineup: [{id: this.data.djId, name: res.data.name}] });
      if (this.data.entryId) {
        const entry = (await api.detail(this.data.type, this.data.entryId)).data;
        if (Number(entry.dj_id) !== this.data.djId) throw new Error('内容不属于当前DJ');
        this.setData({ title: entry.title || '', feed_token: entry.feed_token || entry.reference_text || '', date: (entry.starts_at || '').slice(0,10), time: (entry.starts_at || '').slice(11,16), lineup: entry.djs || this.data.lineup, address: entry.address || '', latitude: entry.latitude ?? null, longitude: entry.longitude ?? null, venueSelected: !!location.coordinates(entry), city: entry.city || '', venue: entry.venue || '', source_url: entry.source_url || '', expected_status: entry.status, previewToken: entry.feed_token || '' });
      } else { await this.loadMine(); }
    } catch (error) { this.setData({ error: error.message || '加载失败' }); }
    finally { this.setData({ loading: false }); }
  },
  onInput(e) {
    const field = e.currentTarget.dataset.field;
    if (['venue','address'].includes(field)) this.setData({latitude:null,longitude:null,venueSelected:false,locationNotice:'场地已修改，请重新选点以便在活动地图显示'});
    if (field === 'lineupSearch') { this._lineupRequest = (this._lineupRequest || 0) + 1; this.setData({lineupCandidates:[],lineupSearching:false,lineupSearchMessage:''}); }
    if (field === 'search') { this._targetRequest = (this._targetRequest || 0) + 1; this.setData({candidates:[],searching:false,targetSearchMessage:''}); }
    if (['title','feed_token','date','time','city','venue','address','lineupSearch','source_url','reason','search'].includes(field)) this.setData({ [field]: e.detail.value });
  },
  chooseVenue() {
    if (this.data.choosingLocation) return;
    if (!wx.chooseLocation) { this.setData({locationNotice:'当前微信不支持地图选点，请手动填写场地'}); return; }
    this.setData({choosingLocation:true,locationNotice:''});
    wx.chooseLocation({
      ...(location.coordinates(this.data) || {}),
      success: result => {
        try { const city = location.cityFromAddress(result.address); this.setData({...location.selected(result),city,venueSelected:true,locationNotice:city ? '已自动填入城市，可手动调整' : '地址中没有明确城市，请选择城市'}); wx.showToast({title:city ? '场地与城市已填入' : '场地已选择',icon:'success'}); }
        catch(error) { this.setData({locationNotice:error.message}); }
      },
      fail: error => { if (!/cancel/i.test(error.errMsg || '')) this.setData({locationNotice:'地图选点暂不可用，可手动填写城市与场地'}); },
      complete: () => this.setData({choosingLocation:false})
    });
  },
  selectCity(e) {
    const region=e.detail.value;
    if (Array.isArray(region) && region.length>=2) this.setData({city:region[1]==='市辖区'?region[0]:region[1]});
  },
  async searchLineup() {
    if (this.data.lineupSearching) return;
    const query = this.data.lineupSearch.trim();
    if (!query) { this.setData({lineupSearchMessage:'请输入 DJ 名称后搜索'}); return; }
    const request = this._lineupRequest = (this._lineupRequest || 0) + 1;
    this.setData({lineupSearching:true,lineupCandidates:[],lineupSearchMessage:'正在搜索 DJ…'});
    try {
      const res = await djAPI.search(query);
      if (request !== this._lineupRequest) return;
      const candidates = res.data.filter(dj=>!this.data.lineup.some(item=>Number(item.id)===Number(dj.id)));
      this.setData({lineupCandidates:candidates,lineupSearchMessage:candidates.length ? `找到 ${candidates.length} 位 DJ，点击添加到阵容` : res.data.length ? '匹配的 DJ 已在阵容中，无需重复添加' : '没有找到 DJ，试试更完整的名称或英文名'});
    } catch(error) {if(request === this._lineupRequest) this.setData({lineupSearchMessage:`搜索失败：${error.message || '请重试'}`});}
    finally {if(request === this._lineupRequest) this.setData({lineupSearching:false});}
  },
  addLineup(e) {
    if(this.data.lineup.length>=30) {wx.showToast({title:'阵容最多30位DJ',icon:'none'});return;}
    const dj=this.data.lineupCandidates.find(item=>Number(item.id)===Number(e.currentTarget.dataset.id));
    if(dj && !this.data.lineup.some(item=>Number(item.id)===Number(dj.id))) { this.setData({lineup:[...this.data.lineup,{id:dj.id,name:dj.name}],lineupCandidates:[],lineupSearch:'',lineupSearchMessage:`已添加 ${dj.name}`}); wx.showToast({title:'已添加到阵容',icon:'success'}); }
  },
  removeLineup(e) {const id=Number(e.currentTarget.dataset.id);if(id!==this.data.djId) this.setData({lineup:this.data.lineup.filter(item=>Number(item.id)!==id)});},
  async searchTarget() {
    if (this.data.searching) return;
    const query = this.data.search.trim();
    if (!query) {this.setData({targetSearchMessage:'请输入 DJ 名称后搜索'});return;}
    const request = this._targetRequest = (this._targetRequest || 0) + 1;
    this.setData({searching:true,candidates:[],targetSearchMessage:'正在搜索 DJ…'});
    try {
      const res = await djAPI.search(query);
      if (request !== this._targetRequest) return;
      const candidates = res.data.filter(dj=>Number(dj.id)!==this.data.djId);
      this.setData({candidates,targetSearchMessage:candidates.length ? `找到 ${candidates.length} 位 DJ，请选择应保留的主页` : '没有找到其他 DJ，请换个名称搜索'});
    } catch(error) {if(request === this._targetRequest) this.setData({targetSearchMessage:`搜索失败：${error.message || '请重试'}`});}
    finally {if(request === this._targetRequest) this.setData({searching:false});}
  },
  selectTarget(e) { const item = this.data.candidates.find(dj => Number(dj.id) === Number(e.currentTarget.dataset.id)); if (item) this.setData({ target_dj_id: Number(item.id), targetName: item.name }); },
  async submit() {
    if (this.data.saving || this.data.loading || this.data.error) return;
    if (this.data.type === 'sets' && !this.data.isAdmin) { wx.showToast({ title: '仅管理员可添加SET', icon: 'none' }); return; }
    const d = this.data;
    const payload = d.type === 'sets' ? { title: d.title, feed_token: d.feed_token } : d.type === 'events' ? { title: d.title, starts_at: `${d.date} ${d.time}`, city: d.city, venue: d.venue, address: d.address, latitude: d.latitude, longitude: d.longitude, dj_ids: d.lineup.map(dj=>dj.id), source_url: d.source_url } : { target_dj_id: d.target_dj_id, reason: d.reason };
    this.setData({ saving: true });
    try {
      const res = d.entryId ? await api.update(d.type, d.entryId, { ...payload, expected_status: d.expected_status }) : await api.create(d.djId, d.type, payload);
      getApp().globalData.needRefreshDJDetail = true;
      if (res.data?.status === 'pending') {
        wx.showModal({ title: '已提交审核', content: '通过后才会公开展示。可在本页下方“我的提交”查看状态和原因。', showCancel: false });
        this.setData({ title: '', feed_token: '', reason: '' }); await this.loadMine();
      } else { wx.showToast({ title: '已保存' }); wx.navigateBack(); }
    } catch (error) { wx.showModal({ title: '未保存', content: error.message || '请重试', showCancel: false }); }
    finally { this.setData({ saving: false }); }
  },
  async withdraw() {
    if (this.data.saving || !this.data.entryId) return;
    const confirm = await new Promise(resolve => wx.showModal({ title: '下架内容', editable: true, placeholderText: '请输入下架原因', success: resolve, fail: () => resolve({ confirm: false }) }));
    if (!confirm.confirm || !confirm.content?.trim()) return;
    this.setData({ saving: true });
    try { await api.moderate(this.data.type, this.data.entryId, { status: 'rejected', reason: confirm.content, expected_status: this.data.expected_status }); getApp().globalData.needRefreshDJDetail = true; wx.navigateBack(); }
    catch (error) { wx.showModal({ title: '未下架', content: error.message || '请重试', showCancel: false }); }
    finally { this.setData({ saving: false }); }
  },
  async loadMine(append = false) {
    if (this.data.myLoading) return;
    this.setData({ myLoading: true, myError: '' });
    const page = append ? this.data.myPage + 1 : 1;
    try { const res = await api.mine(this.data.djId, this.data.type, page); this.setData({ myItems: append ? [...this.data.myItems, ...res.data] : res.data, myPage: page, myMore: page < res.pagination.totalPages }); }
    catch (error) { this.setData({ myError: error.message || '提交记录加载失败' }); }
    finally { this.setData({ myLoading: false }); }
  },
  onUnload() { this._lineupRequest = (this._lineupRequest || 0) + 1; this._targetRequest = (this._targetRequest || 0) + 1; },
  retryMine() { this.loadMine(); },
  moreMine() { if (this.data.myMore) this.loadMine(true); }
});
