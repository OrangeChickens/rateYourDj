const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { getAccessToken } = require('./wechatService');
const { fail } = require('../utils/djContent');
const pending = new Map();
const cache = path.join(__dirname, '../../cache/dj-codes');
async function getCode(id, env) {
  if (!['trial', 'release'].includes(env)) throw fail('分享码版本无效');
  const key = `${id}-${env}`;
  if (pending.has(key)) return pending.get(key);
  if (pending.size >= 4) throw fail('分享码生成繁忙，请稍后再试', 429);
  const request = (async () => {
    await fs.mkdir(cache, { recursive: true });
    const file = path.join(cache, `${key}.image`);
    try { return await fs.readFile(file); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    let data;
    try {
      const token = await getAccessToken();
      const response = await axios.post('https://api.weixin.qq.com/wxa/getwxacodeunlimit', {
        page: 'pages/dj-detail/dj-detail', scene: `d=${id}`, env_version: env,
        check_path: true, width: 430
      }, { params: { access_token: token }, responseType: 'arraybuffer', timeout: 15000, maxContentLength: 2 * 1024 * 1024 });
      data = Buffer.from(response.data);
    } catch (_) { throw fail('生成分享码失败，请稍后重试', 502); }
    if (data.length < 8 || !(data.subarray(0, 8).toString('hex') === '89504e470d0a1a0a' || data.subarray(0, 3).toString('hex') === 'ffd8ff')) {
      throw fail('微信未返回分享码，请确认对应版本已发布或已设为体验版', 502);
    }
    const temporary = `${file}.${process.pid}.${Date.now()}.tmp`;
    await fs.writeFile(temporary, data);
    await fs.rename(temporary, file);
    return data;
  })();
  pending.set(key, request);
  try { return await request; } finally { pending.delete(key); }
}
module.exports = { getCode };
