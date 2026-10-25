const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const v = require('../rateyourdj-backend/src/utils/djContent');
const root = path.resolve(__dirname, '..');
test('视频引用支持粘贴文本，拒绝普通URL、多个token和截断的无效token', () => {
  assert.equal(v.setData({ title:' set ', feed_token:'引用内容 token/ADRhgWPJw' }).feed_token,'token/ADRhgWPJw');
  for (const raw of ['https://example.com/video', 'token/a token/b', 'token/a$bad','token/' + 'a'.repeat(201)]) assert.throws(() => v.setData({title:'set',feed_token:raw}), {statusCode:400});
  assert.throws(() => v.setData({title:' ',feed_token:'token/a'}));
});
test('演出验证真实日历时间和HTTPS来源，保留北京时间不依赖本机时区', () => {
  const event = {title:'Live',city:'上海',venue:'Club',starts_at:'2028-02-29 23:00',source_url:'https://example.com/show'};
  assert.equal(v.eventData(event).starts_at,'2028-02-29 23:00:00');
  for (const starts_at of ['2027-02-29 23:00','2026-13-01 12:00','2026-01-01 24:01','2026-01-01 12:60']) assert.throws(()=>v.eventData({...event,starts_at}));
  for (const source_url of ['javascript:alert(1)','http://example.com','https://user:pass@example.com']) assert.throws(()=>v.eventData({...event,source_url}));
});
test('动态表名仅白名单，分页与ID拒绝注入和无界读取', () => {
  for(const name of ['sets','events','duplicates']) assert.equal(v.kind(name),name);
  assert.throws(()=>v.kind('sets; DROP TABLE djs'));
  for(const id of ['0','1 OR 1=1','1.2','9007199254740993']) assert.throws(()=>v.id(id));
  assert.throws(()=>v.paging({limit:51}));
});
function qrModule(post) {
  const files = new Map();
  const context = {module:{exports:{}},Buffer,process:{pid:1},Date,__dirname:'/fixture',Map,require:name => ({
    axios:{post}, fs:{promises:{mkdir:async()=>{},readFile:async file=>{if(files.has(file))return files.get(file);throw Object.assign(new Error(),{code:'ENOENT'});},writeFile:async(f,b)=>files.set(f,b),rename:async(a,b)=>files.set(b,files.get(a))}},
    path, './wechatService':{getAccessToken:async()=> 'private-access-token'}, '../utils/djContent':v
  })[name]};
  vm.runInNewContext(fs.readFileSync(path.join(root,'rateyourdj-backend/src/services/djShareCode.js'),'utf8'),context);
  return context.module.exports;
}
test('分享码按DJ与环境缓存，并发请求复用；scene跳回该DJ', async () => {
  const calls=[];const png=Buffer.from('89504e470d0a1a0a00','hex');
  const mod=qrModule(async(url,body)=>{calls.push(body);return {data:png};});
  await Promise.all([mod.getCode(9,'trial'),mod.getCode(9,'trial')]);
  await mod.getCode(9,'trial');await mod.getCode(9,'release');
  assert.equal(calls.length,2);assert.equal(calls[0].scene,'d=9');assert.equal(calls[0].env_version,'trial');assert.equal(calls[1].env_version,'release');
});
test('分享码接受JPEG，微信错误JSON和网络错误不写缓存、不泄露凭据',async()=>{
  const jpeg=Buffer.from('ffd8ff000000000000','hex');assert.deepEqual(await qrModule(async()=>({data:jpeg})).getCode(9,'release'),jpeg);
  const mod=qrModule(async()=>({data:Buffer.from('{"errcode":1}')}));await assert.rejects(mod.getCode(9,'trial'),{statusCode:502});
  const error=await qrModule(async()=>{throw new Error('private-access-token');}).getCode(9,'trial').catch(e=>e);
  assert.doesNotMatch(error.message,/private-access-token/);
});
