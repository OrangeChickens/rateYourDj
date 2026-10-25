const api=require('../../utils/dj-content');
const calendar=require('../../utils/event-calendar');
Page({
  data:{from:'',to:'',days:[],city:'',cities:['全部城市'],cityIndex:0,mode:'list',rows:[],markers:[],mapLatitude:31.2304,mapLongitude:121.4737,includePoints:[],total:0,unmapped:0,loading:false,error:'',page:1,hasMore:false,rangeLabel:'',venueRows:[],venueTitle:'',citiesError:''},
  onLoad() {const date=calendar.today();this.setData({from:date,to:date,days:calendar.days(date),rangeLabel:date});this.loadCities();this.load();},
  onShow() {if(this._loaded) this.load();},
  async loadCities() {try {const res=await api.eventCities();this.setData({cities:['全部城市',...res.data],citiesError:''});} catch(error) {this.setData({citiesError:'城市列表加载失败，可重试或先查看全部城市'});}},
  async load(append=false) {
    if(append&&(this.data.loading||!this.data.hasMore||this.data.error)) return;
    const request=this._request=(this._request||0)+1;
    const page=append?this.data.page+1:1;
    this.setData({loading:true,error:'',venueRows:[],venueTitle:'',...(append?{}:{rows:[],markers:[],includePoints:[],total:0,unmapped:0,hasMore:false})});
    try {
      const res=await api.events({from:this.data.from,to:this.data.to,city:this.data.city,page,limit:50});
      if(request!==this._request) return;
      const rows=append?[...this.data.rows,...res.data.map(calendar.decorate)]:res.data.map(calendar.decorate);
      const markers=calendar.markers(rows),includePoints=markers.map(({latitude,longitude})=>({latitude,longitude}));
      this.setData({rows,markers,includePoints,total:res.pagination.total,page,hasMore:page<res.pagination.totalPages,unmapped:rows.filter(row=>!require('../../utils/event-location').coordinates(row)).length,...(markers.length?{mapLatitude:markers[0].latitude,mapLongitude:markers[0].longitude}:{})});
      this._loaded=true;
    } catch(error) {if(request===this._request) this.setData({error:error.message||'活动加载失败，请重试'});}
    finally {if(request===this._request) this.setData({loading:false});}
  },
  setRange(from,to=from) {this.setData({from,to,rangeLabel:from===to?from:from+' — '+to});this.load();},
  selectDay(e) {this.setRange(e.currentTarget.dataset.date);},
  pickDate(e) {this.setData({days:calendar.days(e.detail.value)});this.setRange(e.detail.value);},
  chooseToday() {const date=calendar.today();this.setData({days:calendar.days(date)});this.setRange(date);},
  chooseWeekend() {const range=calendar.weekend(calendar.today());this.setRange(range.from,range.to);},
  changeCity(e) {const index=Number(e.detail.value);this.setData({cityIndex:index,city:index?this.data.cities[index]:''});this.load();},
  changeMode(e) {this.setData({mode:e.currentTarget.dataset.mode});},
  viewEvent(e) {wx.navigateTo({url:'/pages/event-detail/event-detail?id='+e.currentTarget.dataset.id});},
  markerTap(e) {
    const marker=this.data.markers.find(item=>item.id===Number(e.detail.markerId));if(!marker) return;
    if(marker.eventIds.length===1) {this.viewEvent({currentTarget:{dataset:{id:marker.eventIds[0]}}});return;}
    // Native action sheets support at most six entries; show this venue's list instead.
    this.setData({venueRows:this.data.rows.filter(row=>marker.eventIds.includes(row.id)),venueTitle:marker.venue});
  },
  closeVenue() {this.setData({venueRows:[],venueTitle:''});},
  more() {this.load(true);},retry() {this.load();},
  onUnload() {this._request=(this._request||0)+1;}
});
