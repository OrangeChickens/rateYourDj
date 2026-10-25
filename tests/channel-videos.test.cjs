const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const videos = { 9: [{ id: 1, title: 'LIUYANG 视频', feed_token: 'token/ADRhgWPJw' }] };
const scene = require('../rateyourdj-miniprogram/utils/dj-scene');
function page(djId, supported = true, apiOverride = null, role = 'guest', wxOverride = {}) {
  let definition;
  const app = {globalData: role === 'guest' ? {} : {token:'fixture',userInfo:{role}}};
  const source = fs.readFileSync(path.join(root, 'rateyourdj-miniprogram/pages/dj-detail/dj-detail.js'), 'utf8').replace(/^import .*;\n/gm, '');
  vm.runInNewContext(source, {
    Page: p => definition = p, getApp: () => app,
    require: name => name === '../../utils/dj-content' ? apiOverride || { list: async (id, type) => ({ success: true, data: type === 'sets' ? videos[id] || [] : [], pagination: {totalPages: 1} }) } : name === '../../utils/dj-scene' ? scene : {},
    wx: { canIUse: () => supported, ...wxOverride },
    djAPI: { getDetail: async () => ({ success: true, data: { id: djId, name: 'LIUYANG刘炀' } }) },
    showLoading() {}, hideLoading() {}, showToast() {}, generateStars: () => ({ full: [], empty: [] }),
    console, setTimeout, i18n: { t: x => x }
  });
  definition.data = JSON.parse(JSON.stringify(definition.data));
  definition.data.djId = djId;
  definition.setData = function(data) { Object.assign(this.data, data); };
  definition._testApp = app;
  return definition;
}
test('只在指定DJ展示提供的视频，其他DJ没有视频板块', async () => {
  const target = page(9); await target.loadDJDetail();
  assert.equal(target.data.channelVideos.length, 1);
  assert.equal(target.data.channelVideos[0].feedToken, 'token/ADRhgWPJw');
  assert.equal(target.data.supportsChannelVideo, true);
  const other = page(10); await other.loadDJDetail();
  assert.equal(other.data.channelVideos.length, 0);
});
test('播放器失败显示错误，重试重新挂载，错误索引不影响视频', async () => {
  const p = page(9); await p.loadDJDetail();
  p.onChannelVideoError({ currentTarget: { dataset: { index: '0' } } });
  assert.equal(p.data.channelVideos[0].error, true);
  p.retryChannelVideo({ currentTarget: { dataset: { index: '0' } } });
  assert.equal(p.data.channelVideos[0].error, false);
  p.onChannelVideoError({ currentTarget: { dataset: { index: '-1' } } });
  p.onChannelVideoError({ currentTarget: { dataset: { index: 'oops' } } });
  assert.equal(p.data.channelVideos[0].error, false);
  assert.equal(videos[9][0].error, undefined);
});
test('不支持原生组件时保留兼容提示状态，不尝试伪造跳转参数', async () => {
  const p = page(9, false); await p.loadDJDetail();
  assert.equal(p.data.supportsChannelVideo, false);
  assert.equal(p.data.channelVideos.length, 1);
});

test('分享码scene解析严格校验并兼容原链接', () => {
  assert.equal(scene.getDJId({scene:'d%3D9'}),9);
  assert.equal(scene.getDJId({id:'9'}),9);
  for(const options of [{scene:'d=9&id=2'},{scene:'%qq'},{id:'9evil'},{id:'0'},{id:'9007199254740993'}]) assert.equal(scene.getDJId(options),null);
});

