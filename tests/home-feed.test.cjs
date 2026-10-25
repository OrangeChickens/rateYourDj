const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../rateyourdj-backend/src/services/reviewFeed'),'utf8');
const context={require:name=>name.includes('database')?{pool:{}}:require('../rateyourdj-backend/src/utils/djContent'),module:{exports:{}},Date,Math,Set};vm.runInNewContext(source,context);const {rank,options}=context.module.exports;
const row=(id,dj,age=0)=>({id,dj_id:dj,created_unix:1000000-age*86400,helpful_count:0,not_helpful_count:0,music_style:'House'});
test('推荐结合关注与新鲜度，评分高低不影响排序；候选足够时打散同DJ',()=>{
 const ranked=rank([row(1,1),row(2,2),row(3,1),row(4,1),row(5,3)], [{id:1,music_style:'House'}],1000000);
 assert.equal(ranked[0].dj_id,1);assert.equal(ranked[1].dj_id,1);assert.notEqual(ranked[2].dj_id,1);assert.equal(ranked[0].recommendation_reason,'你关注的 DJ');
 const scores=rank([{...row(1,1),overall_rating:5},{...row(2,2),overall_rating:1}],[],1000000);assert.equal(scores[0].id,2);
 assert.equal(rank([row(1,1,365),row(2,2)],[],1000000)[0].id,2);
});
test('推荐识别相近风格并拒绝无界分页、过期快照',()=>{
 assert.match(rank([row(1,2)],[{id:1,music_style:' House,Techno '}],1000000)[0].recommendation_reason,/风格相近/);
 const voted=rank([{...row(1,1,1),helpful_count:10},row(2,2)],[],1000000);assert.equal(voted[0].id,1);assert.equal(voted[0].recommendation_reason,'有帮助的评价');
 const negative=rank([{...row(1,1),helpful_count:1,not_helpful_count:10},row(2,2)],[],1000000);assert.equal(negative[0].id,2);assert.equal(negative[1].recommendation_reason,'最新评价');
 assert.throws(()=>options({limit:51}));assert.throws(()=>options({page:1001}));assert.throws(()=>options({asOf:1}));assert.throws(()=>options({asOf:Math.floor(Date.now()/1000)+120}));assert.throws(()=>options({page:0}));
});
function page(feed){let p;const app={globalData:{token:'fixture'}};vm.runInNewContext(fs.readFileSync(require.resolve('../rateyourdj-miniprogram/pages/index/index.js'),'utf8').replace(/^import .*;\n/gm,''),{Page:x=>p=x,require:()=>({}),getApp:()=>app,reviewAPI:{getFeed:feed},wx:{setStorageSync(){},switchTab(){}},console,Set});p.data=JSON.parse(JSON.stringify(p.data));p.setData=function(data){Object.assign(this.data,data);};return {p,app};}
test('切换关注Tab后旧推荐请求不覆盖新内容，分页失败不跳页',async()=>{
 const pending=[];const{p}=page((mode,params)=>new Promise((resolve,reject)=>pending.push({mode,params,resolve,reject})));
 const old=p.loadFeed();p.changeFeed({currentTarget:{dataset:{tab:'following'}}});
 pending[0].resolve({data:[{id:1}],pagination:{totalPages:1},asOf:100,following_count:0});await old;assert.equal(p.data.feedReviews.length,0);assert.equal(p.data.feedLoading,true);
 pending[1].resolve({data:[{id:2}],pagination:{totalPages:2},asOf:200,following_count:1});await new Promise(setImmediate);assert.equal(p.data.feedReviews[0].id,2);
 const more=p.loadFeed(true);assert.equal(pending[2].params.asOf,200);pending[2].reject(Error('offline'));await more;await p.loadFeed(true);assert.equal(pending.length,3);assert.equal(p.data.feedPage,1);
});
test('未登录关注页不发请求，登录后同一页结果去重且保留快照',async()=>{
 let calls=0;const {p,app}=page(async()=>{calls++;return{data:[{id:1},{id:1}],pagination:{totalPages:1},asOf:123,following_count:1};});
 p.data.activeFeed='following';app.globalData.token=null;await p.loadFeed();assert.equal(calls,0);assert.equal(p.data.feedLoggedIn,false);
 app.globalData.token='fixture';await p.loadFeed();assert.equal(p.data.feedReviews.length,1);assert.equal(p.data.feedAsOf,123);
});
function card(reviewAPI={},commentAPI={},wx={}){let c;const app={globalData:{token:'fixture',userInfo:{id:1}}};vm.runInNewContext(fs.readFileSync(require.resolve('../rateyourdj-miniprogram/components/feed-review/feed-review.js'),'utf8').replace(/^import .*;\n/gm,''),{Component:x=>c=x,getApp:()=>app,reviewAPI,commentAPI,formatDate:()=>'',wx:{showToast(){},...wx},Number,Math,Promise});const p={...c.methods,data:{...JSON.parse(JSON.stringify(c.data)),item:{id:1,dj_id:9,helpful_count:0,not_helpful_count:1,user_vote:'not_helpful',comment_count:0}},setData(data){Object.assign(this.data,data);},triggerEvent(){}};return {p,app};}
test('卡片投票串行，切换投票正确更新计数；失败保留原状态',async()=>{
 let resolve,calls=0;const {p}=card({markHelpful:()=>{calls++;return new Promise(r=>resolve=r);}});
 const request=p.vote({currentTarget:{dataset:{type:'helpful'}}});await p.vote({currentTarget:{dataset:{type:'helpful'}}});assert.equal(calls,1);resolve({success:true});await request;assert.equal(p.data.item.helpful_count,1);assert.equal(p.data.item.not_helpful_count,0);
 const failed=card({markHelpful:async()=>{throw Error('offline');}}).p;await failed.vote({currentTarget:{dataset:{type:'helpful'}}});assert.equal(failed.data.item.user_vote,'not_helpful');assert.equal(failed.data.voting,false);
});
test('待审评论展示审核原因且不增加公开评论数',async()=>{
 let create;const {p}=card({}, {create:async(...args)=>{create=args;return{data:{status:'pending',moderation_reason:'需核对内容'}};},getList:async()=>({data:[],pagination:{totalPages:0}})}, {showModal:o=>o.success?.({confirm:true,content:'a real comment'})});
 await p.reply({detail:{commentId:8,nickname:'DJ'}});assert.equal(create[2],8);assert.equal(p.data.feedback,'需核对内容');assert.equal(p.data.item.comment_count,0);assert.equal(p.data.sending,false);
});

