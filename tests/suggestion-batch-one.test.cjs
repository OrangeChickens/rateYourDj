const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const { parseReviewRating } = require('../rateyourdj-backend/src/utils/reviewRating');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
function model(query) {
  const exports = {};
  const context = { module: { exports }, require: name => {
    if (name === '../config/database') return { pool: { query } };
    if (name === '../utils/reviewRating') return { parseReviewRating };
    if (name === '../services/moderationFeedback') return require('../rateyourdj-backend/src/services/moderationFeedback');
    throw new Error(name);
  } };
  vm.runInNewContext(read('rateyourdj-backend/src/models/Review.js'), context);
  return context.module.exports;
}
function page(name, api = {}, wx = {}) {
  let definition;
  const code = read(`rateyourdj-miniprogram/pages/${name}/${name}.js`).replace(/^import .*;\n/gm, '');
  vm.runInNewContext(code, {
    Page: x => definition = x, getApp: () => ({ globalData: {} }),
    reviewAPI: api, wx: { showToast() {}, ...wx }, i18n: { t: key => key, getLocale: () => 'zh-CN' },
    require: () => ({ version: '0.3.0-beta' }),
    showToast() {}, generateStars: () => ({ full: [], empty: [] }), formatDate: () => 'today',
    console: { log() {}, error() {} }, setTimeout: () => 0
  });
  definition.data = JSON.parse(JSON.stringify(definition.data));
  definition.setData = function (data) { Object.assign(this.data, data); };
  return definition;
}
const result = id => ({ success: true, data: [{ id, overall_rating: 4 }], pagination: { totalPages: 2 } });
test('只接受整数星级，空参数保持原行为，非法值返回400', () => {
  for (const x of [undefined, null, '']) assert.equal(parseReviewRating(x), null);
  for (let x = 1; x <= 5; x++) assert.equal(parseReviewRating(String(x)), x);
  for (const x of [0, 6, '1.5', '1 OR 1=1', '01', ['1'], {}, true]) {
    assert.throws(() => parseReviewRating(x), { statusCode: 400 });
  }
});
test('DJ筛选在SQL分页前执行，列表/计数同条件，保留登录投票及状态限制', async () => {
  const calls = [];
  const Review = model(async (sql, params) => { calls.push({sql, params: [...params]}); return sql.includes('SELECT COUNT(*) as total') ? [[{total: 11}]] : [[]]; });
  const r = await Review.findByDJId(7, { rating: '4', page: 2, limit: 10, sort: 'hot' }, 9);
  assert.match(calls[0].sql, /r.status = 'approved' AND r.overall_rating = \?/);
  assert.deepEqual(calls[0].params, [9, 7, 4, 10, 10]);
  assert.match(calls[1].sql, /r.status = 'approved' AND r.overall_rating = \?/);
  assert.deepEqual(calls[1].params, [7, 4]);
  assert.equal(r.pagination.totalPages, 2);
  calls.length = 0;
  await Review.findByDJId(7);
  assert.doesNotMatch(calls[0].sql, /r.overall_rating = \?/);
  assert.deepEqual(calls[0].params, [7, 20, 0]);
});
test('所有评价保留普通用户可见范围、管理员状态筛选及一致计数', async () => {
  for (const options of [{ rating: 1 }, {rating: 5, isAdmin: true, filter: 'pending'}]) {
    const calls = [];
    const Review = model(async (sql, params) => { calls.push({sql, params: [...params]}); return sql.includes('SELECT COUNT(*) as total') ? [[{total: 0}]] : [[]]; });
    await Review.getAllReviews(options);
    for (const c of calls) assert.match(c.sql, /AND r.overall_rating = \?/);
    if (options.isAdmin) assert.match(calls[0].sql, /r.status = 'pending'/);
    else assert.deepEqual(calls[1].params, ['approved', 1]);
    assert.deepEqual(calls[0].params.slice(0,-2), calls[1].params);
  }
});
for (const name of ['dj-detail', 'all-reviews']) {
  const method = name === 'dj-detail' ? 'getList' : 'getAllReviews';
  const list = name === 'dj-detail' ? 'reviews' : 'filteredReviews';
  const loading = name === 'dj-detail' ? 'reviewsLoading' : 'loading';
  test(`${name} 快速切换筛选不会被旧响应覆盖，翻页保留筛选`, async () => {
    const pending = [];
    const api = { [method]: (...args) => new Promise(resolve => pending.push({args, resolve})) };
    const p = page(name, api);
    const first = p.loadReviews();
    p.onRatingChange({ detail: { value: '2' } });
    assert.equal(pending.length, 2);
    assert.equal(p.data.rating, 4);
    pending[1].resolve(result(2));
    await new Promise(resolve => setImmediate(resolve));
    pending[0].resolve(result(1));
    await first;
    assert.equal(p.data[list][0].id, 2);
    assert.equal(p.data[loading], false);
    const next = p.loadReviews(true);
    const params = pending[2].args.at(-1);
    assert.equal(params.rating, 4); assert.equal(params.page, 2);
    pending[2].resolve(result(3)); await next;
    assert.deepEqual(Array.from(p.data[list], r => r.id), [2,3]);
    p.onRatingChange({ detail: { value: '0' } });
    assert.equal(p.data.rating, null);
    assert.equal(pending[3].args.at(-1).page, 1);
    pending[3].resolve(result(4));
    await new Promise(resolve => setImmediate(resolve));
  });
}
test('真实头像打开预览，缺少头像不打开', () => {
  const calls = []; const p = page('dj-detail', {}, { previewImage: x => calls.push(x) });
  p.previewDJPhoto(); assert.equal(calls.length, 0);
  p.data.dj = { photo_url: 'https://example.invalid/photo.jpg' }; p.previewDJPhoto();
  assert.equal(calls[0].current, p.data.dj.photo_url);
  assert.deepEqual(Array.from(calls[0].urls), [p.data.dj.photo_url]);
});
test('关于菜单和弹窗读取同一版本配置，年份不写死', () => {
  let modal; const p = page('settings', {}, { showModal: x => modal = x });
  p.showAbout();
  assert.equal(p.data.version, '0.3.0-beta');
  assert.match(modal.content, /0\.3\.0-beta/);
  assert.ok(modal.content.includes(String(new Date().getFullYear())));
  assert.match(read('rateyourdj-miniprogram/pages/settings/settings.wxml'), /v\{\{version\}\}/);
});
test('非法筛选在模型查询前拒绝', async () => {
  let queries = 0;
  const Review = model(async () => {queries++;return [[]];});
  await assert.rejects(Review.findByDJId(1,{rating:'1 OR 1=1'}),{statusCode:400});
  await assert.rejects(Review.getAllReviews({rating:['5']}),{statusCode:400});
  assert.equal(queries,0);
});
test('两个接口传递筛选值，非法参数交给现有错误中间件返回400', async () => {
  let options;const context={module:{exports:{}},console,require:name=>{
    if(name==='../models/Review')return {
      findByDJId:async(id,o)=>{options=o;return {data:[],pagination:{}};},
      getAllReviews:async o=>{options=o;return {data:[],pagination:{}};}
    };
    if(name==='../utils/reviewRating')return {parseReviewRating};
    return {};
  }};
  vm.runInNewContext(read('rateyourdj-backend/src/controllers/reviewController.js'),context);
  const controller=context.module.exports;
  for(const method of ['getDJReviews','getAllReviews']) {
    let error;let result;
    const response={json:x=>result=x};
    await controller[method]({params:{djId:1},query:{rating:'2'}},response,e=>error=e);
    assert.equal(options.rating,2);assert.equal(result.success,true);assert.equal(error,undefined);
    await controller[method]({params:{djId:1},query:{rating:'6'}},response,e=>error=e);
    assert.equal(error.statusCode,400);
  }
});
for (const name of ['dj-detail','all-reviews']) {
  test(`${name} 旧请求先返回不解除新请求加载状态，首屏失败不跳到第二页`,async()=>{
    const loading=name==='dj-detail'?'reviewsLoading':'loading';
    const method=name==='dj-detail'?'getList':'getAllReviews';
    const pending=[];
    const p=page(name,{[method]:()=>new Promise((resolve,reject)=>pending.push({resolve,reject}))});
    const first=p.loadReviews();
    p.onRatingChange({detail:{value:'5'}});
    pending[0].resolve(result(1));await first;
    assert.equal(p.data[loading],true);assert.equal(p.data.hasMore,false);
    pending[1].reject(new Error('network'));
    await new Promise(resolve=>setImmediate(resolve));
    assert.equal(p.data[loading],false);assert.equal(p.data.currentPage,1);assert.equal(p.data.hasMore,false);
  });
}
