const api=require('../../utils/dj-content');
const {coordinates}=require('../../utils/event-location');
Page({
  data:{id:null,event:null,loading:true,error:'',point:null},
  onLoad(options) {if(!/^[1-9]\d*$/.test(options.id||'')) {this.setData({error:'活动ID无效',loading:false});return;}this.setData({id:Number(options.id)});this.load();},
  onShow() {if(this._loaded) this.load();},
  async load() {
    this.setData({loading:true,error:''});
    try {const res=await api.event(this.data.id);const point=coordinates(res.data);this.setData({event:res.data,point,markers:point?[{id:1,...point,iconPath:'/images/event-pin.png',width:28,height:36}]:[]});this._loaded=true;}
    catch(error) {this.setData({error:error.message||'活动加载失败',event:null});}
    finally {this.setData({loading:false});}
  },
  viewDJ(e) {wx.navigateTo({url:'/pages/dj-detail/dj-detail?id='+e.currentTarget.dataset.id});},
  navigate() {if(this.data.point) wx.openLocation({...this.data.point,name:this.data.event.venue,address:this.data.event.address||this.data.event.city,fail:()=>wx.showToast({title:'暂时无法打开地图',icon:'none'})});},
  copySource() {if(this.data.event.source_url) wx.setClipboardData({data:this.data.event.source_url});},
  onShareAppMessage() {return this.data.event?{title:this.data.event.title+' · '+this.data.event.city,path:'/pages/event-detail/event-detail?id='+this.data.id}:{title:'演出日历',path:'/pages/events/events'};}
});