test('演出摘要只请求各3条，旧响应不会覆盖新请求或解除新请求加载状态', async () => {
  const pending=[];
  const p=page(9,true,{list:(id,type,params)=>new Promise(resolve=>pending.push({params,resolve}))});
  const old=p.loadEvents();const current=p.loadEvents();
  assert.equal(pending[0].params.limit,3);assert.equal(pending[0].params.period,'upcoming');assert.equal(pending[1].params.period,'past');
  pending[0].resolve({data:[{id:1}],pagination:{total:1}});pending[1].resolve({data:[],pagination:{total:0}});await old;
  assert.equal(p.data.eventsLoading,true);assert.equal(p.data.events.length,0);
  pending[2].resolve({data:[{id:2}],pagination:{total:1}});pending[3].resolve({data:[],pagination:{total:0}});await current;
  assert.equal(p.data.events[0].id,2);assert.equal(p.data.eventsLoading,false);
});
test('DJ演出摘要最多3场，优先近期并补最近往期，更多进入该DJ独立列表',async()=>{
 let url;const p=page(9,true,{list:async(id,type,params)=>params.period==='upcoming'?{data:[{id:1},{id:2}],pagination:{total:2}}:{data:[{id:3},{id:4},{id:5}],pagination:{total:7}}},'guest',{navigateTo:o=>url=o.url});
 await p.loadEvents();assert.deepEqual(Array.from(p.data.events,item=>item.id),[1,2,3]);assert.equal(p.data.eventsMore,true);
 p.viewAllEvents();assert.equal(url,'/pages/dj-events/dj-events?djId=9');
});
test('没有演出时摘要为空且不出现查看全部，加载失败不假装无数据',async()=>{
 const p=page(9,true,{list:async()=>({data:[],pagination:{total:0}})});await p.loadEvents();assert.equal(p.data.events.length,0);assert.equal(p.data.eventsMore,false);assert.equal(p.data.eventsError,'');
 const failed=page(9,true,{list:async()=>{throw new Error('offline');}});await failed.loadEvents();assert.equal(failed.data.eventsError,'offline');assert.equal(failed.data.eventsMore,false);
});
test('SET首屏失败时不允许跳过第一页追加数据，重试保留现有失败原因',async()=>{
  let calls=0;const p=page(9,true,{list:async()=>{calls++;throw new Error('offline');}});
  p.data.setsMore=true;await p.loadSets();await p.loadSets(true);
  assert.equal(calls,1);assert.equal(p.data.setsMore,false);assert.equal(p.data.setsError,'offline');
});

test('DJ操作菜单按角色收拢：普通用户无添加SET，管理员可添加，访客仅分享',()=>{
 let sheet,urls=[];const wx={showActionSheet:o=>sheet=o,navigateTo:o=>urls.push(o.url)};
 const user=page(9,true,null,'user',wx);user.checkAdminStatus();user.openManageActions();assert.equal(sheet,undefined);
 user.openContributeActions();assert.ok(sheet.itemList.includes('djDetail.submitEvent'));assert.ok(!sheet.itemList.includes('djDetail.addSet'));
 sheet.success({tapIndex:0});assert.match(urls[0],/type=events/);user.goToContent({currentTarget:{dataset:{type:'sets'}}});assert.equal(urls.length,1);
 const admin=page(9,true,null,'admin',wx);admin.checkAdminStatus();admin.openManageActions();assert.equal(sheet.itemList[0],'djDetail.addSet');sheet.success({tapIndex:0});assert.match(urls[1],/type=sets/);
 sheet=undefined;const guest=page(9,true,null,'guest',wx);guest.checkAdminStatus();guest.openManageActions();guest.openContributeActions();assert.equal(sheet,undefined);
});
test('DJ直接分享返回主页，未登录的残留管理员资料不会显示管理按钮',()=>{
 const p=page(9);p.data.dj={name:'LIUYANG刘炀'};
 const share=p.onShareAppMessage({from:'button',target:{dataset:{}}});
 assert.equal(share.path,'/pages/dj-detail/dj-detail?id=9');assert.match(share.title,/LIUYANG/);
 p._testApp.globalData={userInfo:{role:'admin'}};p.checkAdminStatus();assert.equal(p.data.isAdmin,false);assert.equal(p.data.isLoggedIn,false);
});
