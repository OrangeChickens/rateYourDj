const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');
const calendar=require('../rateyourdj-miniprogram/utils/event-calendar');
const v=require('../rateyourdj-backend/src/utils/djContent');
const location=require('../rateyourdj-miniprogram/utils/event-location');
test('日历周末、跨月与闰年按日期运算，不受主机时区影响',()=>{
 assert.equal(calendar.add('2028-02-28',1),'2028-02-29');assert.equal(calendar.add('2026-12-31',1),'2027-01-01');
 assert.deepEqual(calendar.weekend('2026-10-23'),{from:'2026-10-24',to:'2026-10-25'});assert.deepEqual(calendar.weekend('2026-10-25'),{from:'2026-10-25',to:'2026-10-25'});
 assert.equal(calendar.days('2026-10-25')[0].weekday,'日');
});
test('同一坐标的多场活动归成一个标记，不把缺失坐标转换为零点',()=>{
 const rows=[{id:1,venue:'Club',latitude:31.2,longitude:121.4},{id:2,venue:'Club',latitude:'31.2',longitude:'121.4'},{id:3,latitude:null,longitude:null}];
 const markers=calendar.markers(rows);assert.equal(markers.length,1);assert.deepEqual(markers[0].eventIds,[1,2]);assert.equal(location.coordinates(rows[2]),null);
 assert.throws(()=>location.selected({name:'bad',address:'address',latitude:NaN,longitude:0}));
});
test('场地坐标成对校验，阵容去重且必须包含主DJ',()=>{
 const data={title:'Live',city:'上海市',venue:'Club',starts_at:'2030-01-01 00:30'};
 for(const point of [{latitude:1},{latitude:91,longitude:1},{latitude:true,longitude:false},{latitude:'bad',longitude:1}]) assert.throws(()=>v.eventData({...data,...point}));
 assert.equal(v.eventData(data).latitude,null);assert.equal(v.eventData({...data,latitude:31.2,longitude:121.4}).longitude,121.4);
 assert.deepEqual(v.lineup([3,2,3],1),[1,2,3]);assert.throws(()=>v.lineup([0],1));assert.throws(()=>v.lineup('3',1));
});
function page(api) {
 let p;vm.runInNewContext(fs.readFileSync(require.resolve('../rateyourdj-miniprogram/pages/events/events.js'),'utf8'),{Page:x=>p=x,require:name=>name.endsWith('dj-content')?api:name.endsWith('event-calendar')?calendar:location,wx:{navigateTo(){}},Number});
 p.data=JSON.parse(JSON.stringify(p.data));p.setData=function(data){Object.assign(this.data,data);};p.data.from=p.data.to='2030-01-01';return p;
}
test('活动筛选的旧响应不覆盖新城市，加载失败不跳页',async()=>{
 const pending=[];const p=page({events:query=>new Promise((resolve,reject)=>pending.push({query,resolve,reject}))});
 const old=p.load();p.data.city='上海市';const current=p.load();
 pending[0].resolve({data:[{id:1,starts_at:'2030-01-01 00:30'}],pagination:{total:1,totalPages:1}});await old;assert.equal(p.data.rows.length,0);assert.equal(p.data.loading,true);
 pending[1].reject(new Error('offline'));await current;assert.equal(p.data.error,'offline');await p.load(true);assert.equal(pending.length,2);
});
test('活动地图分页保留已加载活动并明确总量，坐标缺失项仍在列表',async()=>{
 let n=0;const p=page({events:async()=>({data:[{id:++n,starts_at:'2030-01-01 00:30',latitude:n===1?31:null,longitude:n===1?121:null}],pagination:{total:2,totalPages:2}})});
 await p.load();await p.load(true);assert.equal(p.data.rows.length,2);assert.equal(p.data.markers.length,1);assert.equal(p.data.unmapped,1);assert.equal(p.data.total,2);assert.equal(p.data.hasMore,false);
});