test('公开评论发布后更新卡片和父列表计数，取消或无效输入不发送',async()=>{
 let calls=0,answer={confirm:true,content:'A useful comment'};const updates=[];
 const {p}=card({}, {create:async()=>{calls++;return{data:{status:'approved'}};},getList:async()=>({data:[],pagination:{totalPages:0}})}, {showModal:o=>o.success(answer)});
 p.triggerEvent=(name,data)=>updates.push({name,data});
 await p.writeComment();assert.equal(p.data.item.comment_count,1);assert.equal(updates[0].data.comment_count,1);assert.equal(p.data.feedback,'评论已发布');
 for(const invalid of [{confirm:false},{confirm:true,content:'  '},{confirm:true,content:'x'.repeat(501)}]){answer=invalid;await p.writeComment();assert.equal(p.data.sending,false);}
 assert.equal(calls,1);assert.equal(p.data.item.comment_count,1);
});

test('评论列表分页保留前页，较早请求不会覆盖重试后的结果',async()=>{
 const pending=[];const{p}=card({}, {getList:(id,page)=>new Promise((resolve,reject)=>pending.push({page,resolve,reject}))});
 const first=p.loadComments();pending[0].resolve({data:[{id:1,user_id:1,replies:[]}],pagination:{totalPages:2}});await first;
 assert.equal(p.data.comments[0].canDelete,true);
 const append=p.loadComments(true);assert.equal(pending[1].page,2);pending[1].resolve({data:[{id:2,user_id:2,replies:[]}],pagination:{totalPages:2}});await append;
 assert.deepEqual(Array.from(p.data.comments,c=>c.id),[1,2]);assert.equal(p.data.comments[1].canDelete,false);
 const old=p.loadComments(),fresh=p.loadComments();pending[3].resolve({data:[{id:3,replies:[]}],pagination:{totalPages:1}});await fresh;pending[2].resolve({data:[{id:4,replies:[]}],pagination:{totalPages:1}});await old;
 assert.equal(p.data.comments[0].id,3);assert.equal(p.data.commentsLoading,false);
 const failed=p.loadComments();pending[4].reject(Error('offline'));await failed;assert.equal(p.data.commentsError,'offline');assert.equal(p.data.commentsLoading,false);
});

