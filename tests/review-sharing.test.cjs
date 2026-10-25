const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const shareHelper = require('../rateyourdj-miniprogram/utils/review-share');
function page(name, api = {}, wxOverrides = {}) {
  let definition;
  const wx = { hideShareMenu() {}, showShareMenu() {}, setNavigationBarTitle() {}, ...wxOverrides };
  const code = read(`rateyourdj-miniprogram/pages/${name}/${name}.js`).replace(/^import .*;\n/gm, '');
  vm.runInNewContext(code, { Page: x => definition = x, getApp: () => ({globalData:{}}), wx,
    reviewAPI: api, require: () => shareHelper, i18n: {t: key => key},
    formatDate: () => '2026-10-25', generateStars: x => ({full:x,empty:5-x}), console,
  });
  definition.data = JSON.parse(JSON.stringify(definition.data));
  definition.setData = function(data){Object.assign(this.data,data);};
  return definition;
}
function loadBackend(file, dependencies) {
  const context = { module:{exports:{}}, require: name => dependencies[name] || {} };
  vm.runInNewContext(read(file), context);
  return context.module.exports;
}
const row = {id: 123, dj_id: 7, dj_name: 'DJ TEST', dj_photo_url: 'https://example.invalid/a.jpg',
  overall_rating: 4, comment: '这是一条具体评价，不应跳到其他评价。', created_at: '2026-10-25', tags:[]};
