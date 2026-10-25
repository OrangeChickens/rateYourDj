const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const videos = { 9: [{ id: 1, title: 'LIUYANG 视频', feed_token: 'token/ADRhgWPJw' }] };
const scene = require('../rateyourdj-miniprogram/utils/dj-scene');
function page(djId, supported = true, apiOverride = null) {
  let definition;
  const source = fs.readFileSync(path.join(root, 'rateyourdj-miniprogram/pages/dj-detail/dj-detail.js'), 'utf8').replace(/^import .*;\n/gm, '');
  vm.runInNewContext(source, {
    Page: p => definition = p, getApp: () => ({ globalData: {} }),
    require: name => name === '../../utils/dj-content' ? apiOverride || { list: async (id, type) => ({ success: true, data: type === 'sets' ? videos[id] || [] : [], pagination: {totalPages: 1} }) } : name === '../../utils/dj-scene' ? scene : {},
    wx: { canIUse: () => supported },
    djAPI: { getDetail: async () => ({ success: true, data: { id: djId, name: 'LIUYANG刘炀' } }) },
    showLoading() {}, hideLoading() {}, generateStars: () => ({ full: [], empty: [] }),
    console, setTimeout, i18n: { t: x => x }
  });
  definition.data = JSON.parse(JSON.stringify(definition.data));
  definition.data.djId = djId;
  definition.setData = function(data) { Object.assign(this.data, data); };
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

test('快速切换近期和往期演出时旧响应不覆盖新列表或解除新请求加载状态', async () => {
  const pending=[];
  const p=page(9,true,{list:(id,type,params)=>new Promise(resolve=>pending.push({params,resolve}))});
  const old=p.loadEvents();p.data.eventPeriod='past';const current=p.loadEvents();
  assert.equal(pending[0].params.period,'upcoming');assert.equal(pending[1].params.period,'past');
  pending[0].resolve({data:[{id:1}],pagination:{totalPages:1}});await old;
  assert.equal(p.data.eventsLoading,true);assert.equal(p.data.events.length,0);
  pending[1].resolve({data:[{id:2}],pagination:{totalPages:1}});await current;
  assert.equal(p.data.events[0].id,2);assert.equal(p.data.eventsLoading,false);
});
test('SET首屏失败时不允许跳过第一页追加数据，重试保留现有失败原因',async()=>{
  let calls=0;const p=page(9,true,{list:async()=>{calls++;throw new Error('offline');}});
  p.data.setsMore=true;await p.loadSets();await p.loadSets(true);
  assert.equal(calls,1);assert.equal(p.data.setsMore,false);assert.equal(p.data.setsError,'offline');
});
