const {test}=require('node:test');const assert=require('node:assert/strict');const vm=require('node:vm');const fs=require('node:fs');const path=require('node:path');
function page(name,api={},wx={}){
 let p;const app={globalData:{token:'fixture',userInfo:{role:'admin'}}};
 const source=fs.readFileSync(path.join(__dirname,`../rateyourdj-miniprogram/pages/${name}/${name}.js`),'utf8').replace(/^import .*;\n/gm,'');
 vm.runInNewContext(source,{Page:value=>p=value,require:()=>api,getApp:()=>app,wx:{showToast(){},navigateBack(){},showModal(){},...wx},Date,Number,Promise,decodeURIComponent});
 p.data=JSON.parse(JSON.stringify(p.data));p.setData=function(data){Object.assign(this.data,data);};return{p,app};
}
test('投稿防重复提交，演出投稿收到待审提示和归属自己的记录',async()=>{
 let resolve,calls=0,payload;const modals=[];
 const{p}=page('dj-content',{create:(id,type,data)=>{calls++;payload=data;return new Promise(r=>resolve=r);},mine:async()=>({data:[{id:1,status:'pending'}],pagination:{totalPages:1}})},{showModal:o=>modals.push(o)});
 Object.assign(p.data,{type:'events',djId:9,loading:false,title:'Show',date:'2030-01-01',time:'20:00',city:'上海',venue:'Club'});
 const first=p.submit();await p.submit();assert.equal(calls,1);assert.equal(payload.starts_at,'2030-01-01 20:00');
 resolve({data:{status:'pending'}});await first;assert.equal(p.data.saving,false);assert.equal(p.data.myItems[0].status,'pending');assert.equal(modals[0].title,'已提交审核');
});
test('管理员编辑附带旧状态；未填写下架原因不会发出下架请求',async()=>{
 let update,moderations=0;const{p}=page('dj-content',{update:async(type,id,data)=>{update={type,id,data};return{success:true};},moderate:async()=>{moderations++;}},{showModal:o=>o.success({confirm:true,content:' '})});
 Object.assign(p.data,{isAdmin:true,entryId:7,djId:9,loading:false,title:'Edited',feed_token:'token/Video',expected_status:'approved'});
 await p.submit();assert.equal(update.id,7);assert.equal(update.data.expected_status,'approved');
 await p.withdraw();assert.equal(moderations,0);assert.equal(p.data.saving,false);
});
test('重复资料合并需确认，取消或空拒绝原因不会写入',async()=>{
 let confirmation={confirm:false},merges=0,moderations=0;
 const{p}=page('dj-content-review',{merge:async()=>{merges++;},moderate:async()=>{moderations++;},adminList:async()=>({data:[],pagination:{totalPages:0}})},{showModal:o=>o.success(confirmation)});
 Object.assign(p.data,{type:'duplicates',rows:[{id:1,dj_name:'Source',target_name:'Target',status:'pending'}]});
 await p.action({currentTarget:{dataset:{id:1,status:'approved'}}});assert.equal(merges,0);
 confirmation={confirm:true,content:' '};await p.action({currentTarget:{dataset:{id:1,status:'rejected'}}});assert.equal(moderations,0);
 confirmation={confirm:true};await p.action({currentTarget:{dataset:{id:1,status:'approved'}}});assert.equal(merges,1);assert.equal(p.data.busy,false);
});
test('审核列表旧响应不会覆盖切换后的内容',async()=>{
 const pending=[];const{p}=page('dj-content-review',{adminList:(type,status)=>new Promise(resolve=>pending.push({type,resolve}))});
 const old=p.load();p.data.type='events';const current=p.load();
 pending[0].resolve({data:[{id:1}],pagination:{totalPages:1}});await old;assert.equal(p.data.loading,true);assert.equal(p.data.rows.length,0);
 pending[1].resolve({data:[{id:2}],pagination:{totalPages:1}});await current;assert.equal(p.data.rows[0].id,2);
});
test('分享码按小程序版本选环境，下载失败可重试，保存失败保留图片',async()=>{
 let status=502;const envs=[];const{p}=page('dj-share-code',{codeURL:(id,env)=>{envs.push(env);return'https://fixture/code';}},{getAccountInfoSync:()=>({miniProgram:{envVersion:'trial'}}),downloadFile:o=>o.success({statusCode:status,tempFilePath:'/tmp/fixture-code'}),setNavigationBarTitle(){},saveImageToPhotosAlbum:o=>o.fail({errMsg:'permission denied'}),showModal(){}});
 p.onLoad({djId:'9',name:'DJ'});await new Promise(setImmediate);assert.equal(p.data.env,'trial');assert.ok(p.data.error);assert.equal(p.data.image,'');
 status=200;await p.loadCode();assert.equal(p.data.image,'/tmp/fixture-code');await p.save();assert.equal(p.data.image,'/tmp/fixture-code');assert.equal(p.data.saving,false);
 assert.ok(envs.every(env=>env==='trial'));
});

test('普通用户直接进入SET表单或伪造提交都被前端阻止',async()=>{
 let navigated=0,calls=0;const{p,app}=page('dj-content',{create:async()=>{calls++;}},{navigateBack:()=>navigated++});
 app.globalData.userInfo.role='user';p.onLoad({djId:'9',type:'sets'});assert.equal(navigated,1);
 Object.assign(p.data,{type:'sets',djId:9,loading:false,isAdmin:false,title:'Set',feed_token:'token/Video'});await p.submit();assert.equal(calls,0);
});