test('公开单条SQL仅查询approved评价和DJ，匿名昵称/头像隐藏，不暴露账户ID',async()=>{
  const calls=[];
  const Review=loadBackend('rateyourdj-backend/src/models/Review.js',{
    '../config/database':{pool:{query:async(sql,params)=>{calls.push({sql,params:[...params]});return calls.length===1?[[{...row,is_anonymous:1,nickname:'真实昵称',avatar_url:'http://private.invalid/a',dj_photo_url:'http://example.invalid/a'}]]:[[{tag_name:'Techno'}]];}}}
  });
  const result=await Review.findPublicById(123);
  assert.match(calls[0].sql,/r.id = \? AND r.status = 'approved' AND d.status = 'approved'/);
  assert.deepEqual(calls[0].params,[123]);
  assert.doesNotMatch(calls[0].sql,/SELECT r\.\*/);
  assert.equal(result.nickname,'匿名用户');assert.equal(result.avatar_url,null);
  assert.equal(result.user_id,undefined);assert.match(result.dj_photo_url,/^https:/);
  assert.deepEqual(Array.from(result.tags),['Techno']);
});
test('未找到公开评价时不继续查询标签',async()=>{
  let queries=0;
  const Review=loadBackend('rateyourdj-backend/src/models/Review.js',{'../config/database':{pool:{query:async()=>{queries++;return [[]];}}}});
  assert.equal(await Review.findPublicById(999),null);assert.equal(queries,1);
});
test('公开接口无登录即可读取；非法ID为400，不存在/不可见为404',async()=>{
  let queryId;let value=row;
  const controller=loadBackend('rateyourdj-backend/src/controllers/reviewController.js',{
    '../models/Review':{findPublicById:async id=>{queryId=id;return value;}}
  });
  let body,status=200;const response={status(x){status=x;return this;},json(x){body=x;}};
  const next=e=>{throw e;};
  await controller.getReviewDetail({params:{id:'123'}},response,next);
  assert.equal(queryId,123);assert.equal(body.data.dj_id,7);assert.equal(status,200);
  for(const id of ['0','-1','123x','1 OR 1=1','9007199254740993']){
    queryId=null;await controller.getReviewDetail({params:{id}},response,next);
    assert.equal(status,400);assert.equal(queryId,null);
  }
  value=null;await controller.getReviewDetail({params:{id:'123'}},response,next);
  assert.equal(status,404);assert.equal(body.success,false);
});
test('旧分享参数直接重定向精确评价页，不加载默认列表',()=>{
  let url;const p=page('dj-detail',{}, {redirectTo:x=>url=x.url});
  p.onLoad({id:'7',reviewId:'123'});
  assert.equal(url,'/pages/review-detail/review-detail?id=123');
});
test('独立评价页不需登录，只按评价ID加载，刷新/跳转DJ正确',async()=>{
  const ids=[];let navigation;
  const p=page('review-detail',{getDetail:async id=>{ids.push(id);return {success:true,data:row};}}, {navigateTo:x=>navigation=x.url});
  await p.onLoad({id:'123'});
  assert.equal(p.data.review.comment,row.comment);assert.equal(p.data.review.dj_name,'DJ TEST');
  assert.deepEqual(ids,[123]);p.viewDJ();assert.equal(navigation,'/pages/dj-detail/dj-detail?id=7');
});
test('不可见、网络错误、非法ID不会显示旧内容，且可重试',async()=>{
  let call=0;
  const p=page('review-detail',{getDetail:async()=>{call++;throw Object.assign(new Error('not found'),{statusCode:404,code:'REVIEW_UNAVAILABLE'});}});
  await p.onLoad({id:'123'});assert.equal(p.data.error,'reviewDetail.unavailable');assert.equal(p.data.review,null);
  await p.loadReview();assert.equal(call,2);
  const invalid=page('review-detail',{getDetail:()=>{throw new Error('不应调用');}});
  invalid.onLoad({id:'bad'});assert.equal(invalid.data.loading,false);
  const network=page('review-detail',{getDetail:async()=>{throw new Error('offline');}});
  await network.onLoad({id:'123'});assert.equal(network.data.error,'reviewDetail.loadFailed');
});
test('评价ID不匹配时不展示，销毁后的响应不更新页面',async()=>{
  const mismatch=page('review-detail',{getDetail:async()=>({success:true,data:{...row,id:124}})});
  await mismatch.onLoad({id:'123'});assert.equal(mismatch.data.review,null);
  let resolve;const p=page('review-detail',{getDetail:()=>new Promise(r=>resolve=r)});
  const pending=p.onLoad({id:'123'});p.onUnload();resolve({success:true,data:row});await pending;
  assert.equal(p.data.review,null);
});
test('分享标题包含DJ及评价摘要，封面不支持时仍保留精确链接',async()=>{
  const share=shareHelper.createReviewShare(row,{name:'DJ TEST',photo_url:'https://example.invalid/dj.jpg'},{});
  assert.match(share.title,/DJ TEST.*4\/5.*这是一条具体评价/);
  assert.equal(share.path,'/pages/review-detail/review-detail?id=123');
  const resolved=await share.promise;assert.equal(resolved.path,share.path);assert.equal(resolved.imageUrl,share.imageUrl);
});
test('封面换行控制行数，长文本不溢出并带省略号',()=>{
  const ctx={measureText:text=>({width:Array.from(text).length*10})};
  const lines=shareHelper.wrapText(ctx,'这是很长的评价内容，应该限制封面行数并保留全文在详情页',100,2);
  assert.equal(lines.length,2);assert.ok(lines[1].endsWith('…'));assert.ok(lines.every(line=>ctx.measureText(line).width<=100));
});
test('分享按钮依然分享整条评价，详情页与旧页面的路由均已注册',()=>{
  const config=JSON.parse(read('rateyourdj-miniprogram/app.json'));
  assert.ok(config.pages.includes('pages/review-detail/review-detail'));
  assert.doesNotMatch(read('rateyourdj-miniprogram/pages/dj-detail/dj-detail.wxml'),/review-dj-name/);
  assert.match(read('rateyourdj-backend/src/routes/review.js'),/router.get\('\/detail\/:id', optionalAuth, getReviewDetail\)/);
  assert.match(read('rateyourdj-miniprogram/utils/api.js'),/getDetail\(id\)[\s\S]*?needAuth: false/);
});
test('封面绘制包含DJ、评分和评价摘要，生成的图片与评价链接一致',async()=>{
  const printed=[];let exported=0;
  const ctx={setFillStyle(){},fillRect(){},setStrokeStyle(){},setLineWidth(){},strokeRect(){},setFontSize(){},
    fillText:text=>printed.push(text),measureText:text=>({width:Array.from(text).length*12}),draw:(reserve,callback)=>callback()};
  const context={module:{exports:{}},setTimeout,clearTimeout,wx:{
    createCanvasContext:()=>ctx,
    canvasToTempFilePath:({success})=>success({tempFilePath:`/tmp/cover-${++exported}.png`})
  }};
  vm.runInNewContext(read('rateyourdj-miniprogram/utils/review-share.js'),context);
  const create=context.module.exports.createReviewShare;
  const p={};
  const a=create(row,{name:'DJ TEST'},p);
  const b=create({...row,id:124,comment:'第二条评价'},{name:'OTHER DJ'},p);
  const [first,second]=await Promise.all([a.promise,b.promise]);
  assert.equal(first.imageUrl,'/tmp/cover-1.png');assert.match(first.path,/id=123$/);
  assert.equal(second.imageUrl,'/tmp/cover-2.png');assert.match(second.path,/id=124$/);
  assert.ok(printed.includes('DJ TEST'));assert.ok(printed.includes('4 / 5'));assert.ok(printed.includes('OTHER DJ'));
  assert.ok(printed.some(x=>x.includes('这是一条具体评价')));
});
test('统一请求保留HTTP状态，分享页能区分不可查看与网络失败',async()=>{
  let app;
  vm.runInNewContext(read('rateyourdj-miniprogram/app.js').replace(/^import .*;\n/gm,''),{
    App:x=>app=x,wx:{request:options=>options.success({statusCode:404,data:{message:'评价不存在或暂不可查看',code:'REVIEW_UNAVAILABLE'}})},console
  });
  await assert.rejects(app.request({url:'/review/detail/123'}),{statusCode:404,code:'REVIEW_UNAVAILABLE'});
});
