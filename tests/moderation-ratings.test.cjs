const {test}=require('node:test');const assert=require('node:assert/strict');const vm=require('node:vm');const fs=require('node:fs');const path=require('node:path');
const root=path.resolve(__dirname,'..');const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const feedback=require('../rateyourdj-backend/src/services/moderationFeedback');
function load(file,deps){const context={module:{exports:{}},require:name=>{if(name in deps)return deps[name];if(name === '../utils/reviewRating')return require('../rateyourdj-backend/src/utils/reviewRating');return {};}};vm.runInNewContext(read(file),context);return context.module.exports;}
test('自动审核解释明确待人工确认，涵盖质量、关键词、内容安全和风控',()=>{
 assert.equal(feedback.pendingReason({safe:true},{quality:'ok'},{safe:true}),null);
 const reason=feedback.pendingReason({safe:false,category:'profanity'},{quality:'low',reason:'too_many_emoji'},{safe:false},['rate']);
 assert.match(reason,/疑似辱骂/);assert.match(reason,/表情或符号/);assert.match(reason,/尚未判定违规/);
 assert.doesNotMatch(reason,/rate|threshold|matched/);
});
test('拒绝必须给出原因，通过后清除旧拒绝原因',()=>{
 for(const reason of [undefined,null,'','  ',{},'x'.repeat(501)])assert.throws(()=>feedback.reviewReason('rejected',reason),{statusCode:400});
 assert.equal(feedback.reviewReason('rejected','  与音乐无关  '),'与音乐无关');
 assert.equal(feedback.reviewReason('approved','旧原因'),null);
});
test('评价/评论拒绝原因与状态同时保存，未给原因不写库',async()=>{
 for(const [file,table] of [['Review','reviews'],['Comment','review_comments']]){
  const calls=[];const Model=load(`rateyourdj-backend/src/models/${file}.js`,{
   '../config/database':{pool:{query:async(sql,params)=>{calls.push({sql,params:[...params]});return sql.startsWith('SELECT')?[[{dj_id:7}]]:[{affectedRows:1}];}}},
   '../services/moderationFeedback':feedback
  });
  await assert.rejects(Model.updateStatus(1,'rejected'),{statusCode:400});assert.equal(calls.length,0);
  await Model.updateStatus(1,'rejected','重复灌水');
  const update=calls.find(x=>x.sql.startsWith('UPDATE'));
  assert.match(update.sql,new RegExp(`UPDATE ${table} SET status = \\?, moderation_reason = \\?, moderated_at = NOW\\(\\)`));
  assert.deepEqual(update.params,['rejected','重复灌水',1]);
 }
});
test('我的评价仅按作者过滤，列表和总数均包含待审与拒绝',async()=>{
 const calls=[];const Review=load('rateyourdj-backend/src/models/Review.js',{'../config/database':{pool:{query:async(sql,params)=>{calls.push({sql,params:[...params]});return sql.includes('COUNT(*)')?[[{total:2}]]:[[]];}}}});
 await Review.findByUserId(7,1,10);
 for(const call of calls){assert.doesNotMatch(call.sql,/status = 'approved'/);assert.equal(call.params[0],7);}
});
test('审核反馈列表和总数都用当前作者身份过滤评价和评论',async()=>{
 const calls=[];const Feedback=load('rateyourdj-backend/src/models/ModerationFeedback.js',{'../config/database':{pool:{query:async(sql,params)=>{calls.push({sql,params:[...params]});return sql.includes('COUNT(*)')?[[{total:0}]]:[[]];}}}});
 await Feedback.findByUserId(9,2,20);
 assert.deepEqual(calls[0].params,[9,9,20,20]);assert.deepEqual(calls[1].params,[9,9]);
 for(const call of calls){assert.match(call.sql,/r.user_id = \?/);assert.match(call.sql,/c.user_id = \?/);}
});
test('评分刷新串行拿锁、全站原子更新，失败也释放连接与锁',async()=>{
 const {RATING_REFRESH_SQL}=require('../rateyourdj-backend/src/services/ratingQueries');
 for(const fail of [false,true]){
  const calls=[];const c={query:async sql=>{calls.push(sql);if(sql.includes('GET_LOCK'))return [[{acquired:1}]];if(sql===RATING_REFRESH_SQL&&fail)throw new Error('db fail');return [{affectedRows:5}];},release:()=>calls.push('release')};
  const service=load('rateyourdj-backend/src/services/ratingService.js',{'../config/database':{pool:{getConnection:async()=>c}},'./ratingQueries':{RATING_REFRESH_SQL}});
  if(fail)await assert.rejects(service.updateDJRatings(7),/db fail/);else await service.updateDJRatings(7);
  assert.match(calls[0],/GET_LOCK/);assert.equal(calls[1],RATING_REFRESH_SQL);assert.match(calls[2],/RELEASE_LOCK/);assert.equal(calls[3],'release');
 }
});
test('全站评分修复SQL和迁移一致，保留C=5和只纳入approved评价',()=>{
 const {RATING_REFRESH_SQL}=require('../rateyourdj-backend/src/services/ratingQueries');
 const migration=read('rateyourdj-backend/migrations/015_refresh_dj_ratings.sql').split('\n').slice(1).join('\n').trim();
 assert.equal(migration,RATING_REFRESH_SQL);assert.match(RATING_REFRESH_SQL,/5 \* g.global_avg/);assert.match(RATING_REFRESH_SQL,/a.n \+ 5/);
 assert.match(RATING_REFRESH_SQL,/WHERE status = 'approved' GROUP BY dj_id/);assert.doesNotMatch(RATING_REFRESH_SQL,/WHERE d.id/);
});
test('待审提交弹出原因，不增加公开评论数，拒绝分享个人未通过内容',()=>{
 assert.match(read('rateyourdj-miniprogram/pages/review-create/review-create.js'),/res.data.status === 'pending'[\s\S]*?wx.showModal/);
 assert.match(read('rateyourdj-miniprogram/pages/dj-detail/dj-detail.js'),/res.data.status === 'approved'/);
 assert.match(read('rateyourdj-miniprogram/pages/my-reviews/my-reviews.js'),/review.status !== 'approved'/);
});
test('管理员审核列表返回原因，普通公开列表不额外暴露审核字段',async()=>{
 for(const isAdmin of [false,true]){
  const calls=[];
  const Review=load('rateyourdj-backend/src/models/Review.js',{'../config/database':{pool:{query:async(sql)=>{calls.push(sql);return sql.includes('COUNT(*) as total')?[[{total:0}]]:[[]];}}}});
  await Review.getAllReviews({isAdmin,filter:'pending'});
  if(isAdmin)assert.match(calls[0],/r.moderation_reason, r.moderated_at/);
  else assert.doesNotMatch(calls[0],/r.moderation_reason/);
 }
});