test('评论投票请求未结束时防重复，失败后可再次操作且不清空讨论',async()=>{
 let reject,calls=0;const{p}=card({}, {vote:()=>{calls++;return new Promise((resolve,r)=>reject=r);},getList:async()=>({data:[],pagination:{totalPages:0}})});
 p.data.comments=[{id:8,content:'keep me'}];const first=p.commentVote({detail:{commentId:8}},'upvote');await p.commentVote({detail:{commentId:8}},'downvote');assert.equal(calls,1);
 reject(Error('offline'));await first;assert.equal(p.data.commentVoting,false);assert.equal(p.data.comments[0].content,'keep me');
 const retry=p.commentVote({detail:{commentId:8}},'upvote');assert.equal(calls,2);reject(Error('offline again'));await retry;assert.equal(p.data.commentVoting,false);
});

test('删除自己的评论扣除完整回复子树；失败或取消保留原计数',async()=>{
 let fail=false,calls=0,confirm=true;const updates=[];const{p}=card({}, {delete:async()=>{calls++;if(fail)throw Error('offline');},getList:async()=>({data:[],pagination:{totalPages:0}})},{showModal:o=>o.success({confirm})});
 p.triggerEvent=(name,data)=>updates.push(data);p.data.item.comment_count=5;p.data.comments=[{id:8,replies:[{id:9,replies:[{id:10,replies:[]}]}]},{id:11,replies:[]}];
 await p.deleteComment({detail:{commentId:8}});assert.equal(p.data.item.comment_count,2);assert.equal(updates[0].comment_count,2);
 p.data.comments=[{id:11,replies:[]}];fail=true;await p.deleteComment({detail:{commentId:11}});assert.equal(p.data.item.comment_count,2);assert.equal(p.data.comments[0].id,11);assert.equal(updates.length,1);
 confirm=false;await p.deleteComment({detail:{commentId:11}});assert.equal(calls,2);
});

test('回到首页时只在登录身份或收藏关系变化后刷新评价流',()=>{
 const{p,app}=page(async()=>{});let refreshes=0;p.loadFeed=()=>refreshes++;
 // This test exercises onShow, whose city restoration also reads storage.
 const source=fs.readFileSync(require.resolve('../rateyourdj-miniprogram/pages/index/index.js'),'utf8').replace(/^import .*;\n/gm,'');
 let definition;vm.runInNewContext(source,{Page:x=>definition=x,require:()=>({}),getApp:()=>app,wx:{getStorageSync:()=>undefined},console});
 definition.onShow.call(p);assert.equal(refreshes,0);definition.onShow.call(p);assert.equal(refreshes,0);
 app.globalData.homeFeedRevision=1;definition.onShow.call(p);assert.equal(refreshes,1);
 app.globalData.token='another-account';definition.onShow.call(p);assert.equal(refreshes,2);
 p.data.activeFeed='hot';app.globalData.homeFeedRevision=2;definition.onShow.call(p);assert.equal(refreshes,2);
});
